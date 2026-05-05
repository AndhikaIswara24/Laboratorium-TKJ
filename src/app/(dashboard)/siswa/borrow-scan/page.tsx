'use client';

import QRScanner from '@/components/QRScanner';
import Link from 'next/link';

export default function SiswaBorrowScanPage() {
  // Halaman pemindaian QR untuk siswa (client)
  // Menggunakan komponen `QRScanner` untuk mendeteksi QR dan mengarahkan ke form peminjaman
  return (
    <div>
      <div className="mb-8">
        <Link href="/siswa" className="text-blue-600 hover:text-blue-900 text-sm mb-4 inline-block">
          Kembali ke Dasbor
        </Link>
        <h1 className="text-4xl font-bold mb-2">Pindai Kode QR Barang</h1>
        <p className="text-gray-600">Pindai kode QR barang untuk memulai peminjaman. Pemindai akan otomatis membuka formulir peminjaman setelah kode QR terdeteksi.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <QRScanner
          autoRedirectPath={(itemId) => `/siswa/borrow/${itemId}`}
          onScanError={(error) => {
            console.error('Scanning error:', error);
          }}
        />
      </div>

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📱 Cara Menggunakan</h3>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
            <li>Klik tombol &quot;Mulai Scan&quot;</li>
            <li>Arahkan kamera ke QR Code barang</li>
            <li>Form peminjaman akan terbuka otomatis</li>
          </ol>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">✓ Keuntungan</h3>
          <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
            <li>Cepat dan efisien</li>
            <li>Tidak perlu mencari barang</li>
            <li>Langsung bisa pinjam</li>
          </ul>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
            <li>Pastikan pencahayaan cukup</li>
            <li>Arahkan kamera dengan stabil</li>
            <li>QR Code harus terlihat jelas</li>
          </ul>
        </div>
      </div>

      {/* Alternative Option */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Atau Pilih Barang Sendiri</h3>
        <p className="text-gray-600 text-sm mb-4">Jika tidak ingin menggunakan pemindai QR, Anda bisa memilih barang dari daftar inventaris.</p>
        <Link
          href="/siswa/borrow-list"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Lihat Daftar Barang
        </Link>
      </div>
    </div>
  );
}
