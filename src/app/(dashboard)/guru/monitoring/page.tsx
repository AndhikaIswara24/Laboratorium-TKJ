import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { MonitoringForm } from '@/components/dashboard/MonitoringForm';
import Link from 'next/link';
import { getItemConditionLabel } from '@/lib/labels';

export default async function GuruMonitoringPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
    redirect('/siswa');
  }

  const [items, monitorings] = await Promise.all([
    prisma.inventoryItem.findMany({
      select: { id: true, code: true, name: true, condition: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.monitoring.findMany({
      take: 8,
      include: {
        item: { select: { name: true, code: true } },
        checkedBy: { select: { name: true } },
      },
      orderBy: { checkDate: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/guru" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Kembali ke Dasbor
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Periksa Kondisi Barang</h1>
        <p className="mt-1 text-gray-500">Catat hasil monitoring dan perbarui kondisi barang inventaris.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonitoringForm items={items} />

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Monitoring Terbaru</h2>
          <div className="mt-4 space-y-3">
            {monitorings.length > 0 ? (
              monitorings.map((monitoring) => (
                <div key={monitoring.id} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{monitoring.item.name}</p>
                      <p className="text-xs text-gray-500">{monitoring.item.code}</p>
                    </div>
                    <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                      {getItemConditionLabel(monitoring.condition)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{monitoring.notes || '-'}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {format(new Date(monitoring.checkDate), 'dd MMM yyyy HH:mm', { locale: id })} oleh{' '}
                    {monitoring.checkedBy.name}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Belum ada data monitoring.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
