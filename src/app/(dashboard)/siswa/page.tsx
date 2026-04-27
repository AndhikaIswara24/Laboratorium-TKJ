'use client';

import { useSession } from 'next-auth/react';

export default function SiswaDashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Siswa Dashboard</h1>
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

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Kelola Peminjaman</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Pinjam Barang
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Lihat Peminjaman Aktif
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Riwayat Peminjaman
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Kembalikan Barang
          </button>
        </div>
      </div>
    </div>
  );
}
