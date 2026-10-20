import {
  ConcreteRecord,
  DatasetStats,
  FeatureKey,
  LinearModelMetrics,
  ModelMetrics,
  ModelTrainingConfig,
} from '../types/concrete';
import { INPUT_FEATURE_KEYS } from './featureMetadata';

// Reproducible Mulberry32 pseudo-random number generator
export function createRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function computeStats(values: number[]): DatasetStats {
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, std: 0, median: 0, q25: 0, q75: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const variance =
    n > 1
      ? sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
      : 0;
  const std = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];

  const q25 = sorted[Math.floor(n * 0.25)];
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
  const q75 = sorted[Math.floor(n * 0.75)];

  return {
    count: n,
    min,
    max,
    mean: Number(mean.toFixed(2)),
    std: Number(std.toFixed(2)),
    median: Number(median.toFixed(2)),
    q25: Number(q25.toFixed(2)),
    q75: Number(q75.toFixed(2)),
  };
}

// Compute Pearson correlation between two series
export function computePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Number((num / den).toFixed(4));
}

// Compute 9x9 Correlation Matrix
export function computeCorrelationMatrix(data: ConcreteRecord[]): {
  keys: FeatureKey[];
  matrix: number[][];
} {
  const allKeys: FeatureKey[] = [
    'cement',
    'slag',
    'ash',
    'water',
    'superplastic',
    'coarseagg',
    'fineagg',
    'age',
    'strength',
  ];

  const vectors: Record<FeatureKey, number[]> = {} as any;
  for (const k of allKeys) {
    vectors[k] = data.map((d) => d[k]);
  }

  const matrix: number[][] = [];
  for (let i = 0; i < allKeys.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < allKeys.length; j++) {
      if (i === j) {
        row.push(1);
      } else {
        row.push(computePearsonCorrelation(vectors[allKeys[i]], vectors[allKeys[j]]));
      }
    }
    matrix.push(row);
  }

  return { keys: allKeys, matrix };
}

// Decision Tree Regressor Node
interface TreeNode {
  isLeaf: boolean;
  value?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode | null;
  right?: TreeNode | null;
}

export class DecisionTreeRegressor {
  root: TreeNode | null = null;
  featureImportances: number[] = new Array(INPUT_FEATURE_KEYS.length).fill(0);

  constructor(
    public maxDepth: number = 8,
    public minSamplesSplit: number = 4,
    public maxFeatures: number = 5,
    public rng: () => number = Math.random
  ) {}

  fit(X: number[][], y: number[]): void {
    this.featureImportances = new Array(X[0].length).fill(0);
    this.root = this.buildNode(X, y, 0);
  }

  private buildNode(X: number[][], y: number[], depth: number): TreeNode {
    const nSamples = X.length;
    if (nSamples === 0) return { isLeaf: true, value: 0 };

    let sum = 0;
    for (let i = 0; i < nSamples; i++) sum += y[i];
    const meanVal = sum / nSamples;

    if (depth >= this.maxDepth || nSamples < this.minSamplesSplit) {
      return { isLeaf: true, value: meanVal };
    }

    let currentVar = 0;
    for (let i = 0; i < nSamples; i++) {
      const d = y[i] - meanVal;
      currentVar += d * d;
    }

    const nFeatures = X[0].length;
    const featIndices = Array.from({ length: nFeatures }, (_, i) => i);
    // Random feature selection
    for (let i = featIndices.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const tmp = featIndices[i];
      featIndices[i] = featIndices[j];
      featIndices[j] = tmp;
    }
    const numToSelect = Math.min(this.maxFeatures, nFeatures);
    const selectedFeatures = featIndices.slice(0, numToSelect);

    let bestGain = -1;
    let bestSplit: { featureIndex: number; threshold: number } | null = null;

    for (const fIdx of selectedFeatures) {
      const vals = X.map((r) => r[fIdx]);
      const uniqueVals = Array.from(new Set(vals)).sort((a, b) => a - b);
      if (uniqueVals.length <= 1) continue;

      let thresholds: number[] = [];
      if (uniqueVals.length > 15) {
        const step = Math.floor(uniqueVals.length / 15);
        for (let i = 0; i < uniqueVals.length - 1; i += step) {
          thresholds.push((uniqueVals[i] + uniqueVals[i + 1]) / 2);
        }
      } else {
        for (let i = 0; i < uniqueVals.length - 1; i++) {
          thresholds.push((uniqueVals[i] + uniqueVals[i + 1]) / 2);
        }
      }

      for (const th of thresholds) {
        let leftSum = 0;
        let leftCount = 0;
        let rightSum = 0;
        let rightCount = 0;

        for (let i = 0; i < nSamples; i++) {
          if (X[i][fIdx] <= th) {
            leftSum += y[i];
            leftCount++;
          } else {
            rightSum += y[i];
            rightCount++;
          }
        }

        if (leftCount === 0 || rightCount === 0) continue;

        const leftMean = leftSum / leftCount;
        const rightMean = rightSum / rightCount;

        let leftVar = 0;
        let rightVar = 0;
        for (let i = 0; i < nSamples; i++) {
          if (X[i][fIdx] <= th) {
            const d = y[i] - leftMean;
            leftVar += d * d;
          } else {
            const d = y[i] - rightMean;
            rightVar += d * d;
          }
        }

        const gain = currentVar - (leftVar + rightVar);
        if (gain > bestGain) {
          bestGain = gain;
          bestSplit = { featureIndex: fIdx, threshold: th };
        }
      }
    }

    if (!bestSplit || bestGain <= 1e-6) {
      return { isLeaf: true, value: meanVal };
    }

    this.featureImportances[bestSplit.featureIndex] += bestGain;

    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];

    for (let i = 0; i < nSamples; i++) {
      if (X[i][bestSplit.featureIndex] <= bestSplit.threshold) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }

    return {
      isLeaf: false,
      featureIndex: bestSplit.featureIndex,
      threshold: bestSplit.threshold,
      left: this.buildNode(leftX, leftY, depth + 1),
      right: this.buildNode(rightX, rightY, depth + 1),
    };
  }

  predictRow(row: number[], node: TreeNode | null = this.root): number {
    if (!node) return 0;
    if (node.isLeaf) return node.value ?? 0;
    if (node.featureIndex !== undefined && node.threshold !== undefined) {
      if (row[node.featureIndex] <= node.threshold) {
        return this.predictRow(row, node.left || null);
      } else {
        return this.predictRow(row, node.right || null);
      }
    }
    return node.value ?? 0;
  }
}

// Random Forest Regressor
export class RandomForestRegressor {
  trees: DecisionTreeRegressor[] = [];
  featureImportances: Record<string, number> = {};

  constructor(
    public nEstimators: number = 30,
    public maxDepth: number = 10,
    public minSamplesSplit: number = 4,
    public seed: number = 42
  ) {}

  fit(X: number[][], y: number[]): void {
    const rng = createRNG(this.seed);
    const nSamples = X.length;
    const nFeatures = X[0].length;
    const maxFeatures = Math.max(1, Math.floor(nFeatures * 0.7));

    this.trees = [];
    const rawImportances = new Array(nFeatures).fill(0);

    for (let t = 0; t < this.nEstimators; t++) {
      // Bootstrap sampling with replacement
      const bX: number[][] = [];
      const bY: number[] = [];
      for (let i = 0; i < nSamples; i++) {
        const idx = Math.floor(rng() * nSamples);
        bX.push(X[idx]);
        bY.push(y[idx]);
      }

      const tree = new DecisionTreeRegressor(
        this.maxDepth,
        this.minSamplesSplit,
        maxFeatures,
        rng
      );
      tree.fit(bX, bY);
      this.trees.push(tree);

      for (let f = 0; f < nFeatures; f++) {
        rawImportances[f] += tree.featureImportances[f];
      }
    }

    const totalImp = rawImportances.reduce((a, b) => a + b, 0) || 1;
    this.featureImportances = {};
    for (let f = 0; f < nFeatures; f++) {
      const featName = INPUT_FEATURE_KEYS[f];
      this.featureImportances[featName] = Number(
        ((rawImportances[f] / totalImp) * 100).toFixed(2)
      );
    }
  }

  predictRow(row: number[]): { mean: number; std: number } {
    if (this.trees.length === 0) return { mean: 0, std: 0 };
    const preds = this.trees.map((t) => t.predictRow(row));
    const mean = preds.reduce((a, b) => a + b, 0) / preds.length;
    const variance =
      preds.length > 1
        ? preds.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (preds.length - 1)
        : 0;
    return {
      mean: Number(mean.toFixed(2)),
      std: Number(Math.sqrt(variance).toFixed(2)),
    };
  }

  predict(X: number[][]): number[] {
    return X.map((r) => this.predictRow(r).mean);
  }
}

// Multiple Linear Regression baseline (Ridge regularized OLS)
export class RidgeLinearRegression {
  weights: number[] = [];
  intercept: number = 0;
  meansX: number[] = [];
  stdsX: number[] = [];
  meanY: number = 0;
  stdY: number = 1;

  fit(X: number[][], y: number[], lambda: number = 1e-4): void {
    const n = X.length;
    const d = X[0].length;

    // Standardization for numerical stability
    this.meansX = new Array(d).fill(0);
    this.stdsX = new Array(d).fill(1);
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += X[i][j];
      this.meansX[j] = sum / n;
      let varSum = 0;
      for (let i = 0; i < n; i++) varSum += Math.pow(X[i][j] - this.meansX[j], 2);
      this.stdsX[j] = Math.sqrt(varSum / n) || 1;
    }

    const sumY = y.reduce((a, b) => a + b, 0);
    this.meanY = sumY / n;
    let varY = 0;
    for (let i = 0; i < n; i++) varY += Math.pow(y[i] - this.meanY, 2);
    this.stdY = Math.sqrt(varY / n) || 1;

    // Standardized X_std and y_std
    const Xs: number[][] = [];
    const ys: number[] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < d; j++) {
        row.push((X[i][j] - this.meansX[j]) / this.stdsX[j]);
      }
      Xs.push(row);
      ys.push((y[i] - this.meanY) / this.stdY);
    }

    // Solve (X^T X + lambda I) w = X^T y via Gauss-Jordan elimination
    const XtX: number[][] = Array.from({ length: d }, () => new Array(d).fill(0));
    const Xty: number[] = new Array(d).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < d; j++) {
        Xty[j] += Xs[i][j] * ys[i];
        for (let k = 0; k < d; k++) {
          XtX[j][k] += Xs[i][j] * Xs[i][k];
        }
      }
    }

    // Add regularization
    for (let j = 0; j < d; j++) {
      XtX[j][j] += lambda * n;
    }

    // Augmented matrix for Gaussian elimination
    const A: number[][] = Array.from({ length: d }, (__, r) => [
      ...XtX[r],
      Xty[r],
    ]);

    for (let i = 0; i < d; i++) {
      let maxRow = i;
      for (let k = i + 1; k < d; k++) {
        if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
      }
      const tmp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tmp;

      const pivot = A[i][i] || 1e-12;
      for (let j = i; j <= d; j++) {
        A[i][j] /= pivot;
      }

      for (let k = 0; k < d; k++) {
        if (k !== i) {
          const factor = A[k][i];
          for (let j = i; j <= d; j++) {
            A[k][j] -= factor * A[i][j];
          }
        }
      }
    }

    const stdWeights = A.map((row) => row[d]);

    // Unstandardize weights
    this.weights = new Array(d).fill(0);
    let intcp = this.meanY;
    for (let j = 0; j < d; j++) {
      this.weights[j] = (stdWeights[j] * this.stdY) / this.stdsX[j];
      intcp -= this.weights[j] * this.meansX[j];
    }
    this.intercept = intcp;
  }

  predictRow(row: number[]): number {
    let sum = this.intercept;
    for (let j = 0; j < row.length; j++) {
      sum += this.weights[j] * row[j];
    }
    return sum;
  }

  predict(X: number[][]): number[] {
    return X.map((r) => this.predictRow(r));
  }
}

// Model evaluation metrics calculator
export function calculateMetrics(
  actual: number[],
  predicted: number[]
): { r2: number; mae: number; rmse: number } {
  const n = actual.length;
  if (n === 0) return { r2: 0, mae: 0, rmse: 0 };

  const meanActual = actual.reduce((a, b) => a + b, 0) / n;
  let ssTot = 0;
  let ssRes = 0;
  let absErr = 0;

  for (let i = 0; i < n; i++) {
    const act = actual[i];
    const pred = predicted[i];
    ssTot += Math.pow(act - meanActual, 2);
    ssRes += Math.pow(act - pred, 2);
    absErr += Math.abs(act - pred);
  }

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const mae = absErr / n;
  const rmse = Math.sqrt(ssRes / n);

  return {
    r2: Number(r2.toFixed(4)),
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
  };
}

// Train and evaluate models pipeline
export function trainModelsPipeline(
  records: ConcreteRecord[],
  config: ModelTrainingConfig
): {
  rfMetrics: ModelMetrics;
  linearMetrics: LinearModelMetrics;
  rfModel: RandomForestRegressor;
} {
  const startTime = performance.now();
  const rng = createRNG(config.randomSeed);

  // Reproducible shuffle
  const shuffled = [...records].sort(() => rng() - 0.5);
  const nTrain = Math.floor(shuffled.length * (1 - config.testSplit));

  const trainSet = shuffled.slice(0, nTrain);
  const testSet = shuffled.slice(nTrain);

  const X_train = trainSet.map((d) => INPUT_FEATURE_KEYS.map((k) => d[k]));
  const y_train = trainSet.map((d) => d.strength);
  const X_test = testSet.map((d) => INPUT_FEATURE_KEYS.map((k) => d[k]));
  const y_test = testSet.map((d) => d.strength);

  // Train Random Forest
  const rf = new RandomForestRegressor(
    config.nEstimators,
    config.maxDepth,
    config.minSamplesSplit,
    config.randomSeed
  );
  rf.fit(X_train, y_train);

  const testPreds = rf.predict(X_test);
  const trainPreds = rf.predict(X_train);

  const testMetrics = calculateMetrics(y_test, testPreds);
  const trainMetrics = calculateMetrics(y_train, trainPreds);

  const predictionRows = testSet.map((record, i) => ({
    actual: record.strength,
    predicted: Number(testPreds[i].toFixed(2)),
    residual: Number((record.strength - testPreds[i]).toFixed(2)),
    age: record.age,
    cement: record.cement,
    water: record.water,
  }));

  const rfMetrics: ModelMetrics = {
    r2: testMetrics.r2,
    mae: testMetrics.mae,
    rmse: testMetrics.rmse,
    trainR2: trainMetrics.r2,
    trainMae: trainMetrics.mae,
    trainRmse: trainMetrics.rmse,
    nSamplesTrain: nTrain,
    nSamplesTest: testSet.length,
    trainDurationMs: Math.round(performance.now() - startTime),
    predictions: predictionRows,
    featureImportances: rf.featureImportances,
  };

  // Train Linear Regression for comparison
  const lr = new RidgeLinearRegression();
  lr.fit(X_train, y_train);
  const lrTestPreds = lr.predict(X_test);
  const lrTrainPreds = lr.predict(X_train);
  const lrMetrics = calculateMetrics(y_test, lrTestPreds);
  const lrTrain = calculateMetrics(y_train, lrTrainPreds);

  const coefficients: Record<string, number> = {};
  for (let j = 0; j < INPUT_FEATURE_KEYS.length; j++) {
    coefficients[INPUT_FEATURE_KEYS[j]] = Number(lr.weights[j].toFixed(4));
  }

  const linearMetrics: LinearModelMetrics = {
    r2: lrMetrics.r2,
    mae: lrMetrics.mae,
    rmse: lrMetrics.rmse,
    trainR2: lrTrain.r2,
    coefficients,
    intercept: Number(lr.intercept.toFixed(2)),
  };

  return { rfMetrics, linearMetrics, rfModel: rf };
}
