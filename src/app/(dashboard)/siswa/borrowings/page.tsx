import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format, isPast, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getBorrowingStatusLabel } from '@/lib/labels';

export default async function SiswaBorrowingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const borrowings = await prisma.borrowing.findMany({
    where: {
      userId: session.user.id,
      status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] },
    },
    include: {
      item: { select: { name: true, code: true } },
    },
    orderBy: { expectedReturnDate: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/siswa" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Kembali ke Dasbor
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Peminjaman Aktif</h1>
        <p className="mt-1 text-gray-500">
          Lihat status permintaan, batas pengembalian, dan barang yang sedang Anda pinjam.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {borrowings.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {borrowings.map((borrowing) => {
              const overdue =
                borrowing.status !== 'PENDING' &&
                isPast(borrowing.expectedReturnDate) &&
                !isToday(borrowing.expectedReturnDate);

              return (
                <div key={borrowing.id} className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{borrowing.item.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {borrowing.item.code} - Jumlah {borrowing.quantity}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        overdue
                          ? 'bg-red-50 text-red-700 ring-red-600/20'
                          : borrowing.status === 'PENDING'
                            ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                            : 'bg-green-50 text-green-700 ring-green-600/20'
                      }`}
                    >
                      {overdue ? 'Terlambat' : getBorrowingStatusLabel(borrowing.status)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-2">
                    <p>Tanggal pinjam: {format(new Date(borrowing.borrowDate), 'dd MMM yyyy', { locale: id })}</p>
                    <p>Batas kembali: {format(new Date(borrowing.expectedReturnDate), 'dd MMM yyyy', { locale: id })}</p>
                  </div>
                  <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                    Pengembalian diproses oleh admin/guru melalui pindai QR atau menu pengembalian.
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="text-gray-500">Belum ada peminjaman aktif.</p>
            <Link
              href="/siswa/borrow-list"
              className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Pilih Barang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
