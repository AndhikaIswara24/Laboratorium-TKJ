import { NextRequest, NextResponse } from 'next/server';
import { Prisma, ItemCondition } from '@prisma/client';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Route untuk mengimpor data inventaris dari file Excel.
 * Berikut langkah utamanya:
 * - Validasi session (admin)
 * - Baca file XLSX dan parsing setiap baris
 * - Validasi tiap baris, map kolom alias
 * - Simpan item baru ke database dan generate QR code
 */

type RawRow = Record<string, unknown>;

interface ParsedInventoryRow {
  rowNumber: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  condition?: ItemCondition;
  conditionScore?: number;
  repairsCount?: number;
  acquisitionDate?: Date;
}

const conditionMap: Record<string, ItemCondition> = {
  GOOD: ItemCondition.GOOD,
  BAIK: ItemCondition.GOOD,
  MINOR_DAMAGE: ItemCondition.MINOR_DAMAGE,
  RUSAK_RINGAN: ItemCondition.MINOR_DAMAGE,
  'RUSAK RINGAN': ItemCondition.MINOR_DAMAGE,
  MAJOR_DAMAGE: ItemCondition.MAJOR_DAMAGE,
  RUSAK_BERAT: ItemCondition.MAJOR_DAMAGE,
  'RUSAK BERAT': ItemCondition.MAJOR_DAMAGE,
  BROKEN: ItemCondition.BROKEN,
  RUSAK: ItemCondition.BROKEN,
  LOST: ItemCondition.LOST,
  HILANG: ItemCondition.LOST,
};

function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function getValue(row: RawRow, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeKey);
  const entry = Object.entries(row).find(([key]) => normalizedAliases.includes(normalizeKey(key)));
  return entry?.[1];
}

function toText(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toOptionalNumber(value: unknown) {
  const text = toText(value);
  if (!text) return undefined;

  const numberValue = Number(text);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function toQuantity(value: unknown) {
  const numberValue = toOptionalNumber(value);
  if (numberValue === undefined || numberValue < 1) return 1;
  return Math.floor(numberValue);
}

function toCondition(value: unknown) {
  const text = toText(value);
  if (!text) return undefined;

  return conditionMap[text.toUpperCase().replace(/\s+/g, '_')] ?? conditionMap[text.toUpperCase()];
}

function toDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  const text = toText(value);
  if (!text) return undefined;

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseInventoryRows(rows: RawRow[]) {
  const parsedRows: ParsedInventoryRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  const seenCodes = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const code = toText(getValue(row, ['code', 'kode', 'kode barang', 'kode_barang']));
    const name = toText(getValue(row, ['name', 'nama', 'nama barang', 'nama_barang']));
    const category = toText(getValue(row, ['category', 'kategori']));

    if (!code || !name || !category) {
      errors.push({ row: rowNumber, message: 'Kolom code, name, dan category wajib diisi.' });
      return;
    }

    if (seenCodes.has(code)) {
      errors.push({ row: rowNumber, message: `Kode ${code} duplikat di file.` });
      return;
    }

    seenCodes.add(code);

    const conditionScore = toOptionalNumber(
      getValue(row, ['conditionScore', 'condition score', 'skor kondisi', 'skor_kondisi'])
    );

    if (conditionScore !== undefined && (conditionScore < 1 || conditionScore > 5)) {
      errors.push({ row: rowNumber, message: 'Skor kondisi harus bernilai 1 sampai 5.' });
      return;
    }

    const repairsCount = toOptionalNumber(
      getValue(row, ['repairsCount', 'repairs count', 'jumlah perbaikan', 'jumlah_perbaikan'])
    );

    parsedRows.push({
      rowNumber,
      code,
      name,
      description: toText(getValue(row, ['description', 'deskripsi'])) || null,
      category,
      quantity: toQuantity(getValue(row, ['quantity', 'jumlah', 'stok'])),
      condition: toCondition(getValue(row, ['condition', 'kondisi'])),
      conditionScore: conditionScore === undefined ? undefined : Math.floor(conditionScore),
      repairsCount: repairsCount === undefined ? undefined : Math.max(0, Math.floor(repairsCount)),
      acquisitionDate: toDate(getValue(row, ['acquisitionDate', 'acquisition date', 'tanggal diperoleh', 'tanggal_diperoleh'])),
    });
  });

  return { parsedRows, errors };
}

async function generateQrCode(item: { id: string; code: string; name: string }) {
  const qrData = JSON.stringify({
    itemId: item.id,
    code: item.code,
    name: item.name,
    timestamp: new Date().toISOString(),
  });

  return QRCode.toDataURL(qrData);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diunggah.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { cellDates: true, type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json({ error: 'File tidak memiliki sheet.' }, { status: 400 });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '' });
    const { parsedRows, errors } = parseInventoryRows(rows);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { imported: 0, failed: errors.length, errors: errors.slice(0, 20) },
        { status: 400 }
      );
    }

    const existingItems = await prisma.inventoryItem.findMany({
      where: {
        code: {
          in: parsedRows.map((row) => row.code),
        },
      },
      select: {
        code: true,
      },
    });
    const existingCodes = new Set(existingItems.map((item) => item.code));

    const importErrors = [...errors];
    let imported = 0;

    for (const row of parsedRows) {
      if (existingCodes.has(row.code)) {
        importErrors.push({ row: row.rowNumber, message: `Kode ${row.code} sudah ada di database.` });
        continue;
      }

      try {
        const item = await prisma.inventoryItem.create({
          data: {
            code: row.code,
            name: row.name,
            description: row.description,
            category: row.category,
            quantity: row.quantity,
            ...(row.condition && { condition: row.condition }),
            ...(row.conditionScore !== undefined && { conditionScore: row.conditionScore }),
            ...(row.repairsCount !== undefined && { repairsCount: row.repairsCount }),
            ...(row.acquisitionDate && { acquisitionDate: row.acquisitionDate }),
            qrCodeUrl: null,
          },
        });

        try {
          const qrCodeUrl = await generateQrCode(item);
          await prisma.inventoryItem.update({
            where: { id: item.id },
            data: { qrCodeUrl },
          });
        } catch (error) {
          console.error('Error generating imported item QR code:', error);
        }

        existingCodes.add(row.code);
        imported += 1;
      } catch (error) {
        const message =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
            ? `Kode ${row.code} sudah ada di database.`
            : 'Gagal menyimpan baris ini.';

        importErrors.push({ row: row.rowNumber, message });
      }
    }

    return NextResponse.json({
      imported,
      failed: importErrors.length,
      errors: importErrors.slice(0, 20),
    });
  } catch (error) {
    console.error('Error importing inventory:', error);
    return NextResponse.json({ error: 'Gagal mengimpor inventaris.' }, { status: 500 });
  }
}
