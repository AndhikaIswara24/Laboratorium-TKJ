"use client";

import { Download } from 'lucide-react';

interface ExportData {
  id: string;
  Peminjam: string;
  Barang: string;
  KodeBarang: string;
  Jumlah: number;
  TanggalPinjam: string;
  BatasWaktu: string;
  TanggalKembali: string | null;
  Status: string;
  Catatan: string;
}

interface ExportExcelButtonProps {
  data: ExportData[];
}

export function ExportExcelButton({ data }: ExportExcelButtonProps) {
  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Peminjaman");
    XLSX.writeFile(wb, `Riwayat_Peminjaman_Lab_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
    >
      <Download className="w-4 h-4" />
      Export ke Excel
    </button>
  );
}
