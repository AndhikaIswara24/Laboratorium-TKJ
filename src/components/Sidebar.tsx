'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navigationItems = [
    { href: '/admin', label: 'Admin Dashboard', role: 'admin' },
    { href: '/guru', label: 'Guru Dashboard', role: 'guru' },
    { href: '/siswa', label: 'Siswa Dashboard', role: 'siswa' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col h-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Lab Management</h2>
        <p className="text-gray-400 text-sm mt-2">Laboratorium TKJ</p>
      </div>

      {/* User Info */}
      {session?.user && (
        <div className="bg-gray-800 rounded-lg p-3 mb-6">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="font-semibold">{session.user.name}</p>
          <p className="text-xs text-gray-400">{session.user.role}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
