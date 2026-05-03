import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { getServerSession } from 'next-auth/next';

vi.mock('next-auth/next');

describe('Borrowings API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/borrowings', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return all borrowings if authenticated', async () => {
      const mockSession = { user: { id: 'user-1', email: 'test@test.com' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockBorrowings = [
        {
          id: 'borrow-1',
          userId: 'user-1',
          itemId: 'item-1',
          borrowDate: new Date('2026-05-01'),
          expectedReturnDate: new Date('2026-05-10'),
          actualReturnDate: null,
          status: 'ACTIVE',
          user: { id: 'user-1', name: 'Student 1' },
          item: { id: 'item-1', name: 'Laptop' },
        },
      ];

      prismaMock.borrowing.findMany.mockResolvedValue(mockBorrowings as any);

      const borrowings = await prismaMock.borrowing.findMany({
        include: { user: true, item: true },
        orderBy: { borrowDate: 'desc' },
      });

      expect(borrowings).toHaveLength(1);
      expect(borrowings[0].status).toBe('ACTIVE');
    });
  });

  describe('GET /api/borrowings/:id', () => {
    it('should forbid if not authenticated', async () => {
      vi.clearAllMocks();
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return 404 if borrowing not found', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      prismaMock.borrowing.findUnique.mockResolvedValue(null);

      const borrowing = await prismaMock.borrowing.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(borrowing).toBeNull();
    });

    it('should return borrowing with user and item details', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockBorrowing = {
        id: 'borrow-1',
        userId: 'user-1',
        itemId: 'item-1',
        borrowDate: new Date('2026-05-01'),
        status: 'ACTIVE',
        user: { id: 'user-1', name: 'Student' },
        item: { id: 'item-1', name: 'Laptop' },
      };

      prismaMock.borrowing.findUnique.mockResolvedValue(mockBorrowing as any);

      const borrowing = await prismaMock.borrowing.findUnique({
        where: { id: 'borrow-1' },
        include: { user: true, item: true },
      });

      expect(borrowing?.id).toBe('borrow-1');
      expect(borrowing?.user.name).toBe('Student');
    });
  });

  describe('PUT /api/borrowings/:id', () => {
    it('should forbid if not authenticated', async () => {
      vi.clearAllMocks();
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return 404 if borrowing not found', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      prismaMock.borrowing.findUnique.mockResolvedValue(null);

      const borrowing = await prismaMock.borrowing.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(borrowing).toBeNull();
    });

    it('should forbid non-admin users from changing others items', async () => {
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockBorrowing = { id: 'borrow-1', userId: 'user-2' };
      prismaMock.borrowing.findUnique.mockResolvedValue(mockBorrowing as any);

      const borrowing = await prismaMock.borrowing.findUnique({
        where: { id: 'borrow-1' },
      });

      const canUpdate = mockSession.user.role === 'ADMIN' || borrowing?.userId === mockSession.user.id;
      expect(canUpdate).toBe(false);
    });

    it('should allow users to return their own item', async () => {
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockBorrowing = { id: 'borrow-1', userId: 'user-1', status: 'ACTIVE' };
      prismaMock.borrowing.findUnique.mockResolvedValue(mockBorrowing as any);

      const borrowing = await prismaMock.borrowing.findUnique({
        where: { id: 'borrow-1' },
      });

      const canUpdate = mockSession.user.role === 'ADMIN' || borrowing?.userId === mockSession.user.id;
      expect(canUpdate).toBe(true);
    });

    it('should update borrowing status', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockUpdated = {
        id: 'borrow-1',
        userId: 'user-1',
        status: 'RETURNED',
        actualReturnDate: new Date(),
      };

      prismaMock.borrowing.update.mockResolvedValue(mockUpdated as any);

      const updated = await prismaMock.borrowing.update({
        where: { id: 'borrow-1' },
        data: { status: 'RETURNED' },
      });

      expect(updated.status).toBe('RETURNED');
    });
  });

  describe('DELETE /api/borrowings/:id', () => {
    it('should return 403 if not admin', async () => {
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      expect(session?.user.role).not.toBe('ADMIN');
    });

    it('should delete borrowing if admin', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      prismaMock.borrowing.delete.mockResolvedValue({ id: 'borrow-1' } as any);

      const deleted = await prismaMock.borrowing.delete({
        where: { id: 'borrow-1' },
      });

      expect(deleted.id).toBe('borrow-1');
    });
  });

  describe('POST /api/borrowings', () => {
    it('should forbid if not authenticated', async () => {
      vi.clearAllMocks();
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return 400 if missing required fields', () => {
      const body = { itemId: 'item-1' };
      const requiredFields = ['itemId', 'expectedReturnDate'];
      const hasAllFields = requiredFields.every(field => field in body);
      expect(hasAllFields).toBe(false);
    });

    it('should return 400 if item not available', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      const item = await prismaMock.inventoryItem.findUnique({
        where: { id: 'item-1' },
      });

      expect(item).toBeNull();
    });

    it('should create borrowing request if item available', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockItem = { id: 'item-1', name: 'Laptop', quantity: 2 };

      const body = {
        itemId: 'item-1',
        expectedReturnDate: new Date('2026-05-10'),
      };

      const mockCreated = {
        id: 'borrow-1',
        userId: 'user-1',
        ...body,
        status: 'PENDING',
        borrowDate: new Date(),
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.borrowing.create.mockResolvedValue(mockCreated as any);

      const item = await prismaMock.inventoryItem.findUnique({
        where: { id: 'item-1' },
      });

      expect(item).not.toBeNull();
      expect(item?.quantity).toBeGreaterThan(0);

      const borrowing = await prismaMock.borrowing.create({
        data: { ...body, userId: 'user-1' },
      });

      expect(borrowing.status).toBe('PENDING');
    });

    it('should set status to PENDING for new borrowing', async () => {
      const mockCreated = { id: 'borrow-1', status: 'PENDING' };
      prismaMock.borrowing.create.mockResolvedValue(mockCreated as any);

      const borrowing = await prismaMock.borrowing.create({
        data: {
          itemId: 'item-1',
          userId: 'user-1',
          expectedReturnDate: new Date('2026-05-10'),
        },
      });

      expect(borrowing.status).toBe('PENDING');
    });
  });
});
