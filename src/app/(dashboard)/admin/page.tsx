import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/StatCard';
import { LazyBorrowingChart } from '@/components/dashboard/LazyBorrowingChart';
import { 
  Package, 
  ArrowRightLeft, 
  AlertTriangle, 
  Activity,
  CheckCircle,
  Wrench,
  XCircle,
  Clock
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Halaman Dashboard Admin (server component)
 * - Mengambil ringkasan statistik inventaris, peminjaman, dan evaluasi
 * - Menyusun data chart dan daftar singkat untuk tampilan admin
 */
export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // 1. Data Fetching
  const [
    totalInventory,
    inventoryByCategory,
    recentBorrowings,
    activeBorrowings,
    evaluationSummary,
  ] = await Promise.all([
    prisma.inventoryItem.count(),
    prisma.inventoryItem.groupBy({
      by: ['category'],
      _count: true,
    }),
    prisma.borrowing.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) // Last 6 months
        }
      },
      select: {
        borrowDate: true,
        status: true
      }
    }),
    prisma.borrowing.findMany({
      where: { status: { in: ['APPROVED', 'OVERDUE', 'PENDING'] } },
      include: { user: true, item: true },
      orderBy: { expectedReturnDate: 'asc' },
    }),
    prisma.naiveBayesEvaluation.groupBy({
      by: ['result'],
      _count: true,
    })
  ]);

  // Process Chart Data
  const monthlyData: Record<string, { borrowed: number; returned: number }> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = format(d, 'MMM yyyy', { locale: id });
    monthlyData[monthName] = { borrowed: 0, returned: 0 };
  }

  recentBorrowings.forEach(b => {
    const monthName = format(b.borrowDate, 'MMM yyyy', { locale: id });
    if (monthlyData[monthName]) {
      monthlyData[monthName].borrowed += 1;
      if (b.status === 'RETURNED') {
        monthlyData[monthName].returned += 1;
      }
    }
  });

  const chartData = Object.entries(monthlyData).map(([name, data]) => ({
    name,
    borrowed: data.borrowed,
    returned: data.returned,
  }));

  // Process Borrowings
  const overdueBorrowings = activeBorrowings.filter(
    (b) => isPast(b.expectedReturnDate) && !isToday(b.expectedReturnDate) && b.status !== 'PENDING'
  );

  const currentlyBorrowed = activeBorrowings.filter(b => b.status === 'APPROVED');

  // Process Evaluation Summary
  const evalCounts = {
    USABLE: 0,
    NEEDS_REPAIR: 0,
    NOT_USABLE: 0
  };
  evaluationSummary.forEach(e => {
    evalCounts[e.result as keyof typeof evalCounts] = e._count;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-500 mt-1">Selamat datang, {session?.user?.name || 'Admin'}. Berikut ringkasan lab TKJ Anda.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            Kelola Inventaris
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Barang" 
          value={totalInventory} 
          icon={Package} 
          color="blue"
          description={`${inventoryByCategory.length} Kategori`}
        />
        <StatCard 
          title="Peminjaman Aktif" 
          value={currentlyBorrowed.length} 
          icon={ArrowRightLeft} 
          color="green"
        />
        <StatCard 
          title="Terlambat" 
          value={overdueBorrowings.length} 
          icon={AlertTriangle} 
          color="red"
          description={overdueBorrowings.length > 0 ? 'Segera tindak lanjuti' : 'Aman'}
        />
        <StatCard 
          title="Evaluasi Naive Bayes" 
          value={evalCounts.USABLE + evalCounts.NEEDS_REPAIR + evalCounts.NOT_USABLE} 
          icon={Activity} 
          color="purple"
          description="Total barang dievaluasi"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Peminjaman (6 Bulan Terakhir)</h3>
            <LazyBorrowingChart data={chartData} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Daftar Barang Dipinjam</h3>
              <div className="flex items-center gap-3">
                <Link href="/admin/borrowings" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Lihat Semua
                </Link>
                <Link href="/reports/peminjaman" target="_blank" className="text-sm font-medium text-green-600 hover:text-green-500">
                  Laporan
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peminjam</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batas Waktu</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentlyBorrowed.length > 0 ? currentlyBorrowed.slice(0, 5).map((borrow) => (
                    <tr key={borrow.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{borrow.user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{borrow.item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(borrow.expectedReturnDate), 'dd MMM yyyy', { locale: id })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada peminjaman aktif.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Panel Area */}
        <div className="space-y-6">
          {/* Overdue Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <div className="p-5 border-b border-red-50 bg-red-50/50 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-md font-semibold text-red-900">Peringatan Keterlambatan</h3>
            </div>
            <div className="p-5">
              {overdueBorrowings.length > 0 ? (
                <div className="space-y-4">
                  {overdueBorrowings.slice(0, 4).map(ob => (
                    <div key={ob.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/50 border border-red-100">
                      <Clock className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900">{ob.item.name}</p>
                        <p className="text-xs text-red-700 mt-1">Oleh: {ob.user.name}</p>
                        <p className="text-xs text-red-700 font-semibold mt-1">
                          Lewat {format(new Date(ob.expectedReturnDate), 'dd MMM yyyy', { locale: id })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {overdueBorrowings.length > 4 && (
                     <Link href="/admin/borrowings?status=OVERDUE" className="block text-center text-sm text-red-600 font-medium hover:text-red-700 mt-2">
                       + {overdueBorrowings.length - 4} lainnya
                     </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-400 mb-2" />
                  <p className="text-sm">Tidak ada keterlambatan</p>
                </div>
              )}
            </div>
          </div>

          {/* Naive Bayes Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
             <div className="p-5 border-b border-gray-100">
               <h3 className="text-md font-semibold text-gray-900">Hasil Evaluasi Barang (Naive Bayes)</h3>
             </div>
             <div className="p-5 space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-green-100 rounded-md">
                     <CheckCircle className="w-4 h-4 text-green-600" />
                   </div>
                   <span className="text-sm font-medium text-green-900">Layak Pakai</span>
                 </div>
                 <span className="font-bold text-green-700">{evalCounts.USABLE}</span>
               </div>
               
               <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-yellow-100 rounded-md">
                     <Wrench className="w-4 h-4 text-yellow-600" />
                   </div>
                   <span className="text-sm font-medium text-yellow-900">Perlu Perbaikan</span>
                 </div>
                 <span className="font-bold text-yellow-700">{evalCounts.NEEDS_REPAIR}</span>
               </div>

               <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-gray-200 rounded-md">
                     <XCircle className="w-4 h-4 text-gray-600" />
                   </div>
                   <span className="text-sm font-medium text-gray-900">Tidak Layak Pakai</span>
                 </div>
                 <span className="font-bold text-gray-700">{evalCounts.NOT_USABLE}</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
