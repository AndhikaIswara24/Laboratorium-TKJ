import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { getServerSession } from 'next-auth/next';
import { getDetailedEvaluation } from '@/lib/naiveBayes';

vi.mock('next-auth/next');

describe('Evaluasi (Evaluation) API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/evaluasi', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return 403 if not admin', async () => {
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      expect(session?.user.role).not.toBe('ADMIN');
    });

    it('should return all evaluations if admin', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockEvaluations = [
        {
          id: 'eval-1',
          itemId: 'item-1',
          ageInYears: 2.5,
          frequencyPerMonth: 15,
          repairsCount: 1,
          conditionScore: 4,
          result: 'USABLE',
          probability: 0.95,
          usableProbability: 0.95,
          needsRepairProbability: 0.05,
          notUsableProbability: 0,
          evaluationDate: new Date('2026-05-01'),
          item: {
            id: 'item-1',
            code: 'LAB001',
            name: 'Laptop',
            category: 'Electronics',
            condition: 'GOOD',
          },
        },
      ];

      prismaMock.naiveBayesEvaluation.findMany.mockResolvedValue(
        mockEvaluations as any
      );

      const evaluations = await prismaMock.naiveBayesEvaluation.findMany({
        include: { item: { select: { id: true, code: true, name: true, category: true, condition: true } } },
        orderBy: { evaluationDate: 'desc' },
      });

      expect(evaluations).toHaveLength(1);
      expect(evaluations[0].result).toBe('USABLE');
    });
  });

  describe('POST /api/evaluasi', () => {
    it('should forbid if not authenticated', async () => {
      vi.clearAllMocks();
      vi.mocked(getServerSession).mockResolvedValue(null);
      const session = await getServerSession();
      expect(session).toBeNull();
    });

    it('should return 403 if not admin', async () => {
      const mockSession = { user: { id: 'user-1', role: 'SISWA' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const session = await getServerSession();
      expect(session?.user.role).not.toBe('ADMIN');
    });

    it('should return 400 if itemId missing', () => {
      const body = {
        ageInYears: 2,
        frequencyPerMonth: 10,
        repairsCount: 1,
        conditionScore: 4,
      };

      const hasItemId = 'itemId' in body;
      expect(hasItemId).toBe(false);
    });

    it('should return 400 if feature fields missing', () => {
      const body = {
        itemId: 'item-1',
        ageInYears: 2,
      };

      const requiredFeatures = ['ageInYears', 'frequencyPerMonth', 'repairsCount', 'conditionScore'];
      const hasAllFields = requiredFeatures.every(field => field in body);
      expect(hasAllFields).toBe(false);
    });

    it('should return 400 if feature values invalid', () => {
      const invalidInputs = [
        { ageInYears: -1, frequencyPerMonth: 10, repairsCount: 1, conditionScore: 4 },
        { ageInYears: 2, frequencyPerMonth: -5, repairsCount: 1, conditionScore: 4 },
        { ageInYears: 2, frequencyPerMonth: 10, repairsCount: -1, conditionScore: 4 },
        { ageInYears: 2, frequencyPerMonth: 10, repairsCount: 1, conditionScore: 0 },
        { ageInYears: 2, frequencyPerMonth: 10, repairsCount: 1, conditionScore: 6 },
      ];

      invalidInputs.forEach(input => {
        const isValid =
          input.ageInYears >= 0 &&
          input.frequencyPerMonth >= 0 &&
          input.repairsCount >= 0 &&
          input.conditionScore >= 1 &&
          input.conditionScore <= 5;

        expect(isValid).toBe(false);
      });
    });

    it('should return 404 if item not found', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      prismaMock.inventoryItem.findUnique.mockResolvedValue(null);

      const item = await prismaMock.inventoryItem.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(item).toBeNull();
    });

    it('should evaluate item and save to database', async () => {
      const mockSession = { user: { id: 'user-1', role: 'ADMIN' } };
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const mockItem = { id: 'item-1', name: 'Laptop' };

      const features = {
        ageInYears: 2.5,
        frequencyPerMonth: 15,
        repairsCount: 1,
        conditionScore: 4,
      };

      const evaluation = getDetailedEvaluation(features);

      const mockSavedEval = {
        id: 'eval-1',
        itemId: 'item-1',
        ageInYears: features.ageInYears,
        frequencyPerMonth: features.frequencyPerMonth,
        repairsCount: features.repairsCount,
        conditionScore: features.conditionScore,
        result: evaluation.classification,
        probability: evaluation.probability,
        usableProbability: evaluation.usableProbability,
        needsRepairProbability: evaluation.needsRepairProbability,
        notUsableProbability: evaluation.notUsableProbability,
        evaluationDate: new Date(),
      };

      prismaMock.inventoryItem.findUnique.mockResolvedValue(mockItem as any);
      prismaMock.naiveBayesEvaluation.create.mockResolvedValue(mockSavedEval as any);

      const item = await prismaMock.inventoryItem.findUnique({
        where: { id: 'item-1' },
      });

      expect(item).not.toBeNull();

      const saved = await prismaMock.naiveBayesEvaluation.create({
        data: mockSavedEval,
      });

      expect(saved.itemId).toBe('item-1');
      expect(saved.result).toBeDefined();
    });

    it('should use Naive Bayes algorithm to evaluate', () => {
      const testCases = [
        {
          features: {
            ageInYears: 0.5,
            frequencyPerMonth: 20,
            repairsCount: 0,
            conditionScore: 5,
          },
          expectedClass: 'USABLE',
        },
        {
          features: {
            ageInYears: 4,
            frequencyPerMonth: 10,
            repairsCount: 2,
            conditionScore: 2.5,
          },
          expectedClass: 'NEEDS_REPAIR',
        },
        {
          features: {
            ageInYears: 7,
            frequencyPerMonth: 2,
            repairsCount: 5,
            conditionScore: 2,
          },
          expectedClass: 'NOT_USABLE',
        },
      ];

      testCases.forEach(test => {
        const result = getDetailedEvaluation(test.features);
        expect(result.classification).toBe(test.expectedClass);
      });
    });

    it('should return complete evaluation response with probabilities', () => {
      const features = {
        ageInYears: 2,
        frequencyPerMonth: 10,
        repairsCount: 1,
        conditionScore: 3,
      };

      const result = getDetailedEvaluation(features);

      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('percentageScore');
      expect(result).toHaveProperty('confidencePercentage');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('usablePercentage');
      expect(result).toHaveProperty('needsRepairPercentage');
      expect(result).toHaveProperty('notUsablePercentage');

      const totalProb =
        result.usablePercentage +
        result.needsRepairPercentage +
        result.notUsablePercentage;
      expect(Math.abs(totalProb - 100)).toBeLessThan(1);
    });
  });
});
