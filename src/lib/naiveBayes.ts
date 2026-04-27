/**
 * Naive Bayes Implementation untuk evaluasi kelayakan inventaris laboratorium
 * Berdasarkan kondisi barang, frekuensi penggunaan, dan umur barang
 */

export interface ItemFeatures {
  frequencyOfUse: number;
  ageInMonths: number;
  condition: string;
}

export interface EvaluationResult {
  result: 'FEASIBLE' | 'UNFEASIBLE';
  probability: number;
}

/**
 * Training data untuk Naive Bayes (dalam bentuk statistik/probabilitas)
 * Data ini berdasarkan asumsi umum manajemen inventaris
 */
const TRAINING_DATA = {
  FEASIBLE: {
    // Barang masih layak digunakan
    frequencyOfUseStats: {
      mean: 15, // rata-rata peminjaman
      std: 8,
    },
    ageStats: {
      mean: 18, // rata-rata usia dalam bulan
      std: 12,
    },
    conditionProb: {
      GOOD: 0.7,
      MINOR_DAMAGE: 0.25,
      MAJOR_DAMAGE: 0.03,
      BROKEN: 0.01,
      LOST: 0.01,
    },
    priorProb: 0.7, // Prior probability barang layak
  },
  UNFEASIBLE: {
    // Barang tidak layak digunakan
    frequencyOfUseStats: {
      mean: 5,
      std: 4,
    },
    ageStats: {
      mean: 48,
      std: 18,
    },
    conditionProb: {
      GOOD: 0.05,
      MINOR_DAMAGE: 0.15,
      MAJOR_DAMAGE: 0.4,
      BROKEN: 0.35,
      LOST: 0.05,
    },
    priorProb: 0.3,
  },
};

/**
 * Gaussian probability density function
 * Digunakan untuk menghitung probabilitas continuous variables (frequencyOfUse, ageInMonths)
 */
function gaussianProbability(
  value: number,
  mean: number,
  std: number
): number {
  const exponent = Math.exp(-Math.pow(value - mean, 2) / (2 * Math.pow(std, 2)));
  return (1 / (std * Math.sqrt(2 * Math.PI))) * exponent;
}

/**
 * Hitung probabilitas barang feasible/unfeasible menggunakan Naive Bayes
 */
export function evaluateItemFeasibility(features: ItemFeatures): EvaluationResult {
  const { frequencyOfUse, ageInMonths, condition } = features;

  // Hitung probabilitas untuk FEASIBLE
  const feasibleProb =
    TRAINING_DATA.FEASIBLE.priorProb *
    gaussianProbability(
      frequencyOfUse,
      TRAINING_DATA.FEASIBLE.frequencyOfUseStats.mean,
      TRAINING_DATA.FEASIBLE.frequencyOfUseStats.std
    ) *
    gaussianProbability(
      ageInMonths,
      TRAINING_DATA.FEASIBLE.ageStats.mean,
      TRAINING_DATA.FEASIBLE.ageStats.std
    ) *
    (TRAINING_DATA.FEASIBLE.conditionProb[
      condition as keyof typeof TRAINING_DATA.FEASIBLE.conditionProb
    ] || 0.01);

  // Hitung probabilitas untuk UNFEASIBLE
  const unfeasibleProb =
    TRAINING_DATA.UNFEASIBLE.priorProb *
    gaussianProbability(
      frequencyOfUse,
      TRAINING_DATA.UNFEASIBLE.frequencyOfUseStats.mean,
      TRAINING_DATA.UNFEASIBLE.frequencyOfUseStats.std
    ) *
    gaussianProbability(
      ageInMonths,
      TRAINING_DATA.UNFEASIBLE.ageStats.mean,
      TRAINING_DATA.UNFEASIBLE.ageStats.std
    ) *
    (TRAINING_DATA.UNFEASIBLE.conditionProb[
      condition as keyof typeof TRAINING_DATA.UNFEASIBLE.conditionProb
    ] || 0.01);

  // Tentukan hasil berdasarkan probabilitas
  const total = feasibleProb + unfeasibleProb;
  const feasiblePercentage = feasibleProb / total;

  const result: 'FEASIBLE' | 'UNFEASIBLE' =
    feasiblePercentage >= 0.5 ? 'FEASIBLE' : 'UNFEASIBLE';

  return {
    result,
    probability: feasiblePercentage,
  };
}

/**
 * Dapatkan scoring detail untuk display
 */
export function getDetailedEvaluation(features: ItemFeatures) {
  const evaluation = evaluateItemFeasibility(features);

  return {
    ...evaluation,
    score: Math.round(evaluation.probability * 100),
    recommendation:
      evaluation.result === 'FEASIBLE'
        ? 'Barang masih layak digunakan'
        : 'Barang tidak layak digunakan - pertimbangkan untuk diperbaiki atau diganti',
  };
}
