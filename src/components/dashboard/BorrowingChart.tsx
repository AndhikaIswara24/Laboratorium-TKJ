"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BorrowingData {
  name: string; // e.g., "Jan", "Feb"
  borrowed: number;
  returned: number;
}

interface BorrowingChartProps {
  data: BorrowingData[];
}

export function BorrowingChart({ data }: BorrowingChartProps) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }} 
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ fill: '#F3F4F6' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="borrowed" name="Dipinjam" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="returned" name="Dikembalikan" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
