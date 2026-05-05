"use client";

import { useEffect, useState } from "react";
import { Download } from 'lucide-react';

export default function PeminjamanReportPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch data laporan peminjaman dari server
        fetch('/api/reports/borrowings')
            .then((res) => res.json())
            .then((res) => setData(res || []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleExport = async () => {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(data.map((r, i) => ({
            No: i + 1,
            Peminjam: r.borrowerName,
            Email: r.borrowerEmail,
            Barang: r.itemName,
            Kode: r.itemCode,
            Jumlah: r.quantity,
            TanggalPinjam: r.borrowDate ? new Date(r.borrowDate).toISOString() : '',
            BatasKembali: r.expectedReturnDate ? new Date(r.expectedReturnDate).toISOString() : '',
            TanggalKembali: r.actualReturnDate ? new Date(r.actualReturnDate).toISOString() : '',
            Status: r.status,
            Catatan: r.notes,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan Peminjaman');
        XLSX.writeFile(wb, `Laporan_Peminjaman_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold mb-4">Laporan Peminjaman</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="mb-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Ekspor Excel
                    </button>
                    <button
                        onClick={handlePrint}
                        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Cetak Laporan
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Memuat laporan...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Peminjam</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Barang</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kode</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Jumlah</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tgl Pinjam</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Batas Kembali</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tgl Kembali</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.borrowerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.borrowerEmail || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemName || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.itemCode || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.borrowDate ? new Date(item.borrowDate).toLocaleString('id-ID') : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expectedReturnDate ? new Date(item.expectedReturnDate).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.actualReturnDate ? new Date(item.actualReturnDate).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}