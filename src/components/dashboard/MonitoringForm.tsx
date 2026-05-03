'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItemCondition } from '@prisma/client';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { getItemConditionLabel } from '@/lib/labels';

interface MonitoringItem {
  id: string;
  code: string;
  name: string;
  condition: ItemCondition;
}

interface MonitoringFormProps {
  items: MonitoringItem[];
}

export function MonitoringForm({ items }: MonitoringFormProps) {
  const router = useRouter();
  const [itemId, setItemId] = useState('');
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.GOOD);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemId) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          condition,
          notes: notes || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan monitoring.');
      }

      setItemId('');
      setCondition(ItemCondition.GOOD);
      setNotes('');
      setMessage('Monitoring berhasil disimpan.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan monitoring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Barang</label>
        <select
          value={itemId}
          onChange={(event) => setItemId(event.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        >
          <option value="">-- Pilih Barang --</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} [{item.code}] - {getItemConditionLabel(item.condition)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Kondisi</label>
        <select
          value={condition}
          onChange={(event) => setCondition(event.target.value as ItemCondition)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value={ItemCondition.GOOD}>Baik</option>
          <option value={ItemCondition.MINOR_DAMAGE}>Rusak Ringan</option>
          <option value={ItemCondition.MAJOR_DAMAGE}>Rusak Berat</option>
          <option value={ItemCondition.BROKEN}>Tidak Berfungsi</option>
          <option value={ItemCondition.LOST}>Hilang</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Catatan</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Catat hasil pemeriksaan barang..."
        />
      </div>

      {message && <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{message}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !itemId}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
        Simpan Monitoring
      </button>
    </form>
  );
}
