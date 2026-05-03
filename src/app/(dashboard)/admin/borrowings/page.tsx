import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BorrowingActions } from '@/components/borrow/BorrowingActions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getBorrowingStatusLabel } from '@/lib/labels';

export default async function AdminBorrowingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const borrowings = await prisma.borrowing.findMany({
    where: { status: { in: ['PENDING', 'APPROVED'] } },
    include: {
      user: { select: { name: true, email: true } },
      item: { select: { name: true, code: true, quantity: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kelola Peminjaman</h1>
        <p className="text-gray-500 mt-1">Setujui atau tolak permintaan peminjaman barang.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peminjam</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang (Jumlah)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keperluan</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batas Waktu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {borrowings.length > 0 ? borrowings.map((borrow) => (
                <tr key={borrow.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(borrow.createdAt), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{borrow.user.name}</div>
                    <div className="text-sm text-gray-500">{borrow.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{borrow.item.name}</div>
                    <div className="text-sm text-gray-500">[{borrow.item.code}] Jumlah: {borrow.quantity}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={borrow.notes || ''}>
                    {borrow.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(borrow.expectedReturnDate), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        borrow.status === 'PENDING' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                        'bg-green-50 text-green-700 ring-green-600/20'
                      }`}>
                      {getBorrowingStatusLabel(borrow.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {borrow.status === 'PENDING' ? (
                      <BorrowingActions borrowingId={borrow.id} />
                    ) : (
                      <span className="text-gray-400 text-xs">Dipinjam</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada permintaan peminjaman.
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
