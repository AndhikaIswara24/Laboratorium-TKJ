import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBorrowing, approveBorrowing, processReturn, rejectBorrowing } from '../borrowing';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { getServerSession } from 'next-auth';
import { BorrowStatus, ItemCondition } from '@prisma/client';

describe('Borrowing Server Actions', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the $transaction to just execute the callback immediately
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      return callback(prismaMock);
    });
  });

  describe('createBorrowing', () => {
    const validData = {
      itemId: 'item-1',
      quantity: 2,
      expectedReturnDate: new Date('2026-05-10'),
      purpose: 'Praktikum',
    };

    it('should return error if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const result = await createBorrowing(validData);
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('should return error if user has overdue items', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'test@test.com' } } as any);
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1' } as any);

      // Mock that user HAS overdue items
      prismaMock.borrowing.findMany.mockResolvedValueOnce([
        { id: 'overdue-1' } as any
      ]);

      const result = await createBorrowing(validData);
      expect(result.success).toBe(false);
      expect((result as any).error).toContain('terlambat dikembalikan');
    });

    it('should return error if stock is insufficient', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'test@test.com' } } as any);
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1' } as any);
      prismaMock.borrowing.findMany.mockResolvedValueOnce([]); // No overdue items

      // Item has quantity 1, but we request 2
      prismaMock.inventoryItem.findUnique.mockResolvedValueOnce({ id: 'item-1', quantity: 1 } as any);

      const result = await createBorrowing(validData);
      expect(result.success).toBe(false);
      expect((result as any).error).toContain('Stok tidak mencukupi');
    });

    it('should successfully create borrowing request', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'test@test.com' } } as any);
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1' } as any);
      prismaMock.borrowing.findMany.mockResolvedValueOnce([]);
      prismaMock.inventoryItem.findUnique.mockResolvedValueOnce({ id: 'item-1', quantity: 5 } as any);

      prismaMock.borrowing.create.mockResolvedValueOnce({ id: 'new-borrowing' } as any);

      const result = await createBorrowing(validData);
      expect(result.success).toBe(true);
      expect(prismaMock.borrowing.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          itemId: 'item-1',
          quantity: 2,
          expectedReturnDate: validData.expectedReturnDate,
          notes: 'Praktikum',
          status: BorrowStatus.PENDING,
        }
      });
    });
  });

  describe('approveBorrowing', () => {
    it('should return error if not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'SISWA' } } as any);
      const result = await approveBorrowing('borrow-1');
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('should approve and decrease stock', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'ADMIN' } } as any);

      // Setup transaction mock return
      prismaMock.borrowing.findUnique.mockResolvedValueOnce({
        id: 'borrow-1',
        itemId: 'item-1',
        quantity: 2,
        status: 'PENDING',
        item: { quantity: 5 }
      } as any);

      prismaMock.borrowing.update.mockResolvedValueOnce({ id: 'borrow-1', status: 'APPROVED' } as any);
      prismaMock.inventoryItem.update.mockResolvedValueOnce({ id: 'item-1', quantity: 3 } as any);

      const result = await approveBorrowing('borrow-1');

      expect(result.success).toBe(true);
      expect(prismaMock.borrowing.update).toHaveBeenCalledWith({
        where: { id: 'borrow-1' },
        data: { status: BorrowStatus.APPROVED }
      });
      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: { decrement: 2 } }
      });
    });
  });

  describe('rejectBorrowing', () => {
    it('should return error if not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'SISWA' } } as any);
      const result = await rejectBorrowing('borrow-1', 'Alasan penolakan');
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('should reject borrowing and update notes', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'ADMIN' } } as any);

      prismaMock.borrowing.update.mockResolvedValueOnce({
        id: 'borrow-1',
        status: BorrowStatus.REJECTED,
        notes: 'Alasan penolakan'
      } as any);

      const result = await rejectBorrowing('borrow-1', 'Alasan penolakan');

      expect(result.success).toBe(true);
      expect(prismaMock.borrowing.update).toHaveBeenCalledWith({
        where: { id: 'borrow-1' },
        data: {
          status: BorrowStatus.REJECTED,
          notes: 'Alasan penolakan'
        }
      });
    });
  });

  describe('processReturn', () => {
    it('should return error if not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'SISWA' } } as any);
      const result = await processReturn({ borrowingId: 'borrow-1', condition: ItemCondition.GOOD });
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('should process return, restore stock, and log monitoring', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { email: 'admin@admin.com', role: 'ADMIN' } } as any);
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'admin-1' } as any);

      prismaMock.borrowing.findUnique.mockResolvedValueOnce({
        id: 'borrow-1',
        itemId: 'item-1',
        quantity: 2,
        status: 'APPROVED',
      } as any);

      prismaMock.borrowing.update.mockResolvedValueOnce({ id: 'borrow-1', status: 'RETURNED' } as any);
      prismaMock.inventoryItem.update.mockResolvedValueOnce({ id: 'item-1', quantity: 7 } as any);
      prismaMock.monitoring.create.mockResolvedValueOnce({ id: 'monitor-1' } as any);

      const result = await processReturn({
        borrowingId: 'borrow-1',
        condition: ItemCondition.GOOD,
        notes: 'Aman'
      });

      expect(result.success).toBe(true);
      expect(prismaMock.borrowing.update).toHaveBeenCalled();
      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: { increment: 2 }, condition: ItemCondition.GOOD }
      });
      expect(prismaMock.monitoring.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          itemId: 'item-1',
          checkedById: 'admin-1',
          condition: ItemCondition.GOOD,
          notes: 'Aman'
        })
      });
    });
  });
});
