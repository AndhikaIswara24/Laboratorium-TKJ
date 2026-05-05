'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getItemConditionLabel } from '@/lib/labels';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  condition: string;
}

interface BorrowFormData {
  expectedReturnDate: string;
  notes: string;
}

export default function BorrowItemPage({
  params,
}: {
  params: { id: string };
}) {
  // Halaman formulir peminjaman untuk siswa (client)
  // - Memuat data barang berdasarkan `params.id`
  // - Menyediakan form pengajuan peminjaman yang mengirim POST ke `/api/borrowings`
  const router = useRouter();
  const { data: session } = useSession();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<BorrowFormData>({
    expectedReturnDate: '',
    notes: '',
  });

  // Calculate minimum return date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const fetchItem = useCallback(async () => {
    try {
      const response = await fetch(`/api/items/${params.id}`);
      if (!response.ok) {
        throw new Error('Barang tidak ditemukan');
      }
      const data = await response.json();
      setItem(data);
      
      // Set default return date to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        expectedReturnDate: defaultDate.toISOString().split('T')[0],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat barang');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!item || !session?.user?.id) {
      setError('Data tidak lengkap');
      return;
    }

    if (!formData.expectedReturnDate) {
      setError('Tanggal kembali harus diisi');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/borrowings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          expectedReturnDate: formData.expectedReturnDate,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat permintaan peminjaman');
      }

      // Success - redirect to borrowing list
      router.push('/siswa/borrowings?success=Permintaan peminjaman berhasil dibuat');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat peminjaman');
    } finally {
      setSubmitting(false);
    }
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
        <p className="text-gray-500">Memuat data barang...</p>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <Link
          href="/siswa"
          className="text-red-600 hover:text-red-900 text-sm mt-2 inline-block"
        >
          Kembali ke Dasbor
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Barang tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/siswa" className="text-blue-600 hover:text-blue-900 text-sm mb-4 inline-block">
          Kembali ke Dasbor
        </Link>
        <h1 className="text-4xl font-bold mb-2">Ajukan Peminjaman Barang</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Peminjam
              </label>
              <input
                type="text"
                value={session?.user?.name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Barang yang Akan Dipinjam <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={item.name}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
              <p className="text-sm text-gray-600 mt-1">Kode: {item.code}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Pengembalian <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="expectedReturnDate"
                value={formData.expectedReturnDate}
                onChange={handleInputChange}
                min={getMinDate()}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-600 mt-1">
                Pilih tanggal paling lambat barang harus dikembalikan
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catatan Tambahan
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Contoh: Untuk praktik laboratorium TKJ..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {submitting ? 'Mengirim...' : '✓ Ajukan Peminjaman'}
              </button>
              <Link
                href="/siswa"
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                Batalkan
              </Link>
            </div>
          </form>

          {/* Terms */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Ketentuan Peminjaman</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Barang harus dikembalikan tepat pada tanggal yang ditentukan</li>
              <li>Peminjam bertanggung jawab atas kondisi barang</li>
              <li>Jika terjadi kerusakan, akan ada penilaian lebih lanjut</li>
              <li>Keterlambatan pengembalian akan dicatat dalam sistem</li>
            </ul>
          </div>
        </div>

        {/* Summary Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6 space-y-4">
            <h2 className="text-2xl font-bold">Ringkasan Barang</h2>

            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Kategori</p>
                <p className="font-semibold">{item.category}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Stok Tersedia</p>
                <p className="text-2xl font-bold text-green-600">{item.quantity}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Kondisi Barang</p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getConditionColor(
                      item.condition
                    )}`}
                  >
                    {getItemConditionLabel(item.condition)}
                  </span>
                </div>
              </div>

              {item.description && (
                <div>
                  <p className="text-sm text-gray-600">Deskripsi</p>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-600 mb-2">📌 Status Persetujuan</p>
              <p className="text-sm font-semibold text-gray-700">
                Menunggu persetujuan dari admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
