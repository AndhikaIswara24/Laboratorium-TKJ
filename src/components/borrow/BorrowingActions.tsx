"use client";

import { useState } from 'react';
import { approveBorrowing, rejectBorrowing } from '@/app/actions/borrowing';
import { Check, X } from 'lucide-react';

interface BorrowingActionsProps {
  borrowingId: string;
}

export function BorrowingActions({ borrowingId }: BorrowingActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const result = await approveBorrowing(borrowingId);
    if (!result.success) {
      alert('error' in result ? (result as any).error : 'Terjadi kesalahan');
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    const reason = prompt("Masukkan alasan penolakan:");
    if (reason === null) return; // cancelled

    setIsLoading(true);
    const result = await rejectBorrowing(borrowingId, reason || 'Ditolak oleh admin');
    if (!result.success) {
      alert('error' in result ? (result as any).error : 'Terjadi kesalahan');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleApprove}
        disabled={isLoading}
        className="p-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
        title="Setujui"
      >
        <Check className="w-5 h-5" />
      </button>
      <button
        onClick={handleReject}
        disabled={isLoading}
        className="p-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
        title="Tolak"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
