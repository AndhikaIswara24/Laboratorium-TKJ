import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BorrowForm } from '@/components/borrow/BorrowForm';
import { Clock, Info } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { getBorrowingStatusLabel } from '@/lib/labels';

export default async function BorrowPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      borrowings: {
        where: { status: { in: ['PENDING', 'APPROVED', 'OVERDUE'] } },
        include: { item: true },
        orderBy: { expectedReturnDate: 'asc' }
      }
    }
  });

  const availableItems = await prisma.inventoryItem.findMany({
    where: { quantity: { gt: 0 } },
    select: { id: true, name: true, code: true, quantity: true, category: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/siswa" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Kembali ke Dasbor
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Formulir Peminjaman Barang</h1>
        <p className="text-gray-500 mt-1">Isi formulir di bawah ini untuk mengajukan peminjaman alat lab TKJ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <BorrowForm items={availableItems} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Informasi Peminjaman</h3>
                <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>Peminjaman harus disetujui oleh Admin/Guru.</li>
                  <li>Harap kembalikan barang sesuai tanggal rencana.</li>
                  <li>Keterlambatan dapat mempengaruhi riwayat akun Anda.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Status Peminjaman Anda
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {user?.borrowings.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Tidak ada peminjaman aktif.
                </div>
              ) : (
                user?.borrowings.map((b) => (
                  <div key={b.id} className="p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-900">{b.item.name}</span>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        b.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                        b.status === 'APPROVED' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                        'bg-red-50 text-red-700 ring-red-600/10'
                      }`}>
                        {getBorrowingStatusLabel(b.status)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Batas: {format(new Date(b.expectedReturnDate), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
