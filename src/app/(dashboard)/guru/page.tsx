'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function GuruDashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard Guru</h1>
        <p className="text-gray-600">Selamat datang, {session?.user?.name}. Kelola data kondisi barang dan peminjaman.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Peminjaman Hari Ini</p>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Pengembalian Diharapkan</p>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Barang Terlambat</p>
          <p className="text-3xl font-bold text-red-600">0</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Menu Utama</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/guru/borrowings" className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Lihat Daftar Peminjaman
          </Link>
          <Link href="/guru/monitoring" className="text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Periksa Kondisi Barang
          </Link>
          <Link href="/history" className="text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Lihat Riwayat
          </Link>
          <Link href="/history" className="text-center bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Laporan Harian
          </Link>
        </div>
      </div>
    </div>
  );
}
