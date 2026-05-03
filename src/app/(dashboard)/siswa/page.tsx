'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SiswaDashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard Siswa</h1>
        <p className="text-gray-600">Selamat datang, {session?.user?.name}. Pinjam barang dan lihat status peminjaman Anda.</p>
      </div>

      {/* Borrowing Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Sedang Dipinjam</p>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Riwayat Peminjaman</p>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Keterlambatan</p>
          <p className="text-3xl font-bold text-red-600">0</p>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* QR Scanner Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border-2 border-blue-300">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Pindai Kode QR</h2>
              <p className="text-blue-700 text-sm mb-4">
                Pindai kode QR barang menggunakan kamera untuk langsung membuka formulir peminjaman.
              </p>
              <Link
                href="/siswa/borrow-scan"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Mulai Scan
              </Link>
            </div>
            <div className="text-4xl">📱</div>
          </div>
        </div>

        {/* Manual Selection Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border-2 border-purple-300">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-purple-900 mb-2">Pilih Sendiri</h2>
              <p className="text-purple-700 text-sm mb-4">
                Lihat daftar semua barang yang tersedia dan pilih barang yang ingin Anda pinjam.
              </p>
              <Link
                href="/siswa/borrow-list"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Lihat Daftar Barang
              </Link>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Tindakan Lainnya</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/siswa/borrowings" className="text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Lihat Peminjaman Aktif
          </Link>
          <Link href="/siswa/borrowings" className="text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Kembalikan Barang
          </Link>
          <Link href="/history" className="text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Riwayat Peminjaman
          </Link>
          <Link href="/siswa/borrowings" className="text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Notifikasi Keterlambatan
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="font-bold text-blue-900 mb-2">💡 Tips Peminjaman</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Pahami tanggal pengembalian barang</li>
            <li>Catat kondisi barang saat dipinjam</li>
            <li>Kembalikan sebelum tanggal batas</li>
            <li>Jaga barang dengan baik selama peminjaman</li>
          </ul>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
          <h3 className="font-bold text-green-900 mb-2">Fitur Pemindai QR</h3>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Otomatis membuka form peminjaman</li>
            <li>Lebih cepat dari pencarian manual</li>
            <li>Mendukung berbagai jenis kamera</li>
            <li>Bekerja dengan baik dalam pencahayaan cukup</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
