import { describe, it, expect } from 'vitest';
import { evaluateItemFeasibility, getDetailedEvaluation, ItemFeatures } from './naiveBayes';

describe('Naive Bayes Algorithm', () => {
  describe('getDetailedEvaluation', () => {
    it('should classify new item in good condition as USABLE', () => {
      const features: ItemFeatures = {
        ageInYears: 0.5,
        frequencyPerMonth: 20,
        repairsCount: 0,
        conditionScore: 5,
      };

      const result = getDetailedEvaluation(features);
      expect(result.classification).toBe('USABLE');
      expect(result.percentageScore).toBe(100);
    });

    it('should classify old item with low usage as NOT_USABLE', () => {
      const features: ItemFeatures = {
        ageInYears: 7,
        frequencyPerMonth: 2,
        repairsCount: 5,
        conditionScore: 2,
      };

      const result = getDetailedEvaluation(features);
      expect(result.classification).toBe('NOT_USABLE');
      expect(result.percentageScore).toBeGreaterThan(90);
    });

    it('should classify mid-age item with repairs needed as NEEDS_REPAIR', () => {
      const features: ItemFeatures = {
        ageInYears: 4,
        frequencyPerMonth: 10,
        repairsCount: 2,
        conditionScore: 2.5,
      };

      const result = getDetailedEvaluation(features);
      expect(result.classification).toBe('NEEDS_REPAIR');
    });

    it('should classify frequently used item as USABLE', () => {
      const features: ItemFeatures = {
        ageInYears: 3,
        frequencyPerMonth: 25,
        repairsCount: 1,
        conditionScore: 4,
      };

      const result = getDetailedEvaluation(features);
      expect(result.classification).toBe('USABLE');
    });

    it('should classify new item with many repairs as NEEDS_REPAIR', () => {
      const features: ItemFeatures = {
        ageInYears: 1,
        frequencyPerMonth: 15,
        repairsCount: 4,
        conditionScore: 2,
      };

      const result = getDetailedEvaluation(features);
      expect(result.classification).toBe('NEEDS_REPAIR');
    });

    it('should provide probability distribution summing to 100%', () => {
      const features: ItemFeatures = {
        ageInYears: 2,
        frequencyPerMonth: 10,
        repairsCount: 1,
        conditionScore: 3,
      };

      const result = getDetailedEvaluation(features);
      const totalProb =
        result.usablePercentage +
        result.needsRepairPercentage +
        result.notUsablePercentage;
      expect(Math.abs(totalProb - 100)).toBeLessThan(1);
    });

    it('should include reasoning in evaluation result', () => {
      const features: ItemFeatures = {
        ageInYears: 1,
        frequencyPerMonth: 5,
        repairsCount: 0,
        conditionScore: 4,
      };

      const result = getDetailedEvaluation(features);
      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should handle minimum valid values', () => {
      const features: ItemFeatures = {
        ageInYears: 0,
        frequencyPerMonth: 0,
        repairsCount: 0,
        conditionScore: 1,
      };

      const result = getDetailedEvaluation(features);
      expect(result.classification).toBeDefined();
      expect(['USABLE', 'NEEDS_REPAIR', 'NOT_USABLE']).toContain(
        result.classification
      );
    });

    it('should handle maximum realistic values', () => {
      const features: ItemFeatures = {
        ageInYears: 10,
        frequencyPerMonth: 30,
        repairsCount: 10,
        conditionScore: 5,
      };

      const result = getDetailedEvaluation(features);
      expect(result.classification).toBeDefined();
      expect(['USABLE', 'NEEDS_REPAIR', 'NOT_USABLE']).toContain(
        result.classification
      );
    });
  });

  describe('evaluateItemFeasibility', () => {
    it('should return EvaluationResultDetail object', () => {
      const features: ItemFeatures = {
        ageInYears: 2,
        frequencyPerMonth: 15,
        repairsCount: 1,
        conditionScore: 4,
      };

      const result = evaluateItemFeasibility(features);
      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('probability');
      expect(result).toHaveProperty('confidence');
    });

    it('should mark new good condition items as USABLE', () => {
      const features: ItemFeatures = {
        ageInYears: 0.5,
        frequencyPerMonth: 20,
        repairsCount: 0,
        conditionScore: 5,
      };

      const result = evaluateItemFeasibility(features);
      expect(result.classification).toBe('USABLE');
    });

    it('should mark old heavily repaired items as NOT_USABLE', () => {
      const features: ItemFeatures = {
        ageInYears: 8,
        frequencyPerMonth: 2,
        repairsCount: 6,
        conditionScore: 1,
      };

      const result = evaluateItemFeasibility(features);
      expect(result.classification).toBe('NOT_USABLE');
    });
  });
});

// Additional edge case tests
console.log('🔬 Edge Case Tests\n');

const edgeCases = [
  {
    name: 'Minimum valid values',
    features: { ageInYears: 0, frequencyPerMonth: 0, repairsCount: 0, conditionScore: 1 },
  },
  {
    name: 'Maximum realistic values',
    features: { ageInYears: 10, frequencyPerMonth: 30, repairsCount: 10, conditionScore: 5 },
  },
];

edgeCases.forEach((testCase) => {
  console.log(`Edge Case: ${testCase.name}`);
  try {
    const result = getDetailedEvaluation(testCase.features);
    console.log(`✅ Result: ${result.classification} (${result.percentageScore}%)`);
  } catch (error) {
    console.log(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  console.log('');
});

console.log('✅ All tests completed!');
