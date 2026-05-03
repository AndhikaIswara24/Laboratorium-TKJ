/**
 * Enhanced Naive Bayes Implementation untuk evaluasi kelayakan inventaris laboratorium
 * Klasifikasi: USABLE, NEEDS_REPAIR, NOT_USABLE
 * 
 * Input Features:
 * - ageInYears: Umur barang dalam tahun
 * - frequencyPerMonth: Frekuensi penggunaan per bulan
 * - repairsCount: Jumlah perbaikan yang pernah dilakukan
 * - conditionScore: Kondisi fisik barang (skala 1-5)
 */

export type EvaluationClass = 'USABLE' | 'NEEDS_REPAIR' | 'NOT_USABLE';

export interface ItemFeatures {
  ageInYears: number;
  frequencyPerMonth: number;
  repairsCount: number;
  conditionScore: number; // 1-5 scale
}

export interface EvaluationResultDetail {
  classification: EvaluationClass;
  probability: number; // Probabilitas kelas yang dipilih (0-1)
  usableProbability: number;
  needsRepairProbability: number;
  notUsableProbability: number;
  confidence: number; // Confidence score (0-1)
  reasoning: string;
}

/**
 * Training data untuk Naive Bayes berdasarkan asumsi manajemen inventaris laboratorium
 */
const TRAINING_DATA = {
  USABLE: {
    // Barang masih layak digunakan
    ageInYearsStats: {
      mean: 2.5, // rata-rata usia 2.5 tahun
      std: 1.5,
    },
    frequencyPerMonthStats: {
      mean: 18, // rata-rata digunakan 18 kali per bulan
      std: 8,
    },
    repairsCountStats: {
      mean: 0.5, // rata-rata pernah diperbaiki 0.5 kali
      std: 0.8,
    },
    conditionScoreStats: {
      mean: 4.5, // rata-rata skor kondisi 4.5
      std: 0.5,
    },
    priorProb: 0.6, // 60% barang layak digunakan
  },
  NEEDS_REPAIR: {
    // Barang masih bisa digunakan tapi perlu perbaikan
    ageInYearsStats: {
      mean: 4.0,
      std: 2.0,
    },
    frequencyPerMonthStats: {
      mean: 10,
      std: 6,
    },
    repairsCountStats: {
      mean: 2.0,
      std: 1.2,
    },
    conditionScoreStats: {
      mean: 2.5,
      std: 1.0,
    },
    priorProb: 0.25, // 25% barang perlu perbaikan
  },
  NOT_USABLE: {
    // Barang tidak layak digunakan
    ageInYearsStats: {
      mean: 7.0,
      std: 2.5,
    },
    frequencyPerMonthStats: {
      mean: 3,
      std: 3,
    },
    repairsCountStats: {
      mean: 4.5,
      std: 1.5,
    },
    conditionScoreStats: {
      mean: 1.5,
      std: 0.8,
    },
    priorProb: 0.15, // 15% barang tidak layak
  },
};

/**
 * Gaussian Probability Density Function (PDF)
 * Digunakan untuk menghitung probabilitas continuous variables
 */
function gaussianProbability(
  value: number,
  mean: number,
  std: number
): number {
  // Prevent division by zero
  if (std === 0) {
    return value === mean ? 1 : 0.0001;
  }

  const exponent = Math.exp(-Math.pow(value - mean, 2) / (2 * Math.pow(std, 2)));
  return (1 / (std * Math.sqrt(2 * Math.PI))) * exponent;
}

/**
 * Laplace smoothing untuk menghindari probabilitas 0
 */
function smoothProbability(prob: number, smoothingFactor: number = 0.001): number {
  return Math.max(smoothingFactor, prob);
}

/**
 * Evaluasi kelayakan item menggunakan Naive Bayes
 */
export function evaluateItemFeasibility(features: ItemFeatures): EvaluationResultDetail {
  const { ageInYears, frequencyPerMonth, repairsCount, conditionScore } = features;

  // Validasi input
  if (ageInYears < 0 || frequencyPerMonth < 0 || repairsCount < 0 || conditionScore < 1 || conditionScore > 5) {
    throw new Error('Invalid input features. Age and frequency must be >= 0, repairs must be >= 0, condition score must be 1-5');
  }

  // Hitung likelihood untuk setiap kelas
  const usableLikelihood =
    gaussianProbability(
      ageInYears,
      TRAINING_DATA.USABLE.ageInYearsStats.mean,
      TRAINING_DATA.USABLE.ageInYearsStats.std
    ) *
    gaussianProbability(
      frequencyPerMonth,
      TRAINING_DATA.USABLE.frequencyPerMonthStats.mean,
      TRAINING_DATA.USABLE.frequencyPerMonthStats.std
    ) *
    gaussianProbability(
      repairsCount,
      TRAINING_DATA.USABLE.repairsCountStats.mean,
      TRAINING_DATA.USABLE.repairsCountStats.std
    ) *
    gaussianProbability(
      conditionScore,
      TRAINING_DATA.USABLE.conditionScoreStats.mean,
      TRAINING_DATA.USABLE.conditionScoreStats.std
    );

  const needsRepairLikelihood =
    gaussianProbability(
      ageInYears,
      TRAINING_DATA.NEEDS_REPAIR.ageInYearsStats.mean,
      TRAINING_DATA.NEEDS_REPAIR.ageInYearsStats.std
    ) *
    gaussianProbability(
      frequencyPerMonth,
      TRAINING_DATA.NEEDS_REPAIR.frequencyPerMonthStats.mean,
      TRAINING_DATA.NEEDS_REPAIR.frequencyPerMonthStats.std
    ) *
    gaussianProbability(
      repairsCount,
      TRAINING_DATA.NEEDS_REPAIR.repairsCountStats.mean,
      TRAINING_DATA.NEEDS_REPAIR.repairsCountStats.std
    ) *
    gaussianProbability(
      conditionScore,
      TRAINING_DATA.NEEDS_REPAIR.conditionScoreStats.mean,
      TRAINING_DATA.NEEDS_REPAIR.conditionScoreStats.std
    );

  const notUsableLikelihood =
    gaussianProbability(
      ageInYears,
      TRAINING_DATA.NOT_USABLE.ageInYearsStats.mean,
      TRAINING_DATA.NOT_USABLE.ageInYearsStats.std
    ) *
    gaussianProbability(
      frequencyPerMonth,
      TRAINING_DATA.NOT_USABLE.frequencyPerMonthStats.mean,
      TRAINING_DATA.NOT_USABLE.frequencyPerMonthStats.std
    ) *
    gaussianProbability(
      repairsCount,
      TRAINING_DATA.NOT_USABLE.repairsCountStats.mean,
      TRAINING_DATA.NOT_USABLE.repairsCountStats.std
    ) *
    gaussianProbability(
      conditionScore,
      TRAINING_DATA.NOT_USABLE.conditionScoreStats.mean,
      TRAINING_DATA.NOT_USABLE.conditionScoreStats.std
    );

  // Hitung posterior probability dengan prior
  const usablePosterior = usableLikelihood * TRAINING_DATA.USABLE.priorProb;
  const needsRepairPosterior = needsRepairLikelihood * TRAINING_DATA.NEEDS_REPAIR.priorProb;
  const notUsablePosterior = notUsableLikelihood * TRAINING_DATA.NOT_USABLE.priorProb;

  // Normalisasi probabilitas
  const totalProbability = usablePosterior + needsRepairPosterior + notUsablePosterior;

  const usableProbability = smoothProbability(usablePosterior / totalProbability);
  const needsRepairProbability = smoothProbability(needsRepairPosterior / totalProbability);
  const notUsableProbability = smoothProbability(notUsablePosterior / totalProbability);

  // Tentukan klasifikasi
  const maxProb = Math.max(usableProbability, needsRepairProbability, notUsableProbability);
  let classification: EvaluationClass;
  let probability: number;

  if (maxProb === usableProbability) {
    classification = 'USABLE';
    probability = usableProbability;
  } else if (maxProb === needsRepairProbability) {
    classification = 'NEEDS_REPAIR';
    probability = needsRepairProbability;
  } else {
    classification = 'NOT_USABLE';
    probability = notUsableProbability;
  }

  // Generate reasoning
  const reasoning = generateReasoning(features, classification);

  // Hitung confidence (perbedaan antara top 2 probabilitas)
  const probabilities = [usableProbability, needsRepairProbability, notUsableProbability].sort(
    (a, b) => b - a
  );
  const confidence = probabilities[0] - probabilities[1];

  return {
    classification,
    probability,
    usableProbability,
    needsRepairProbability,
    notUsableProbability,
    confidence,
    reasoning,
  };
}

/**
 * Generate penjelasan untuk hasil evaluasi
 */
function generateReasoning(features: ItemFeatures, classification: EvaluationClass): string {
  const { ageInYears, frequencyPerMonth, repairsCount, conditionScore } = features;
  const reasons: string[] = [];

  // Analisis berdasarkan fitur
  if (ageInYears > 5) {
    reasons.push('Umur barang > 5 tahun');
  } else if (ageInYears > 3) {
    reasons.push('Umur barang sudah tua (3-5 tahun)');
  }

  if (conditionScore <= 2) {
    reasons.push('Kondisi fisik buruk (skor ≤ 2)');
  } else if (conditionScore <= 3) {
    reasons.push('Kondisi fisik sedang');
  }

  if (repairsCount >= 4) {
    reasons.push('Sudah diperbaiki berkali-kali (≥ 4 kali)');
  } else if (repairsCount >= 2) {
    reasons.push('Pernah diperbaiki beberapa kali');
  }

  if (frequencyPerMonth < 5) {
    reasons.push('Jarang digunakan (< 5 kali/bulan)');
  } else if (frequencyPerMonth > 20) {
    reasons.push('Sering digunakan (> 20 kali/bulan)');
  }

  let baseMessage = '';
  switch (classification) {
    case 'USABLE':
      baseMessage = 'Barang masih layak digunakan';
      break;
    case 'NEEDS_REPAIR':
      baseMessage = 'Barang masih bisa digunakan tetapi perlu perbaikan';
      break;
    case 'NOT_USABLE':
      baseMessage = 'Barang tidak layak digunakan';
      break;
  }

  if (reasons.length === 0) {
    return baseMessage;
  }

  return `${baseMessage}. Alasan: ${reasons.join(', ')}.`;
}

/**
 * Dapatkan evaluasi detail dengan scoring untuk display
 */
export function getDetailedEvaluation(features: ItemFeatures) {
  const evaluation = evaluateItemFeasibility(features);

  return {
    ...evaluation,
    percentageScore: Math.round(evaluation.probability * 100),
    usablePercentage: Math.round(evaluation.usableProbability * 100),
    needsRepairPercentage: Math.round(evaluation.needsRepairProbability * 100),
    notUsablePercentage: Math.round(evaluation.notUsableProbability * 100),
    confidencePercentage: Math.round(evaluation.confidence * 100),
  };
}
