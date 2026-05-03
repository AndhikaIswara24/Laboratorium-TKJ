'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getItemConditionLabel } from '@/lib/labels';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  condition: string;
  borrowings: any[];
}

export default function BorrowListPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Gagal memuat daftar barang');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <p className="text-gray-500">Memuat daftar barang...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/siswa" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Kembali ke Dasbor
        </Link>
        <span className="hidden">
          ← Kembali ke QR Scanner
        </span>
        <h1 className="mt-2 text-4xl font-bold mb-2">Daftar Barang - Pilih Sendiri</h1>
        <p className="text-gray-600">Pilih barang yang ingin Anda pinjam dari daftar di bawah ini.</p>
      </div>

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari barang berdasarkan nama, kode, atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            {items.length === 0 ? 'Tidak ada barang tersedia' : 'Barang yang Anda cari tidak ditemukan'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-4">Kode: {item.code}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Kategori</span>
                    <span className="text-sm font-semibold">{item.category}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stok</span>
                    <span
                      className={`text-sm font-bold ${
                        item.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.quantity}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kondisi</span>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getConditionColor(
                        item.condition
                      )}`}
                    >
                      {getItemConditionLabel(item.condition)}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{item.description}</p>
                )}

                <Link
                  href={`/siswa/borrow/${item.id}`}
                  className={`block w-full text-center py-2 px-4 rounded-lg font-semibold transition-colors ${
                    item.quantity > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {item.quantity > 0 ? 'Pinjam Barang' : 'Stok Habis'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
