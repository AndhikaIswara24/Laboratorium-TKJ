"use client";

import Sidebar from '@/components/Sidebar';
import { useSession, SessionProvider, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

/**
 * Layout untuk area dashboard yang membutuhkan autentikasi.
 * - Membungkus halaman dashboard dengan `Sidebar` dan header
 * - Memastikan user terautentikasi, jika tidak diarahkan ke `/login`
 */
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-8">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-800"
          >
            <LogOut size={18} />
            {isLoggingOut ? 'Keluar...' : 'Keluar'}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 pt-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
