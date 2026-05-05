import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ReturnForm } from '@/components/borrow/ReturnForm';
import Link from 'next/link';

export default async function AdminReturnPage() {
  // Halaman pengembalian barang untuk Admin
  // Menampilkan daftar peminjaman aktif yang dapat dikembalikan dan menyediakan `ReturnForm`
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch only active borrowings that can be returned
  const activeBorrowings = await prisma.borrowing.findMany({
    where: { status: { in: ['APPROVED', 'OVERDUE'] } },
    include: {
      user: { select: { name: true } },
      item: { select: { id: true, name: true, code: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Kembali ke Dasbor
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Pengembalian Barang</h1>
        <p className="text-gray-500 mt-1">Pindai kode QR barang yang dikembalikan atau pilih sendiri.</p>
      </div>

      <ReturnForm activeBorrowings={activeBorrowings} />
    </div>
  );
}
