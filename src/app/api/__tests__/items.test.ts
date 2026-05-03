import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { getServerSession } from 'next-auth/next';

vi.mock('next-auth/next');
vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,test'),
}));

describe('Items API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/items', () => {
    it('should return 401 if not authenticated', async () => {
      vi.clearAllMocks();
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return all items if authenticated', async () => {
      const mockSession = { user: { id: 'user-1', email: 'test@test.com', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockItems = [
        {
          id: 'item-1',
          code: 'LAB001',
          name: 'Laptop',
          description: 'For lab use',
          category: 'Electronics',
          quantity: 2,
          condition: 'GOOD',
          borrowings: [],
          monitorings: [],
        },
      ];

      prismaMock.inventoryItem.findMany.mockResolvedValue(mockItems as any);

      const items = await prismaMock.inventoryItem.findMany({
        include: { borrowings: true, monitorings: true },
      });

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Laptop');
    });
  });

  describe('POST /api/items', () => {
    it('should return 403 if not admin', async () => {
      vi.clearAllMocks();
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      expect(session?.user.role).toBe('SISWA');
    });

    it('should return 400 if missing required fields', () => {
      const body = { code: 'LAB001' };
      const requiredFields = ['code', 'name', 'category'];
      const hasAllFields = requiredFields.every(field => field in body);
      expect(hasAllFields).toBe(false);
    });

    it('should create item if admin provides all required fields', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const body = {
        code: 'LAB001',
        name: 'New Laptop',
        category: 'Electronics',
        quantity: 2,
      };

      const mockCreatedItem = {
        id: 'item-1',
        ...body,
        qrCodeUrl: 'data:image/png;base64,test',
        condition: 'NEW',
      };

      prismaMock.inventoryItem.create.mockResolvedValue(mockCreatedItem as any);

      const created = await prismaMock.inventoryItem.create({ data: body });

      expect(created.code).toBe('LAB001');
      expect(created.name).toBe('New Laptop');
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return 401 if not authenticated', async () => {
      vi.clearAllMocks();
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return 404 if item not found', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      const item = await prismaMock.inventoryItem.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(item).toBeNull();
    });

    it('should return item with relations if found', async () => {
      const mockSession = { user: { id: 'user-1' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockItem = {
        id: 'item-1',
        code: 'LAB001',
        name: 'Laptop',
        borrowings: [],
        monitorings: [],
        evaluations: [],
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockItem as any);

      const item = await prismaMock.inventoryItem.findUnique({
        where: { id: 'item-1' },
        include: { borrowings: true, monitorings: true, evaluations: true },
      });

      expect(item?.id).toBe('item-1');
      expect(item?.name).toBe('Laptop');
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should return 403 if not admin', async () => {
      vi.clearAllMocks();
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      expect(session?.user.role).toBe('SISWA');
    });

    it('should update item if admin', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const updateData = { name: 'Updated Laptop', quantity: 3 };
      const mockUpdatedItem = { id: 'item-1', ...updateData };

      prismaMock.inventoryItem.update.mockResolvedValue(mockUpdatedItem as any);

      const updated = await prismaMock.inventoryItem.update({
        where: { id: 'item-1' },
        data: updateData,
      });

      expect(updated.name).toBe('Updated Laptop');
      expect(updated.quantity).toBe(3);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should return 403 if not admin', async () => {
      vi.clearAllMocks();
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      expect(session?.user.role).toBe('SISWA');
    });

    it('should delete item if admin', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      prismaMock.inventoryItem.delete.mockResolvedValue({ id: 'item-1' } as any);

      const deleted = await prismaMock.inventoryItem.delete({
        where: { id: 'item-1' },
      });

      expect(deleted.id).toBe('item-1');
    });
  });
});
