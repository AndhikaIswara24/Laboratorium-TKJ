'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';

interface ImportResult {
  imported: number;
  failed: number;
  errors?: Array<{
    row: number;
    message: string;
  }>;
  error?: string;
}
/**
 * Tombol untuk mengimpor daftar inventaris dari file Excel/CSV.
 * - Membuka dialog file
 * - Mengirim `FormData` ke `/api/items/import`
 * - Menampilkan ringkasan hasil impor (berhasil/gagal)
 */
export function InventoryImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/items/import', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as ImportResult;

      if (!response.ok) {
        setResult({
          imported: data.imported ?? 0,
          failed: data.failed ?? 1,
          errors: data.errors,
          error: data.error || 'Import gagal.',
        });
        return;
      }

      setResult(data);
      router.refresh();
    } catch (error) {
      setResult({
        imported: 0,
        failed: 1,
        error: error instanceof Error ? error.message : 'Import gagal.',
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isImporting ? 'Mengimpor...' : 'Import Excel/CSV'}
      </button>

      {result && (
        <div
          className={`max-w-md rounded-lg border px-3 py-2 text-sm ${
            result.failed > 0
              ? 'border-yellow-200 bg-yellow-50 text-yellow-900'
              : 'border-green-200 bg-green-50 text-green-900'
          }`}
        >
          <p className="font-medium">
            Berhasil: {result.imported}, Gagal: {result.failed}
          </p>
          {result.error && <p className="mt-1">{result.error}</p>}
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.errors.slice(0, 3).map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Baris {error.row}: {error.message}
                </li>
              ))}
              {result.errors.length > 3 && <li>+ {result.errors.length - 3} error lainnya</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
