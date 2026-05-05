"use client";

import dynamic from 'next/dynamic';

interface BorrowingData {
  name: string;
  borrowed: number;
  returned: number;
}

interface LazyBorrowingChartProps {
  data: BorrowingData[];
}

const Chart = dynamic(
  () => import('./BorrowingChart').then((module) => module.BorrowingChart),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 flex h-[300px] w-full items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
        Memuat grafik...
      </div>
    ),
  }
);

/**
 * Wrapper dinamis untuk `BorrowingChart` yang hanya dimuat di client.
 * Berguna untuk menghindari menjalankan chart library di server side.
 */
export function LazyBorrowingChart({ data }: LazyBorrowingChartProps) {
  return <Chart data={data} />;
}
