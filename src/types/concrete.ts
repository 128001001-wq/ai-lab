export interface ConcreteRecord {
  id: number;
  cement: number;         // kg/m³
  slag: number;           // kg/m³
  ash: number;            // kg/m³
  water: number;          // kg/m³
  superplastic: number;   // kg/m³
  coarseagg: number;      // kg/m³
  fineagg: number;        // kg/m³
  age: number;            // days
  strength: number;       // MPa
}

export type FeatureKey =
  | 'cement'
  | 'slag'
  | 'ash'
  | 'water'
  | 'superplastic'
  | 'coarseagg'
  | 'fineagg'
  | 'age'
  | 'strength';

export interface FeatureMetadata {
  key: FeatureKey;
  label: string;
  unit: string;
  description: string;
  isTarget?: boolean;
  min: number;
  max: number;
  recommendedStep: number;
}

export interface DatasetStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  std: number;
  median: number;
  q25: number;
  q75: number;
}

export interface ModelMetrics {
  r2: number;
  mae: number;
  rmse: number;
  trainR2: number;
  trainMae: number;
  trainRmse: number;
  nSamplesTrain: number;
  nSamplesTest: number;
  trainDurationMs: number;
  predictions: Array<{
    actual: number;
    predicted: number;
    residual: number;
    age: number;
    cement: number;
    water: number;
  }>;
  featureImportances: Record<string, number>;
}

export interface LinearModelMetrics {
  r2: number;
  mae: number;
  rmse: number;
  trainR2: number;
  coefficients: Record<string, number>;
  intercept: number;
}

export interface ModelTrainingConfig {
  testSplit: number;      // e.g. 0.20
  nEstimators: number;    // e.g. 30
  maxDepth: number;       // e.g. 10
  minSamplesSplit: number;// e.g. 4
  randomSeed: number;     // e.g. 42
}

export interface MixDesignInput {
  cement: number;
  slag: number;
  ash: number;
  water: number;
  superplastic: number;
  coarseagg: number;
  fineagg: number;
  age: number;
}

export interface InverseDesignInput {
  targetStrength: number; // Target f'c in MPa
  age: number;            // Target curing age in days (usually 28)
  cement: number;         // Cement in kg/m³
  slag: number;           // Slag in kg/m³
  ash: number;            // Fly ash in kg/m³
  coarseagg: number;      // Coarse aggregate in kg/m³
  fineagg: number;        // Fine aggregate in kg/m³
  slumpTarget: 'stiff' | 'medium' | 'high' | 'self-compacting';
}

export interface InverseDesignResult {
  success: boolean;
  water: number;
  superplastic: number;
  predictedStrength: number;
  deviation: number;
  wbRatio: number;
  totalBinder: number;
  density: number;
  workabilityNote: string;
  convergenceDetails: {
    iterations: number;
    objectiveLoss: number;
    searchBoundWater: [number, number];
    searchBoundSP: [number, number];
  };
  warnings: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
