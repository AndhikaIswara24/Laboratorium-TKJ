'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navigationItems = [
    { href: '/admin', label: 'Admin Dashboard' },
    { href: '/guru', label: 'Guru Dashboard' },
    { href: '/siswa', label: 'Siswa Dashboard' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-gray-900 text-white"
        aria-label="Buka menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 fixed md:relative w-64 shrink-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4 flex flex-col h-screen md:h-full overflow-y-auto z-40`}>
        <div className="mb-8 space-y-4">
          <div className="flex justify-center">
            <Image
              src="/Logo.webp"
              alt="Logo SMK"
              width={80}
              height={80}
              className="w-20 h-20"
            />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">Manajemen Laboratorium TKJ</h2>
            <p className="text-xs text-gray-400">SMK Muhammadiyah 12</p>
            <p className="text-xs text-gray-500">Jakarta Utara</p>
          </div>
        </div>

        {session?.user && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 mb-6">
            <p className="text-xs text-blue-100 mb-1">Masuk sebagai</p>
            <p className="font-semibold text-white">{session.user.name}</p>
            <p className="text-xs text-blue-200 mt-2">
              {session.user.role === 'ADMIN' && 'Administrator'}
              {session.user.role === 'GURU' && 'Guru'}
              {session.user.role === 'SISWA' && 'Siswa'}
            </p>
          </div>
        )}

        <nav className="flex-1">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            {isLoading ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
