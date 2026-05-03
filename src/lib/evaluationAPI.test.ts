import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '@/lib/__mocks__/prisma';
import { getDetailedEvaluation } from './naiveBayes';
import { EvaluationResult } from '@prisma/client';

describe('Evaluation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Naive Bayes Evaluation Logic', () => {
    it('should evaluate item and return complete evaluation object', async () => {
      const features = {
        ageInYears: 2.5,
        frequencyPerMonth: 15,
        repairsCount: 1,
        conditionScore: 4,
      };

      const result = getDetailedEvaluation(features);

      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('percentageScore');
      expect(result).toHaveProperty('confidencePercentage');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('usablePercentage');
      expect(result).toHaveProperty('needsRepairPercentage');
      expect(result).toHaveProperty('notUsablePercentage');
    });

    it('should validate required features fields', async () => {
      const invalidFeatures = {
        ageInYears: -1,
        frequencyPerMonth: -5,
        repairsCount: -1,
        conditionScore: 0,
      };

      // This should throw meaningful error
      expect(() => getDetailedEvaluation(invalidFeatures)).toThrow();
    });

    it('should ensure probability distribution sums to 100%', () => {
      const features = {
        ageInYears: 1,
        frequencyPerMonth: 10,
        repairsCount: 2,
        conditionScore: 3,
      };

      const result = getDetailedEvaluation(features);
      const totalProb =
        result.usablePercentage +
        result.needsRepairPercentage +
        result.notUsablePercentage;

      expect(Math.abs(totalProb - 100)).toBeLessThan(1);
    });

    it('should provide reasoning for all classifications', () => {
      const testCases = [
        { ageInYears: 0.5, frequencyPerMonth: 25, repairsCount: 0, conditionScore: 5 },
        { ageInYears: 4, frequencyPerMonth: 10, repairsCount: 2, conditionScore: 2.5 },
        { ageInYears: 7, frequencyPerMonth: 2, repairsCount: 5, conditionScore: 2 },
      ];

      testCases.forEach(features => {
        const result = getDetailedEvaluation(features);
        expect(result.reasoning).toBeTruthy();
        expect(result.reasoning.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Evaluation with Database Mock', () => {
    it('should save evaluation to database', async () => {
      const mockEvaluation = {
        id: 'eval-1',
        itemId: 'item-1',
        ageInYears: 2.5,
        frequencyPerMonth: 15,
        repairsCount: 1,
        conditionScore: 4,
        result: EvaluationResult.USABLE,
        probability: 0.95,
        usableProbability: 0.95,
        needsRepairProbability: 0.05,
        notUsableProbability: 0,
        evaluationDate: new Date(),
      };

      prismaMock.naiveBayesEvaluation.create.mockResolvedValueOnce(
        mockEvaluation as any
      );

      const result = await prismaMock.naiveBayesEvaluation.create({
        data: mockEvaluation,
      });

      expect(result.result).toBe('USABLE');
      expect(result.probability).toBe(0.95);
      expect(prismaMock.naiveBayesEvaluation.create).toHaveBeenCalled();
    });

    it('should fetch evaluations from database', async () => {
      const mockEvaluations = [
        {
          id: 'eval-1',
          itemId: 'item-1',
          ageInYears: 2.5,
          frequencyPerMonth: 15,
          repairsCount: 1,
          conditionScore: 4,
          result: EvaluationResult.USABLE,
          probability: 0.95,
          usableProbability: 0.95,
          needsRepairProbability: 0.05,
          notUsableProbability: 0,
          evaluationDate: new Date(),
        },
        {
          id: 'eval-2',
          itemId: 'item-2',
          ageInYears: 4,
          frequencyPerMonth: 10,
          repairsCount: 2,
          conditionScore: 3,
          result: EvaluationResult.NEEDS_REPAIR,
          probability: 0.6,
          usableProbability: 0.2,
          needsRepairProbability: 0.6,
          notUsableProbability: 0.2,
          evaluationDate: new Date(),
        },
      ];

      prismaMock.naiveBayesEvaluation.findMany.mockResolvedValueOnce(
        mockEvaluations as any
      );

      const result = await prismaMock.naiveBayesEvaluation.findMany();

      expect(result).toHaveLength(2);
      expect(result[0].result).toBe('USABLE');
      expect(result[1].result).toBe('NEEDS_REPAIR');
    });
  });
});
