import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { getBorrowingStatusLabel } from '@/lib/labels';

export default async function GuruBorrowingsPage() {
  // Halaman daftar peminjaman untuk peran `GURU`
  // Menampilkan permintaan dan peminjaman aktif agar guru dapat memantau siswa
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
    redirect('/siswa');
  }

  const borrowings = await prisma.borrowing.findMany({
    where: { status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] } },
    include: {
      user: { select: { name: true, email: true } },
      item: { select: { name: true, code: true } },
    },
    orderBy: { expectedReturnDate: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/guru" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Kembali ke Dasbor
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Daftar Peminjaman</h1>
        <p className="mt-1 text-gray-500">Pantau permintaan dan peminjaman aktif siswa.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Peminjam</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Barang</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tanggal Pinjam</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Batas Kembali</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {borrowings.length > 0 ? (
                borrowings.map((borrowing) => (
                  <tr key={borrowing.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{borrowing.user.name}</p>
                      <p className="text-xs text-gray-500">{borrowing.user.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{borrowing.item.name}</p>
                      <p className="text-xs text-gray-500">{borrowing.item.code}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {format(new Date(borrowing.borrowDate), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {format(new Date(borrowing.expectedReturnDate), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {getBorrowingStatusLabel(borrowing.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Belum ada peminjaman aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
