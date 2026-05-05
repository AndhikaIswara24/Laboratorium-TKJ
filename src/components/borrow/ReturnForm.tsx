"use client";

import { useState } from 'react';
import { processReturn } from '@/app/actions/borrowing';
import { ItemCondition } from '@prisma/client';
import { QrCode, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { itemConditionLabels } from '@/lib/labels';

/**
 * Form pengembalian barang.
 * - Mendukung pemindaian QR untuk memilih peminjaman aktif
 * - Menentukan kondisi barang dan catatan
 * - Memanggil server action `processReturn` untuk memproses pengembalian
 */
interface ActiveBorrowing {
  id: string;
  quantity: number;
  expectedReturnDate: Date;
  user: { name: string };
  item: { id: string; name: string; code: string };
}

interface ReturnFormProps {
  activeBorrowings: ActiveBorrowing[];
}

export function ReturnForm({ activeBorrowings }: ReturnFormProps) {
  const [selectedBorrowingId, setSelectedBorrowingId] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('GOOD');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerLoading, setIsScannerLoading] = useState(false);

  useEffect(() => {
    if (!isScanning) return;

    let scanner: any;
    let isCancelled = false;

    const startScanner = async () => {
      setIsScannerLoading(true);
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (isCancelled) return;

      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
      scanner.render(
        (decodedText: string) => {
          // Find if the decoded text (item ID or Code) matches any active borrowing
          const match = activeBorrowings.find(b => b.item.id === decodedText || b.item.code === decodedText);
          if (match) {
            setSelectedBorrowingId(match.id);
            setIsScanning(false);
            scanner.clear();
          } else {
            alert('QR Code tidak cocok dengan barang yang sedang dipinjam.');
          }
        },
        () => {
          // ignore scan errors
        }
      );
      setIsScannerLoading(false);
    };

    startScanner().catch((error) => {
      console.error(error);
      setIsScannerLoading(false);
      alert('Gagal membuka kamera pemindai.');
    });

    return () => {
      isCancelled = true;
      scanner?.clear().catch(console.error);
    };
  }, [isScanning, activeBorrowings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowingId) return alert('Pilih peminjaman terlebih dahulu.');

    setIsLoading(true);
    const result = await processReturn({
      borrowingId: selectedBorrowingId,
      condition,
      notes
    });

    if (result.success) {
      alert('Pengembalian berhasil diproses!');
      setSelectedBorrowingId('');
      setCondition('GOOD');
      setNotes('');
    } else {
      alert('error' in result ? (result as any).error : 'Terjadi kesalahan');
    }
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Scanner Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            Pindai QR Barang
          </h2>
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${isScanning ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}
          >
            {isScanning ? 'Batalkan Scan' : 'Mulai Scan'}
          </button>
        </div>
        
        {isScanning ? (
          <>
            <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-indigo-100"></div>
            {isScannerLoading && (
              <p className="mt-3 text-center text-sm text-indigo-600">Menyiapkan kamera...</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <QrCode className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 text-center">Klik &quot;Mulai Scan&quot; untuk memindai QR Code barang yang dikembalikan.</p>
          </div>
        )}
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Peminjaman Aktif</label>
          <select
            value={selectedBorrowingId}
            onChange={(e) => setSelectedBorrowingId(e.target.value)}
            className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required
          >
            <option value="">-- Pilih Sendiri --</option>
            {activeBorrowings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.item.name} [{b.item.code}] - dipinjam oleh {b.user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kondisi Barang Saat Dikembalikan</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as ItemCondition)}
            className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="GOOD">{itemConditionLabels.GOOD}</option>
            <option value="MINOR_DAMAGE">{itemConditionLabels.MINOR_DAMAGE}</option>
            <option value="MAJOR_DAMAGE">{itemConditionLabels.MAJOR_DAMAGE}</option>
            <option value="BROKEN">{itemConditionLabels.BROKEN}</option>
            <option value="LOST">{itemConditionLabels.LOST}</option>
          </select>
          {condition !== 'GOOD' && (
             <div className="mt-2 flex items-start gap-2 p-2 rounded bg-yellow-50 text-yellow-800 text-xs">
               <AlertTriangle className="w-4 h-4 shrink-0" />
               <p>Barang tidak dalam kondisi baik. Pastikan untuk menambahkan catatan.</p>
             </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan (Opsional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catat kondisi spesifik atau masalah jika ada..."
            className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            required={condition !== 'GOOD'}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !selectedBorrowingId}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors items-center gap-2"
        >
          <ClipboardCheck className="w-5 h-5" />
          {isLoading ? 'Memproses...' : 'Selesaikan Pengembalian'}
        </button>
      </form>
    </div>
  );
}
