"use server";

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ItemCondition, BorrowStatus } from '@prisma/client';

/**
 * Buat permintaan peminjaman baru.
 * Langkah:
 * 1. Verifikasi session user
 * 2. Cek apakah user memiliki item terlambat
 * 3. Cek ketersediaan stok
 * 4. Buat record `Borrowing` dengan status PENDING
 * 5. Revalidate path terkait agar UI terupdate
 */
export async function createBorrowing(data: {
  itemId: string;
  quantity: number;
  expectedReturnDate: Date;
  purpose: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return { success: false, error: 'User not found' };

  // 1. Cek apakah user memiliki barang yang terlambat dikembalikan
  const overdueItems = await prisma.borrowing.findMany({
    where: {
      userId: user.id,
      status: { in: [BorrowStatus.APPROVED, BorrowStatus.OVERDUE] },
      expectedReturnDate: { lt: new Date() }
    }
  });

  if (overdueItems.length > 0) {
    return { success: false, error: 'Anda memiliki barang pinjaman yang terlambat dikembalikan. Harap kembalikan terlebih dahulu.' };
  }

  // 2. Cek stok barang
  const item = await prisma.inventoryItem.findUnique({ where: { id: data.itemId } });
  if (!item) return { success: false, error: 'Barang tidak ditemukan' };

  if (item.quantity < data.quantity) {
    return { success: false, error: `Stok tidak mencukupi. Sisa stok: ${item.quantity}` };
  }

  // 3. Buat permintaan peminjaman (status PENDING)
  try {
    const borrowing = await prisma.borrowing.create({
      data: {
        userId: user.id,
        itemId: data.itemId,
        quantity: data.quantity,
        expectedReturnDate: data.expectedReturnDate,
        notes: data.purpose,
        status: BorrowStatus.PENDING,
      }
    });
    
    revalidatePath('/borrow');
    revalidatePath('/history');
    return { success: true, data: borrowing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveBorrowing(borrowingId: string) {
  // Hanya admin yang boleh menyetujui peminjaman
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Gunakan transaksi untuk memastikan stok dan status konsisten
    return await prisma.$transaction(async (tx) => {
      const borrowing = await tx.borrowing.findUnique({
        where: { id: borrowingId },
        include: { item: true }
      });

      if (!borrowing || borrowing.status !== 'PENDING') {
        throw new Error('Permintaan tidak valid atau sudah diproses');
      }

      if (borrowing.item.quantity < borrowing.quantity) {
        throw new Error('Stok tidak mencukupi untuk memenuhi permintaan ini');
      }

      // Set status menjadi APPROVED
      const updated = await tx.borrowing.update({
        where: { id: borrowingId },
        data: { status: BorrowStatus.APPROVED }
      });

      // Kurangi stok sesuai jumlah yang dipinjam
      await tx.inventoryItem.update({
        where: { id: borrowing.itemId },
        data: { quantity: { decrement: borrowing.quantity } }
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    // Revalidasi halaman admin terkait agar UI terupdate
    revalidatePath('/admin/borrowings');
    revalidatePath('/admin');
  }
}

export async function rejectBorrowing(borrowingId: string, reason: string) {
  // Hanya admin dapat menolak permintaan
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const updated = await prisma.borrowing.update({
      where: { id: borrowingId },
      data: { 
        status: BorrowStatus.REJECTED,
        notes: reason 
      }
    });
    // Revalidate agar daftar peminjaman admin terupdate
    revalidatePath('/admin/borrowings');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processReturn(data: {
  borrowingId: string;
  condition: ItemCondition;
  notes?: string;
}) {
  // Hanya admin boleh memproses pengembalian
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }
  
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!adminUser) return { success: false, error: 'Admin not found' };

  try {
    // Transaksi: update borrowing, kembalikan stok, buat log monitoring
    return await prisma.$transaction(async (tx) => {
      const borrowing = await tx.borrowing.findUnique({ where: { id: data.borrowingId } });
      if (!borrowing || (borrowing.status !== 'APPROVED' && borrowing.status !== 'OVERDUE')) {
        throw new Error('Status peminjaman tidak valid untuk dikembalikan');
      }

      // 1. Update status peminjaman jadi RETURNED
      const updatedBorrowing = await tx.borrowing.update({
        where: { id: data.borrowingId },
        data: {
          status: BorrowStatus.RETURNED,
          actualReturnDate: new Date(),
        }
      });

      // 2. Tambah stok kembali dan update kondisi barang
      await tx.inventoryItem.update({
        where: { id: borrowing.itemId },
        data: { 
          quantity: { increment: borrowing.quantity },
          condition: data.condition 
        }
      });

      // 3. Catat aktivitas pemeriksaan/monitoring
      await tx.monitoring.create({
        data: {
          itemId: borrowing.itemId,
          checkedById: adminUser.id,
          condition: data.condition,
          notes: data.notes || `Pengembalian barang pinjaman. Kondisi: ${data.condition}`
        }
      });

      return { success: true, data: updatedBorrowing };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    // Revalidasi beberapa route agar UI terupdate
    revalidatePath('/admin/return');
    revalidatePath('/admin/borrowings');
    revalidatePath('/history');
    revalidatePath('/admin');
  }
}
