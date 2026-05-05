/**
 * Label presentasi untuk status peminjaman dan kondisi barang.
 * Menggunakan Bahasa Indonesia untuk tampilan pada UI.
 */
export const borrowingStatusLabels: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  RETURNED: 'Dikembalikan',
  OVERDUE: 'Terlambat',
};

export const itemConditionLabels: Record<string, string> = {
  GOOD: 'Baik',
  MINOR_DAMAGE: 'Rusak ringan',
  MAJOR_DAMAGE: 'Rusak berat',
  BROKEN: 'Tidak berfungsi',
  LOST: 'Hilang',
};

export function getBorrowingStatusLabel(status: string) {
  return borrowingStatusLabels[status] ?? status;
}

export function getItemConditionLabel(condition: string) {
  return itemConditionLabels[condition] ?? condition;
}
