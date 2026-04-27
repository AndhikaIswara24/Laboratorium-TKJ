'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  condition: string;
  qrCodeUrl: string | null;
  acquisitionDate: string;
  createdAt: string;
  borrowings: any[];
  monitorings: any[];
}

export default function ItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItem();
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${params.id}`);
      if (!response.ok) {
        throw new Error('Item tidak ditemukan');
      }
      const data = await response.json();
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;

    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus barang');
      }

      router.push('/admin/inventory');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getConditionColor = (condition: string) => {
    const colors: { [key: string]: string } = {
      GOOD: 'bg-green-100 text-green-800',
      MINOR_DAMAGE: 'bg-yellow-100 text-yellow-800',
      MAJOR_DAMAGE: 'bg-orange-100 text-orange-800',
      BROKEN: 'bg-red-100 text-red-800',
      LOST: 'bg-gray-100 text-gray-800',
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Memuat data...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error || 'Item tidak ditemukan'}</p>
        <Link href="/admin/inventory" className="text-red-600 hover:text-red-900 text-sm mt-2 inline-block">
          ← Kembali ke Inventaris
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Non-print header */}
      <div className="mb-8 print:hidden">
        <Link href="/admin/inventory" className="text-blue-600 hover:text-blue-900 text-sm mb-4 inline-block">
          ← Kembali
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{item.name}</h1>
            <p className="text-gray-600">Kode: {item.code}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              🖨️ Cetak QR Code
            </button>
            <Link
              href={`/admin/inventory/${item.id}/edit`}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              ✏️ Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Item Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Informasi Barang</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Kode Barang</p>
                <p className="font-semibold text-lg">{item.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nama Barang</p>
                <p className="font-semibold text-lg">{item.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deskripsi</p>
                <p className="text-gray-700">{item.description || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Kategori</p>
                  <p className="font-semibold">{item.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jumlah Stok</p>
                  <p className="font-semibold text-lg">{item.quantity}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kondisi</p>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getConditionColor(item.condition)}`}>
                    {item.condition}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Tanggal Diperoleh</p>
                  <p className="font-semibold">{new Date(item.acquisitionDate).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Terdaftar Sejak</p>
                  <p className="font-semibold">{new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg shadow-md p-4">
              <p className="text-sm text-blue-600 mb-1">Total Peminjaman</p>
              <p className="text-3xl font-bold text-blue-700">{item.borrowings.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-md p-4">
              <p className="text-sm text-green-600 mb-1">Total Monitoring</p>
              <p className="text-3xl font-bold text-green-700">{item.monitorings.length}</p>
            </div>
          </div>
        </div>

        {/* Right Column - QR Code */}
        <div className="space-y-6">
          {/* QR Code Section */}
          {item.qrCodeUrl ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center print:p-2 print:shadow-none">
              <h3 className="text-xl font-bold mb-4 print:mb-2">QR Code</h3>
              <div className="flex justify-center mb-4 print:mb-2">
                <img
                  src={item.qrCodeUrl}
                  alt="QR Code"
                  className="w-56 h-56 print:w-48 print:h-48 border-2 border-gray-200"
                />
              </div>
              <p className="text-sm text-gray-600">{item.code}</p>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500">QR Code tidak tersedia</p>
            </div>
          )}

          {/* Print Info */}
          <div className="hidden print:block bg-gray-50 p-4 text-center text-sm">
            <p className="font-semibold mb-1">{item.name}</p>
            <p className="text-gray-600">Kode: {item.code}</p>
            <p className="text-gray-600 text-xs mt-2">
              Dicetak: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Borrowing History */}
      <div className="mt-8 print:hidden">
        <h2 className="text-2xl font-bold mb-4">Riwayat Peminjaman</h2>
        {item.borrowings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Belum ada peminjaman
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Peminjam</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Tgl Pinjam</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {item.borrowings.map((borrowing) => (
                  <tr key={borrowing.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{borrowing.userId}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(borrowing.borrowDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        {borrowing.status}
                      </span>
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
