'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
  conditionScore: number;
  repairsCount: number;
  acquisitionDate: string;
}

interface EvaluationResult {
  classification: 'USABLE' | 'NEEDS_REPAIR' | 'NOT_USABLE';
  probability: number;
  percentageScore: number;
  usableProbability: number;
  needsRepairProbability: number;
  notUsableProbability: number;
  usablePercentage: number;
  needsRepairPercentage: number;
  notUsablePercentage: number;
  confidence: number;
  confidencePercentage: number;
  reasoning: string;
}

interface FormData {
  itemId: string;
  ageInYears: string;
  frequencyPerMonth: string;
  repairsCount: string;
  conditionScore: string;
}

export default function EvaluationPage() {
  // Halaman Evaluasi Naive Bayes (client component untuk Admin)
  // - Mengambil daftar barang dan membiarkan Admin memasukkan fitur evaluasi
  // - Mengirim data ke API `/api/evaluasi` untuk mendapatkan hasil klasifikasi
  // - Menampilkan hasil probabilitas, skor, dan penjelasan
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    itemId: '',
    ageInYears: '',
    frequencyPerMonth: '',
    repairsCount: '',
    conditionScore: '',
  });

  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchItems();
    }
  }, [session]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    setFormData(prev => ({
      ...prev,
      itemId,
    }));

    const item = items.find(it => it.id === itemId);
    if (item) {
      setSelectedItem(item);
      // Auto-fill with current item data
      const ageInYears = ((new Date().getTime() - new Date(item.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
      setFormData(prev => ({
        ...prev,
        ageInYears,
        repairsCount: item.repairsCount.toString(),
        conditionScore: item.conditionScore.toString(),
        frequencyPerMonth: '',
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEvaluationResult(null);

    if (!formData.itemId) {
      setError('Silakan pilih barang');
      return;
    }

    if (!formData.frequencyPerMonth) {
      setError('Frekuensi penggunaan per bulan harus diisi');
      return;
    }

    setEvaluating(true);

    try {
      const response = await fetch('/api/evaluasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: formData.itemId,
          ageInYears: parseFloat(formData.ageInYears),
          frequencyPerMonth: parseInt(formData.frequencyPerMonth),
          repairsCount: parseInt(formData.repairsCount),
          conditionScore: parseInt(formData.conditionScore),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Evaluation failed');
      }

      const data = await response.json();
      setEvaluationResult(data.evaluation.result);
      setSuccess('Evaluasi berhasil!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate');
    } finally {
      setEvaluating(false);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'USABLE':
        return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', badge: 'bg-green-100 text-green-800' };
      case 'NEEDS_REPAIR':
        return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-800' };
      case 'NOT_USABLE':
        return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-100 text-red-800' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-900', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'USABLE':
        return { icon: '✓', label: 'Layak Digunakan' };
      case 'NEEDS_REPAIR':
        return { icon: '⚠️', label: 'Perlu Perbaikan' };
      case 'NOT_USABLE':
        return { icon: '✗', label: 'Tidak Layak Digunakan' };
      default:
        return { icon: '?', label: 'Tidak Diketahui' };
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Hanya admin yang dapat mengakses halaman ini</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin" className="text-blue-600 hover:text-blue-900 text-sm mb-4 inline-block">
          Kembali ke Dasbor
        </Link>
        <h1 className="text-4xl font-bold mb-2">Evaluasi Kelayakan Barang</h1>
        <p className="text-gray-600">
          Gunakan algoritma Naive Bayes untuk mengevaluasi kelayakan barang inventaris laboratorium
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pilih Barang <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.itemId}
                onChange={handleItemSelect}
                disabled={loading}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{loading ? '-- Memuat barang --' : '-- Pilih Barang --'}</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Informasi Barang</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Kategori</p>
                    <p className="font-semibold">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stok</p>
                    <p className="font-semibold">{selectedItem.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Kondisi</p>
                    <p className="font-semibold">{selectedItem.condition}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Perbaikan</p>
                    <p className="font-semibold">{selectedItem.repairsCount} kali</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Umur Barang (tahun) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="ageInYears"
                  step="0.1"
                  min="0"
                  value={formData.ageInYears}
                  onChange={handleInputChange}
                  placeholder="Contoh: 2.5"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Umur barang sejak diakuisisi</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Frekuensi Penggunaan (per bulan) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="frequencyPerMonth"
                  min="0"
                  value={formData.frequencyPerMonth}
                  onChange={handleInputChange}
                  placeholder="Contoh: 15"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Berapa kali digunakan/dipinjam per bulan</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah Perbaikan <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="repairsCount"
                  min="0"
                  value={formData.repairsCount}
                  onChange={handleInputChange}
                  placeholder="Contoh: 2"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-600 mt-1">Berapa kali barang pernah diperbaiki</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Skor Kondisi Fisik (1-5) <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, conditionScore: score.toString() }))}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                        parseInt(formData.conditionScore) === score
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">1=Buruk, 5=Sempurna</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={evaluating || !selectedItem}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {evaluating ? 'Mengevaluasi...' : '🔍 Jalankan Evaluasi Naive Bayes'}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3">📊 Tentang Naive Bayes Algorithm</h3>
            <p className="text-blue-800 text-sm mb-3">
              Algoritma Naive Bayes menganalisis 4 fitur barang untuk mengklasifikasikan kelayakan:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>Umur Barang:</strong> Semakin tua barang, semakin kecil kemungkinan layak digunakan</li>
              <li><strong>Frekuensi Penggunaan:</strong> Barang yang banyak digunakan biasanya lebih terjaga</li>
              <li><strong>Jumlah Perbaikan:</strong> Terlalu banyak perbaikan menunjukkan barang sering bermasalah</li>
              <li><strong>Skor Kondisi:</strong> Penilaian langsung terhadap kondisi fisik barang saat ini</li>
            </ul>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-1">
          {evaluationResult ? (
            <div
              className={`rounded-lg shadow-md p-6 border-2 sticky top-6 ${
                getClassificationColor(evaluationResult.classification).bg
              } ${getClassificationColor(evaluationResult.classification).border}`}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">
                  {getClassificationLabel(evaluationResult.classification).icon}
                </div>
                <p
                  className={`text-xs font-semibold px-3 py-1 rounded-full inline-block ${
                    getClassificationColor(evaluationResult.classification).badge
                  }`}
                >
                  {getClassificationLabel(evaluationResult.classification).label}
                </p>
              </div>

              <div className="space-y-4">
                {/* Main Score */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Skor Klasifikasi</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {evaluationResult.percentageScore}%
                  </p>
                </div>

                {/* Confidence */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Tingkat Kepercayaan</p>
                  <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${evaluationResult.confidencePercentage}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mt-2">
                    {evaluationResult.confidencePercentage}% Confident
                  </p>
                </div>

                {/* Probability Distribution */}
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-600 font-semibold">Distribusi Probabilitas</p>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-green-700">Layak</span>
                      <span className="text-xs font-bold text-green-700">
                        {evaluationResult.usablePercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${evaluationResult.usablePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-yellow-700">Perlu Perbaikan</span>
                      <span className="text-xs font-bold text-yellow-700">
                        {evaluationResult.needsRepairPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${evaluationResult.needsRepairPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-red-700">Tidak Layak</span>
                      <span className="text-xs font-bold text-red-700">
                        {evaluationResult.notUsablePercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${evaluationResult.notUsablePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Penjelasan</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {evaluationResult.reasoning}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg shadow-md p-6 border-2 border-gray-200 text-center sticky top-6">
              <p className="text-gray-500 text-sm">
                📊 Hasil evaluasi akan ditampilkan di sini setelah Anda menjalankan evaluasi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
