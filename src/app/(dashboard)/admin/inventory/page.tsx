import Link from 'next/link';
import prisma from '@/lib/prisma';
import { ItemCondition } from '@prisma/client';
import { Eye, Package, Plus, QrCode } from 'lucide-react';
import { InventoryImportButton } from '@/components/dashboard/InventoryImportButton';

const conditionLabels: Record<ItemCondition, string> = {
  GOOD: 'Baik',
  MINOR_DAMAGE: 'Rusak Ringan',
  MAJOR_DAMAGE: 'Rusak Berat',
  BROKEN: 'Tidak Berfungsi',
  LOST: 'Hilang',
};

const conditionStyles: Record<ItemCondition, string> = {
  GOOD: 'bg-green-50 text-green-700 ring-green-600/20',
  MINOR_DAMAGE: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  MAJOR_DAMAGE: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  BROKEN: 'bg-red-50 text-red-700 ring-red-600/20',
  LOST: 'bg-gray-50 text-gray-700 ring-gray-600/20',
};

export default async function AdminInventoryPage() {
  const items = await prisma.inventoryItem.findMany({
    include: {
      _count: {
        select: {
          borrowings: true,
          monitorings: true,
        },
      },
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  const totalStock = items.reduce((total, item) => total + item.quantity, 0);
  const categoriesCount = new Set(items.map((item) => item.category)).size;
  const unavailableCount = items.filter(
    (item) => item.condition === ItemCondition.BROKEN || item.condition === ItemCondition.LOST
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Kembali ke Dasbor
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Kelola Inventaris</h1>
          <p className="mt-1 text-gray-500">Pantau stok, kondisi, QR code, dan riwayat tiap barang lab TKJ.</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row md:items-start">
          <InventoryImportButton />
          <Link
            href="/admin/evaluasi"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Evaluasi Barang
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Barang</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Stok</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalStock}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Kategori / Tidak Tersedia</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {categoriesCount} / {unavailableCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <Package className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Daftar Barang</h2>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Belum ada barang inventaris.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Barang</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stok</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kondisi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aktivitas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{item.code}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="mt-1 max-w-sm truncate text-xs text-gray-500">{item.description || '-'}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{item.category}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{item.quantity}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${conditionStyles[item.condition]}`}
                      >
                        {conditionLabels[item.condition]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {item._count.borrowings} pinjam, {item._count.monitorings} monitoring
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {item.qrCodeUrl && <QrCode className="h-4 w-4 text-gray-400" aria-label="QR tersedia" />}
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
