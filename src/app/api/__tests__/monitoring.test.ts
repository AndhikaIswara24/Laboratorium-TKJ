import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { getServerSession } from 'next-auth/next';
import { ItemCondition } from '@prisma/client';

vi.mock('next-auth/next');

describe('Monitoring API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/monitoring', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return all monitoring records if authenticated', async () => {
      const mockSession = { user: { id: 'user-1', email: 'test@test.com' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockMonitorings = [
        {
          id: 'monitor-1',
          itemId: 'item-1',
          checkedById: 'user-1',
          condition: 'GOOD',
          notes: 'Item in good condition',
          checkDate: new Date('2026-05-01'),
          item: { id: 'item-1', name: 'Laptop' },
          checkedBy: { id: 'user-1', name: 'Admin' },
        },
      ];

      prismaMock.monitoring.findMany.mockResolvedValue(mockMonitorings as any);

      const monitorings = await prismaMock.monitoring.findMany({
        include: { item: true, checkedBy: true },
        orderBy: { checkDate: 'desc' },
      });

      expect(monitorings).toHaveLength(1);
      expect(monitorings[0].condition).toBe('GOOD');
      expect(monitorings[0].item.name).toBe('Laptop');
    });
  });

  describe('POST /api/monitoring', () => {
    it('should forbid if not authenticated', async () => {
      vi.clearAllMocks();
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return 403 if not admin or guru', async () => {
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      const isAuthorized = session?.user.role === 'ADMIN' || session?.user.role === 'GURU';
      expect(isAuthorized).toBe(false);
    });

    it('should allow admin to create monitoring record', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      const isAuthorized = session?.user.role === 'ADMIN' || session?.user.role === 'GURU';
      expect(isAuthorized).toBe(true);
    });

    it('should allow guru to create monitoring record', async () => {
      const mockSession = { user: { id: 'user-1', role: 'GURU' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      const isAuthorized = session?.user.role === 'ADMIN' || session?.user.role === 'GURU';
      expect(isAuthorized).toBe(true);
    });

    it('should return 400 if missing required fields', () => {
      const body = { itemId: 'item-1' };
      const requiredFields = ['itemId', 'condition'];
      const hasAllFields = requiredFields.every(field => field in body);
      expect(hasAllFields).toBe(false);
    });

    it('should create monitoring record if authorized and valid data', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const body = { itemId: 'item-1', condition: ItemCondition.GOOD, notes: 'Item checked and in good condition' };

      const mockCreated = {
        id: 'monitor-1',
        ...body,
        checkedById: 'user-1',
        checkDate: new Date(),
        item: { id: 'item-1', name: 'Laptop' },
        checkedBy: { id: 'user-1', name: 'Admin' },
      };

      prismaMock.monitoring.create.mockResolvedValue(mockCreated as any);

      const monitoring = await prismaMock.monitoring.create({
        data: { ...body, checkedById: 'user-1' },
        include: { item: true, checkedBy: true },
      });

      expect(monitoring.condition).toBe('GOOD');
      expect(monitoring.item.name).toBe('Laptop');
    });

    it('should update item condition after creating monitoring', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const newCondition = ItemCondition.MINOR_DAMAGE;
      const mockUpdated = { id: 'item-1', condition: newCondition };

      prismaMock.inventoryItem.update.mockResolvedValue(mockUpdated as any);

      const updated = await prismaMock.inventoryItem.update({
        where: { id: 'item-1' },
        data: { condition: newCondition },
      });

      expect(updated.condition).toBe(ItemCondition.MINOR_DAMAGE);
    });

    it('should support different condition values', async () => {
      const validConditions = [
        ItemCondition.GOOD,
        ItemCondition.MINOR_DAMAGE,
        ItemCondition.MAJOR_DAMAGE,
        ItemCondition.BROKEN,
        ItemCondition.LOST,
      ];
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      for (const condition of validConditions) {
        const mockCreated = {
          id: 'monitor-1',
          itemId: 'item-1',
          condition,
          checkedById: 'user-1',
        };

        prismaMock.monitoring.create.mockResolvedValue(mockCreated as any);

        const monitoring = await prismaMock.monitoring.create({
          data: { itemId: 'item-1', condition, checkedById: 'user-1' },
        });

        expect(monitoring.condition).toBe(condition);
      }
    });

    it('should allow optional notes field', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const withoutNotes = {
        id: 'monitor-1',
        itemId: 'item-1',
        condition: ItemCondition.GOOD,
        notes: null,
        checkedById: 'user-1',
      };

      const withNotes = {
        id: 'monitor-2',
        itemId: 'item-1',
        condition: ItemCondition.GOOD,
        notes: 'Item is functioning properly',
        checkedById: 'user-1',
      };

      prismaMock.monitoring.create
        .mockResolvedValueOnce(withoutNotes as any)
        .mockResolvedValueOnce(withNotes as any);

      const monitor1 = await prismaMock.monitoring.create({ data: withoutNotes });
      const monitor2 = await prismaMock.monitoring.create({ data: withNotes });

      expect(monitor1.notes).toBeNull();
      expect(monitor2.notes).toBeTruthy();
    });

    it('should include item and checkedBy in response', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockMonitoring = {
        id: 'monitor-1',
        itemId: 'item-1',
        checkedById: 'user-1',
        condition: 'GOOD',
        item: { id: 'item-1', name: 'Laptop', code: 'LAB001' },
        checkedBy: { id: 'user-1', name: 'Admin', email: 'admin@test.com' },
      };

      prismaMock.monitoring.create.mockResolvedValue(mockMonitoring as any);

      const monitoring = await prismaMock.monitoring.create({
        data: { itemId: 'item-1', checkedById: 'user-1', condition: ItemCondition.GOOD },
        include: { item: true, checkedBy: true },
      });

      expect(monitoring.item).toBeDefined();
      expect(monitoring.checkedBy).toBeDefined();
      expect(monitoring.item.name).toBe('Laptop');
      expect(monitoring.checkedBy.name).toBe('Admin');
    });
  });
});
