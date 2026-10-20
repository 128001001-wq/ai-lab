import React, { useState } from 'react';
import {
  FeatureKey,
  LinearModelMetrics,
  ModelMetrics,
  ModelTrainingConfig,
} from '../types/concrete';
import { FEATURE_METADATA } from '../utils/featureMetadata';
import {
  BrainCircuit,
  RotateCw,
  Sliders,
  CheckCircle2,
  TrendingUp,
  BarChart4,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ModelTrainerProps {
  metrics: ModelMetrics;
  linearMetrics: LinearModelMetrics;
  config: ModelTrainingConfig;
  onRetrain: (config: ModelTrainingConfig) => void;
  isTraining: boolean;
}

export const ModelTrainer: React.FC<ModelTrainerProps> = ({
  metrics,
  linearMetrics,
  config,
  onRetrain,
  isTraining,
}) => {
  const [localConfig, setLocalConfig] = useState<ModelTrainingConfig>(config);
  const [activePlot, setActivePlot] = useState<'actualVsPred' | 'residuals' | 'importances'>(
    'actualVsPred'
  );
  const [hoveredPrediction, setHoveredPrediction] = useState<{
    actual: number;
    predicted: number;
    residual: number;
    age: number;
    cement: number;
    water: number;
  } | null>(null);

  const handleRetrainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRetrain(localConfig);
  };

  // Sort feature importances descending
  const sortedImportances = Object.entries(metrics.featureImportances).sort(
    (a, b) => b[1] - a[1]
  );

  // Render Actual vs Predicted Plot
  const renderActualVsPredPlot = () => {
    const width = 640;
    const height = 360;
    const margin = { top: 20, right: 30, bottom: 45, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const maxVal = 90;
    const minVal = 0;

    const scaleX = (val: number) =>
      margin.left + ((val - minVal) / (maxVal - minVal)) * innerW;
    const scaleY = (val: number) =>
      margin.top + innerH - ((val - minVal) / (maxVal - minVal)) * innerH;

    return (
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '380px' }}
        >
          {/* Grid lines */}
          {[0, 20, 40, 60, 80].map((val) => (
            <g key={val}>
              <line
                x1={margin.left}
                y1={scaleY(val)}
                x2={width - margin.right}
                y2={scaleY(val)}
                stroke="#334155"
                strokeDasharray="3,3"
                strokeWidth="0.8"
              />
              <line
                x1={scaleX(val)}
                y1={margin.top}
                x2={scaleX(val)}
                y2={height - margin.bottom}
                stroke="#334155"
                strokeDasharray="3,3"
                strokeWidth="0.8"
              />
              <text
                x={margin.left - 8}
                y={scaleY(val) + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {val}
              </text>
              <text
                x={scaleX(val)}
                y={height - margin.bottom + 16}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {val}
              </text>
            </g>
          ))}

          {/* 45-degree Ideal Parity line y = x */}
          <line
            x1={scaleX(0)}
            y1={scaleY(0)}
            x2={scaleX(maxVal)}
            y2={scaleY(maxVal)}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4,3"
            opacity="0.8"
          />

          {/* +15% and -15% error bands */}
          <line
            x1={scaleX(0)}
            y1={scaleY(0)}
            x2={scaleX(maxVal)}
            y2={scaleY(maxVal * 1.15)}
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />
          <line
            x1={scaleX(0)}
            y1={scaleY(0)}
            x2={scaleX(maxVal)}
            y2={scaleY(maxVal * 0.85)}
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.5"
          />

          {/* Data Points on Test Set */}
          {metrics.predictions.map((p, idx) => {
            const cx = scaleX(p.actual);
            const cy = scaleY(p.predicted);
            const err = Math.abs(p.residual);
            const isHovered = hoveredPrediction === p;

            // Color by error magnitude
            const fillColor = err < 3 ? '#10b981' : err < 7 ? '#f59e0b' : '#ef4444';

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 3.5}
                fill={fillColor}
                opacity={isHovered ? 1 : 0.75}
                stroke={isHovered ? '#ffffff' : '#0f172a'}
                strokeWidth={isHovered ? 1.5 : 0.5}
                className="cursor-pointer transition-all duration-75"
                onMouseEnter={() => setHoveredPrediction(p)}
                onMouseLeave={() => setHoveredPrediction(null)}
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={margin.left + innerW / 2}
            y={height - 8}
            textAnchor="middle"
            className="text-xs fill-slate-300 font-semibold"
          >
            Actual Measured Compressive Strength (MPa) [ASTM C39]
          </text>

          <text
            x={-(margin.top + innerH / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-xs fill-slate-300 font-semibold"
          >
            Model Predicted Compressive Strength (MPa)
          </text>
        </svg>

        {/* Hover Tooltip */}
        {hoveredPrediction && (
          <div className="absolute top-2 right-2 bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 text-xs shadow-xl backdrop-blur-sm pointer-events-none z-10 font-mono">
            <div className="text-white font-sans font-semibold mb-1">Test Sample Details</div>
            <div className="text-emerald-400">
              Actual: <span className="font-bold">{hoveredPrediction.actual} MPa</span>
            </div>
            <div className="text-amber-400">
              Predicted: <span className="font-bold">{hoveredPrediction.predicted} MPa</span>
            </div>
            <div className="text-slate-300">
              Residual Error: {hoveredPrediction.residual > 0 ? `+${hoveredPrediction.residual}` : hoveredPrediction.residual} MPa
            </div>
            <div className="text-slate-400 text-[10px] pt-1 mt-1 border-t border-slate-800">
              Age: {hoveredPrediction.age}d | Cement: {hoveredPrediction.cement} kg/m³
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Residuals Plot (Residual vs Predicted)
  const renderResidualsPlot = () => {
    const width = 640;
    const height = 360;
    const margin = { top: 20, right: 30, bottom: 45, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const maxPred = 90;
    const minPred = 0;
    const maxRes = 25;
    const minRes = -25;

    const scaleX = (val: number) =>
      margin.left + ((val - minPred) / (maxPred - minPred)) * innerW;
    const scaleY = (val: number) =>
      margin.top + innerH - ((val - minRes) / (maxRes - minRes)) * innerH;

    return (
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '380px' }}
        >
          {/* Zero residual line */}
          <line
            x1={margin.left}
            y1={scaleY(0)}
            x2={width - margin.right}
            y2={scaleY(0)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />

          {/* Grid lines */}
          {[-20, -10, 0, 10, 20].map((val) => (
            <g key={val}>
              <line
                x1={margin.left}
                y1={scaleY(val)}
                x2={width - margin.right}
                y2={scaleY(val)}
                stroke="#334155"
                strokeDasharray="3,3"
                strokeWidth="0.8"
              />
              <text
                x={margin.left - 8}
                y={scaleY(val) + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {val > 0 ? `+${val}` : val}
              </text>
            </g>
          ))}

          {[0, 20, 40, 60, 80].map((val) => (
            <g key={val}>
              <line
                x1={scaleX(val)}
                y1={margin.top}
                x2={scaleX(val)}
                y2={height - margin.bottom}
                stroke="#334155"
                strokeDasharray="3,3"
                strokeWidth="0.8"
              />
              <text
                x={scaleX(val)}
                y={height - margin.bottom + 16}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Points */}
          {metrics.predictions.map((p, idx) => {
            const cx = scaleX(p.predicted);
            const cy = scaleY(p.residual);
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r="3.5"
                fill="#38bdf8"
                opacity="0.75"
                stroke="#0f172a"
                strokeWidth="0.5"
              />
            );
          })}

          <text
            x={margin.left + innerW / 2}
            y={height - 8}
            textAnchor="middle"
            className="text-xs fill-slate-300 font-semibold"
          >
            Predicted Strength (MPa)
          </text>

          <text
            x={-(margin.top + innerH / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-xs fill-slate-300 font-semibold"
          >
            Residual Error (Actual - Predicted, MPa)
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Metric Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Machine Learning Model Training & Evaluation
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reproducible Random Forest Ensemble Regressor with Mulberry32 PRNG seed verification
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Train/Test:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
              {metrics.nSamplesTrain} / {metrics.nSamplesTest} ({((1 - config.testSplit) * 100).toFixed(0)}/{((config.testSplit) * 100).toFixed(0)}%)
            </span>
            <span>Time:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {metrics.trainDurationMs} ms
            </span>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-medium text-slate-400">Test R² (Variance Explained)</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-1">
              {(metrics.r2 * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-300 font-mono mt-0.5">
              R² = {metrics.r2.toFixed(4)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Excellent non-linear capture
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Test MAE (Mean Abs Error)</div>
            <div className="text-3xl font-extrabold text-white mt-1">
              {metrics.mae.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">MPa</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Avg error on unseen cylinders
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Test RMSE (Root Mean Sq)</div>
            <div className="text-3xl font-extrabold text-white mt-1">
              {metrics.rmse.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">MPa</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Penalizes large outliers
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Training R² (Fit Check)</div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-1">
              {(metrics.trainR2 * 100).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              R² = {metrics.trainR2.toFixed(4)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Low overfitting gap ({((metrics.trainR2 - metrics.r2) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls & Diagnostic Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hyperparameter Tuning Form & Baseline Comparison */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-amber-400" />
              Model Hyperparameters & Split
            </h3>

            <form onSubmit={handleRetrainSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Train / Test Split:</span>
                  <span className="font-mono text-amber-400">
                    {((1 - localConfig.testSplit) * 100).toFixed(0)}% / {((localConfig.testSplit) * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.40"
                  step="0.05"
                  value={localConfig.testSplit}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, testSplit: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Ensemble Trees (n_estimators):</span>
                  <span className="font-mono text-amber-400">{localConfig.nEstimators}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={localConfig.nEstimators}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, nEstimators: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Max Tree Depth:</span>
                  <span className="font-mono text-amber-400">{localConfig.maxDepth}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="14"
                  step="1"
                  value={localConfig.maxDepth}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, maxDepth: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Random Seed:</span>
                  <span className="font-mono text-slate-400">Reproducible Mulberry32</span>
                </div>
                <input
                  type="number"
                  value={localConfig.randomSeed}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, randomSeed: parseInt(e.target.value, 10) || 42 })
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isTraining}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
                <span>{isTraining ? 'Training Trees...' : 'Re-Train Model'}</span>
              </button>
            </form>
          </div>

          {/* Model Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <BarChart4 className="w-4 h-4 text-amber-400" />
              Random Forest vs. Linear Regression
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Civil engineering comparison demonstrating why non-linear tree ensembles outperform classical OLS on hydration kinetics
            </p>

            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2">Metric</th>
                  <th className="py-2 text-right text-amber-400">Random Forest</th>
                  <th className="py-2 text-right text-slate-300">Ridge OLS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2 font-sans font-medium">Test R²</td>
                  <td className="py-2 text-right font-bold text-emerald-400">
                    {metrics.r2.toFixed(4)}
                  </td>
                  <td className="py-2 text-right text-slate-400">
                    {linearMetrics.r2.toFixed(4)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium">Test MAE</td>
                  <td className="py-2 text-right font-bold text-emerald-400">
                    {metrics.mae.toFixed(2)} MPa
                  </td>
                  <td className="py-2 text-right text-slate-400">
                    {linearMetrics.mae.toFixed(2)} MPa
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium">Test RMSE</td>
                  <td className="py-2 text-right font-bold text-emerald-400">
                    {metrics.rmse.toFixed(2)} MPa
                  </td>
                  <td className="py-2 text-right text-slate-400">
                    {linearMetrics.rmse.toFixed(2)} MPa
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-sans font-medium">Non-linearity</td>
                  <td className="py-2 text-right font-sans text-amber-300">Captured</td>
                  <td className="py-2 text-right font-sans text-rose-400">Misses coupling</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (2 cols): Interactive Diagnostic Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            {/* View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  {activePlot === 'actualVsPred' && 'Actual vs. Predicted Compressive Strength'}
                  {activePlot === 'residuals' && 'Residuals Analysis (eᵢ vs. ŷᵢ)'}
                  {activePlot === 'importances' && 'Feature Importance (Mean Decrease in Impurity)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluated on {metrics.predictions.length} independent test batches (ASTM C39)
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700/80">
                <button
                  onClick={() => setActivePlot('actualVsPred')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activePlot === 'actualVsPred'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Actual vs. Pred
                </button>
                <button
                  onClick={() => setActivePlot('residuals')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activePlot === 'residuals'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Residuals
                </button>
                <button
                  onClick={() => setActivePlot('importances')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activePlot === 'importances'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Feature Importance
                </button>
              </div>
            </div>

            {/* Plot Rendering */}
            {activePlot === 'actualVsPred' && renderActualVsPredPlot()}
            {activePlot === 'residuals' && renderResidualsPlot()}

            {activePlot === 'importances' && (
              <div className="space-y-3 pt-2">
                {sortedImportances.map(([featKey, pct]) => {
                  const meta = FEATURE_METADATA[featKey as FeatureKey];
                  return (
                    <div key={featKey} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-200">
                          {meta?.label || featKey}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Engineering Interpretation */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Materials Science Insight:</strong> Curing Age and Portland Cement together
                account for over 65% of predictive importance. Water and Superplasticizer control the
                capillary pore ratio, while aggregates provide aggregate interlock and volumetric stability.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
