import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ExportExcelButton } from '@/components/borrow/ExportExcelButton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';
import { getBorrowingStatusLabel } from '@/lib/labels';

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  // Pengguna biasa hanya melihat riwayat sendiri. Admin melihat semua riwayat.
  const whereClause = session.user.role === 'ADMIN' 
    ? { status: { in: ['RETURNED', 'REJECTED'] as any[] } }
    : { userId: session.user.id, status: { in: ['RETURNED', 'REJECTED'] as any[] } };

  const history = await prisma.borrowing.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true } },
      item: { select: { name: true, code: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const exportData = history.map(h => ({
    id: h.id,
    Peminjam: h.user.name,
    Barang: h.item.name,
    KodeBarang: h.item.code,
    Jumlah: h.quantity,
    TanggalPinjam: format(new Date(h.borrowDate), 'yyyy-MM-dd HH:mm'),
    BatasWaktu: format(new Date(h.expectedReturnDate), 'yyyy-MM-dd HH:mm'),
    TanggalKembali: h.actualReturnDate ? format(new Date(h.actualReturnDate), 'yyyy-MM-dd HH:mm') : null,
    Status: getBorrowingStatusLabel(h.status),
    Catatan: h.notes || ''
  }));

  const dashboardPath =
    session.user.role === 'ADMIN' ? '/admin' : session.user.role === 'GURU' ? '/guru' : '/siswa';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={dashboardPath} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Kembali ke Dasbor
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Riwayat Peminjaman</h1>
          <p className="text-gray-500 mt-1">Daftar peminjaman yang telah selesai (Dikembalikan/Ditolak).</p>
        </div>
        {session.user.role === 'ADMIN' && (
          <ExportExcelButton data={exportData} />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Selesai</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peminjam</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.length > 0 ? history.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(record.updatedAt), 'dd MMM yyyy HH:mm', { locale: id })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.item.name}</div>
                    <div className="text-xs text-gray-500">Jumlah: {record.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        record.status === 'RETURNED' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                        'bg-red-50 text-red-700 ring-red-600/20'
                      }`}>
                      {getBorrowingStatusLabel(record.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={record.notes || ''}>
                    {record.notes || '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Belum ada riwayat peminjaman.
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
