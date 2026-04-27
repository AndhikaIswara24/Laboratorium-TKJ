'use client';

import { useSession } from 'next-auth/react';

export default function AdminDashboard() {
  const { data: session } = useSession();

  const stats = [
    { label: 'Total Barang', value: '0', color: 'bg-blue-500' },
    { label: 'Peminjaman Aktif', value: '0', color: 'bg-green-500' },
    { label: 'User Terdaftar', value: '0', color: 'bg-purple-500' },
    { label: 'Pengembalian Terlambat', value: '0', color: 'bg-red-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Selamat datang, {session?.user?.name}. Kelola sistem laboratorium dari sini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg opacity-20`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Tindakan Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Tambah Barang
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Kelola User
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Lihat Peminjaman
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Laporan
          </button>
        </div>
      </div>
    </div>
  );
}
