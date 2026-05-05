"use client";

import { useState } from 'react';
import { createBorrowing } from '@/app/actions/borrowing';
import { InventoryItem } from '@prisma/client';
import { Package, Calendar, FileText, Hash, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Komponen form peminjaman barang.
 * - Menampilkan daftar barang yang memiliki stok
 * - Memvalidasi input (tanggal, jumlah, tujuan)
 * - Memanggil server action `createBorrowing` untuk membuat permintaan
 */
interface BorrowFormProps {
  items: Pick<InventoryItem, 'id' | 'name' | 'code' | 'quantity' | 'category'>[];
}

export function BorrowForm({ items }: BorrowFormProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!selectedItemId || !expectedReturnDate || !purpose) {
      setMessage({ type: 'error', text: 'Mohon isi semua field yang wajib.' });
      setIsLoading(false);
      return;
    }

    if (new Date(expectedReturnDate) < new Date()) {
      setMessage({ type: 'error', text: 'Tanggal pengembalian tidak valid.' });
      setIsLoading(false);
      return;
    }

    const result = await createBorrowing({
      itemId: selectedItemId,
      quantity,
      expectedReturnDate: new Date(expectedReturnDate),
      purpose
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Permintaan peminjaman berhasil dibuat dan menunggu persetujuan Admin.' });
      setQuantity(1);
      setExpectedReturnDate('');
      setPurpose('');
      setSelectedItemId('');
    } else {
      setMessage({ type: 'error', text: 'error' in result ? (result as any).error : 'Terjadi kesalahan.' });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {message.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Barang</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          >
            <option value="">-- Pilih barang yang ingin dipinjam --</option>
            {items.filter(i => i.quantity > 0).map((item) => (
              <option key={item.id} value={item.id}>
                [{item.code}] {item.name} - Sisa Stok: {item.quantity}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="1"
              max={selectedItem?.quantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>
          {selectedItem && (
            <p className="mt-1 text-xs text-gray-500">Maksimal peminjaman: {selectedItem.quantity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rencana Tanggal Pengembalian</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              value={expectedReturnDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Keperluan / Tujuan Peminjaman</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            rows={3}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Contoh: Praktikum Jaringan Dasar kelas X TKJ 1"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !selectedItemId}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Memproses...' : 'Ajukan Peminjaman'}
      </button>
    </form>
  );
}
