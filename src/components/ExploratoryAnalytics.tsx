import React, { useState, useMemo } from 'react';
import { ConcreteRecord, FeatureKey } from '../types/concrete';
import { FEATURE_METADATA } from '../utils/featureMetadata';
import { computeCorrelationMatrix, computePearsonCorrelation } from '../utils/mlEngine';
import {
  TrendingUp,
  ScatterChart as ScatterIcon,
  Grid3X3,
  BarChart,
  HelpCircle,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface ExploratoryAnalyticsProps {
  data: ConcreteRecord[];
}

export const ExploratoryAnalytics: React.FC<ExploratoryAnalyticsProps> = ({ data }) => {
  const [activeSubTab, setActiveSubTab] = useState<'standard' | 'dynamic' | 'heatmap' | 'histograms'>(
    'standard'
  );

  // Dynamic scatter state
  const [dynamicX, setDynamicX] = useState<FeatureKey>('cement');
  const [dynamicY, setDynamicY] = useState<FeatureKey>('strength');
  const [dynamicColor, setDynamicColor] = useState<FeatureKey>('age');
  const [hoveredPoint, setHoveredPoint] = useState<ConcreteRecord | null>(null);

  // Histogram state
  const [histFeature, setHistFeature] = useState<FeatureKey>('strength');
  const [binCount, setBinCount] = useState<number>(20);

  // Heatmap selected cell
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{
    x: FeatureKey;
    y: FeatureKey;
    r: number;
  } | null>({
    x: 'cement',
    y: 'strength',
    r: 0.4978,
  });

  const correlationData = useMemo(() => computeCorrelationMatrix(data), [data]);

  // Scatter plot SVG renderer component
  const renderScatterPlot = (
    xKey: FeatureKey,
    yKey: FeatureKey,
    title: string,
    subtitle: string,
    colorBy: FeatureKey = 'age'
  ) => {
    const xMeta = FEATURE_METADATA[xKey];
    const yMeta = FEATURE_METADATA[yKey];
    const colorMeta = FEATURE_METADATA[colorBy];

    const xVals = data.map((d) => d[xKey]);
    const yVals = data.map((d) => d[yKey]);
    const colorVals = data.map((d) => d[colorBy]);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);
    const minColor = Math.min(...colorVals);
    const maxColor = Math.max(...colorVals);

    const padX = (maxX - minX) * 0.05 || 1;
    const padY = (maxY - minY) * 0.05 || 1;

    const plotMinX = minX - padX;
    const plotMaxX = maxX + padX;
    const plotMinY = Math.max(0, minY - padY);
    const plotMaxY = maxY + padY;

    // Linear regression line y = m * x + b
    const r = computePearsonCorrelation(xVals, yVals);
    const meanX = xVals.reduce((a, b) => a + b, 0) / xVals.length;
    const meanY = yVals.reduce((a, b) => a + b, 0) / yVals.length;
    let varX = 0;
    let covXY = 0;
    for (let i = 0; i < xVals.length; i++) {
      varX += (xVals[i] - meanX) ** 2;
      covXY += (xVals[i] - meanX) * (yVals[i] - meanY);
    }
    const slope = varX !== 0 ? covXY / varX : 0;
    const intercept = meanY - slope * meanX;

    const width = 640;
    const height = 360;
    const margin = { top: 20, right: 30, bottom: 45, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const scaleX = (val: number) =>
      margin.left + ((val - plotMinX) / (plotMaxX - plotMinX)) * innerW;
    const scaleY = (val: number) =>
      margin.top + innerH - ((val - plotMinY) / (plotMaxY - plotMinY)) * innerH;

    const x1 = plotMinX;
    const y1 = slope * x1 + intercept;
    const x2 = plotMaxX;
    const y2 = slope * x2 + intercept;

    // Color mapper
    const getColor = (cVal: number) => {
      const t = Math.min(1, Math.max(0, (cVal - minColor) / (maxColor - minColor || 1)));
      // Amber to violet gradient
      if (t < 0.25) return '#38bdf8'; // sky
      if (t < 0.5) return '#34d399';  // emerald
      if (t < 0.75) return '#fbbf24'; // amber
      return '#f87171';              // rose
    };

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              r = {r > 0 ? `+${r}` : r}
            </span>
            <span className="text-[11px] text-slate-400">
              Color: {colorMeta.label}
            </span>
          </div>
        </div>

        {/* SVG Container */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none"
            style={{ maxHeight: '400px' }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const yVal = plotMinY + pct * (plotMaxY - plotMinY);
              const yPos = scaleY(yVal);
              return (
                <g key={`y-grid-${idx}`}>
                  <line
                    x1={margin.left}
                    y1={yPos}
                    x2={width - margin.right}
                    y2={yPos}
                    stroke="#334155"
                    strokeDasharray="3,3"
                    strokeWidth="0.8"
                  />
                  <text
                    x={margin.left - 8}
                    y={yPos + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {yVal.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const xVal = plotMinX + pct * (plotMaxX - plotMinX);
              const xPos = scaleX(xVal);
              return (
                <g key={`x-grid-${idx}`}>
                  <line
                    x1={xPos}
                    y1={margin.top}
                    x2={xPos}
                    y2={height - margin.bottom}
                    stroke="#334155"
                    strokeDasharray="3,3"
                    strokeWidth="0.8"
                  />
                  <text
                    x={xPos}
                    y={height - margin.bottom + 16}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {xVal.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Regression trendline */}
            <line
              x1={scaleX(x1)}
              y1={scaleY(y1)}
              x2={scaleX(x2)}
              y2={scaleY(y2)}
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="4,2"
              opacity="0.85"
            />

            {/* Data Points */}
            {data.map((row) => {
              const cx = scaleX(row[xKey]);
              const cy = scaleY(row[yKey]);
              const isHovered = hoveredPoint?.id === row.id;

              return (
                <circle
                  key={row.id}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3}
                  fill={getColor(row[colorBy])}
                  opacity={isHovered ? 1 : 0.65}
                  stroke={isHovered ? '#ffffff' : '#0f172a'}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  className="cursor-pointer transition-all duration-75"
                  onMouseEnter={() => setHoveredPoint(row)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* Axis labels */}
            <text
              x={margin.left + innerW / 2}
              y={height - 8}
              textAnchor="middle"
              className="text-xs fill-slate-300 font-semibold"
            >
              {xMeta.label} ({xMeta.unit})
            </text>

            <text
              x={-(margin.top + innerH / 2)}
              y={18}
              transform="rotate(-90)"
              textAnchor="middle"
              className="text-xs fill-slate-300 font-semibold"
            >
              {yMeta.label} ({yMeta.unit})
            </text>
          </svg>

          {/* Point Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-3 right-3 bg-slate-950/90 border border-slate-700/80 rounded-lg p-2.5 text-xs shadow-xl backdrop-blur-sm pointer-events-none z-10 font-mono">
              <div className="font-sans font-bold text-amber-400 mb-1">
                Batch #{hoveredPoint.id}
              </div>
              <div className="text-slate-200">
                {xMeta.label}: <span className="font-semibold">{hoveredPoint[xKey]}</span> {xMeta.unit}
              </div>
              <div className="text-slate-200">
                {yMeta.label}: <span className="font-semibold text-emerald-400">{hoveredPoint[yKey]}</span> {yMeta.unit}
              </div>
              <div className="text-slate-400 text-[11px] mt-1 pt-1 border-t border-slate-800">
                Age: {hoveredPoint.age}d | w/c: {(hoveredPoint.water / hoveredPoint.cement).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Pearson correlation explanation lookup
  const getCorrelationExplanation = (x: FeatureKey, y: FeatureKey, r: number) => {
    if (x === y) return 'Identity correlation (r = 1.000). A variable has perfect correlation with itself.';
    const pair = [x, y].sort().join('-');

    if (pair === 'cement-strength') {
      return `Cement vs Strength (r = ${r}): Strong positive correlation (+0.498). Higher cement increases the volume of calcium silicate hydrate (C-S-H) gel, the primary binding phase in hardened concrete.`;
    }
    if (pair === 'strength-water') {
      return `Water vs Strength (r = ${r}): Negative correlation (-0.290). In agreement with Abrams' Law (1918), excess mixing water increases capillary porosity, significantly lowering compressive strength.`;
    }
    if (pair === 'age-strength') {
      return `Age vs Strength (r = ${r}): Positive correlation (+0.329). Curing time allows continuing hydration of dicalcium silicate (C2S) and pozzolanic reactions, increasing strength over time.`;
    }
    if (pair === 'superplastic-water') {
      return `Superplasticizer vs Water (r = ${r}): Strong negative correlation (-0.658). High-range water reducers (HRWRA) permit significant water reduction (15–30%) while preserving required concrete slump.`;
    }
    if (pair === 'strength-superplastic') {
      return `Superplasticizer vs Strength (r = ${r}): Moderate positive correlation (+0.366). Superplasticizers enable low water-to-cement ratios and deflocculate cement particles, leading to dense microstructures.`;
    }
    if (pair === 'coarseagg-water' || pair === 'fineagg-water') {
      return `Aggregate vs Water (r = ${r}): Moderate negative correlation. High aggregate content reduces required cement paste volume, consequently lowering total mixing water per cubic meter.`;
    }

    return `Correlation between ${FEATURE_METADATA[x].label} and ${FEATURE_METADATA[y].label} is r = ${r}. ${
      Math.abs(r) > 0.4
        ? 'Indicates significant coupling in practical concrete batch designs.'
        : 'Indicates weak or non-linear interaction.'
    }`;
  };

  // Histogram calculation
  const histData = useMemo(() => {
    const vals = data.map((d) => d[histFeature]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const step = (max - min) / binCount;

    const bins: Array<{ min: number; max: number; count: number; label: string }> = [];
    for (let i = 0; i < binCount; i++) {
      const bMin = min + i * step;
      const bMax = min + (i + 1) * step;
      bins.push({
        min: bMin,
        max: bMax,
        count: 0,
        label: `${bMin.toFixed(0)}-${bMax.toFixed(0)}`,
      });
    }

    for (const v of vals) {
      let bIdx = Math.floor((v - min) / step);
      if (bIdx >= binCount) bIdx = binCount - 1;
      bins[bIdx].count++;
    }

    const maxCount = Math.max(...bins.map((b) => b.count));
    return { bins, maxCount, min, max, total: vals.length };
  }, [data, histFeature, binCount]);

  return (
    <div className="space-y-6">
      {/* Sub-navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart className="w-5 h-5 text-amber-400" />
            Exploratory Data Analytics (EDA)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Investigate physical hydration relationships, collinearity, and univariate distributions
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700/80">
          <button
            onClick={() => setActiveSubTab('standard')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'standard'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Core Scatter Plots
          </button>
          <button
            onClick={() => setActiveSubTab('dynamic')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'dynamic'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Dynamic Scatter
          </button>
          <button
            onClick={() => setActiveSubTab('heatmap')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'heatmap'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Correlation Matrix
          </button>
          <button
            onClick={() => setActiveSubTab('histograms')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'histograms'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Histograms
          </button>
        </div>
      </div>

      {/* 1. Core Scatter Plots View */}
      {activeSubTab === 'standard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderScatterPlot(
            'cement',
            'strength',
            'Cement vs. Compressive Strength',
            'Demonstrates positive strength gain with increasing Portland cement content (r = +0.50)'
          )}
          {renderScatterPlot(
            'water',
            'strength',
            'Water vs. Compressive Strength',
            'Illustrates Abrams\' Law: excess mixing water increases porosity, decreasing strength (r = -0.29)'
          )}
        </div>
      )}

      {/* 2. Dynamic Variable Scatter Plot View */}
      {activeSubTab === 'dynamic' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                X-Axis Predictor:
              </label>
              <select
                value={dynamicX}
                onChange={(e) => setDynamicX(e.target.value as FeatureKey)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {correlationData.keys.map((k) => (
                  <option key={k} value={k}>
                    {FEATURE_METADATA[k].label} ({FEATURE_METADATA[k].unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Y-Axis Variable:
              </label>
              <select
                value={dynamicY}
                onChange={(e) => setDynamicY(e.target.value as FeatureKey)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {correlationData.keys.map((k) => (
                  <option key={k} value={k}>
                    {FEATURE_METADATA[k].label} ({FEATURE_METADATA[k].unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Color By:
              </label>
              <select
                value={dynamicColor}
                onChange={(e) => setDynamicColor(e.target.value as FeatureKey)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {correlationData.keys.map((k) => (
                  <option key={k} value={k}>
                    {FEATURE_METADATA[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderScatterPlot(
            dynamicX,
            dynamicY,
            `${FEATURE_METADATA[dynamicX].label} vs. ${FEATURE_METADATA[dynamicY].label}`,
            `Custom dynamic plot across 1,030 samples with automated OLS regression trendline`,
            dynamicColor
          )}
        </div>
      )}

      {/* 3. Pearson Correlation Heatmap */}
      {activeSubTab === 'heatmap' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-amber-400" />
                9×9 Pearson Correlation Matrix Heatmap
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact Pearson coefficients r ∈ [-1, +1] • Click any cell to view the engineering rationale
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-sky-400 font-bold">-0.70</span>
              <div className="w-24 h-3 rounded bg-gradient-to-r from-blue-600 via-slate-700 to-amber-500"></div>
              <span className="text-amber-400 font-bold">+0.70</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <table className="border-collapse mx-auto text-xs font-mono">
              <thead>
                <tr>
                  <th className="p-2 text-right text-slate-500 font-sans text-[11px]">Features</th>
                  {correlationData.keys.map((k) => (
                    <th key={k} className="p-2 text-center text-slate-300 font-sans text-[10px] sm:text-[11px] max-w-[70px] truncate">
                      {FEATURE_METADATA[k].label.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationData.keys.map((rowKey, rIdx) => (
                  <tr key={rowKey}>
                    <td className="p-2 text-right font-sans text-[11px] text-slate-300 font-medium whitespace-nowrap">
                      {FEATURE_METADATA[rowKey].label.split(' ')[0]}
                    </td>
                    {correlationData.keys.map((colKey, cIdx) => {
                      const rVal = correlationData.matrix[rIdx][cIdx];
                      const isSelected =
                        selectedHeatmapCell?.x === colKey && selectedHeatmapCell?.y === rowKey;

                      // Color mapping function
                      let bgColor = 'bg-slate-800';
                      let textColor = 'text-slate-300';
                      if (rVal === 1) {
                        bgColor = 'bg-slate-700 text-white font-bold';
                      } else if (rVal > 0.4) {
                        bgColor = 'bg-amber-500/80 text-slate-950 font-bold';
                      } else if (rVal > 0.2) {
                        bgColor = 'bg-amber-500/30 text-amber-200';
                      } else if (rVal > 0) {
                        bgColor = 'bg-amber-500/10 text-slate-300';
                      } else if (rVal < -0.4) {
                        bgColor = 'bg-blue-600/80 text-white font-bold';
                      } else if (rVal < -0.2) {
                        bgColor = 'bg-blue-500/30 text-blue-200';
                      } else {
                        bgColor = 'bg-blue-500/10 text-slate-300';
                      }

                      return (
                        <td
                          key={colKey}
                          onClick={() =>
                            setSelectedHeatmapCell({ x: colKey, y: rowKey, r: rVal })
                          }
                          className={`p-2 text-center cursor-pointer transition-transform hover:scale-110 border border-slate-900 ${bgColor} ${
                            isSelected ? 'ring-2 ring-amber-400 z-10' : ''
                          }`}
                          title={`${FEATURE_METADATA[rowKey].label} vs ${FEATURE_METADATA[colKey].label}: r = ${rVal}`}
                        >
                          {rVal === 1 ? '1.00' : rVal.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selected Cell Civil Engineering Explanation */}
          {selectedHeatmapCell && (
            <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {FEATURE_METADATA[selectedHeatmapCell.y].label} ↔{' '}
                    {FEATURE_METADATA[selectedHeatmapCell.x].label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-amber-300 font-mono">
                    r = {selectedHeatmapCell.r}
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {getCorrelationExplanation(
                    selectedHeatmapCell.x,
                    selectedHeatmapCell.y,
                    selectedHeatmapCell.r
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Feature Histograms View */}
      {activeSubTab === 'histograms' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart className="w-5 h-5 text-amber-400" />
                Univariate Feature Distribution Histograms
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency distribution across 1,030 samples with configurable bin intervals
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Feature selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Feature:
                </label>
                <select
                  value={histFeature}
                  onChange={(e) => setHistFeature(e.target.value as FeatureKey)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {correlationData.keys.map((k) => (
                    <option key={k} value={k}>
                      {FEATURE_METADATA[k].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bin count slider */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Bins: <span className="text-amber-400 font-mono">{binCount}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={binCount}
                  onChange={(e) => setBinCount(Number(e.target.value))}
                  className="w-28 accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Histogram SVG Chart */}
          <div className="w-full">
            <svg
              viewBox="0 0 700 280"
              className="w-full h-auto select-none"
              style={{ maxHeight: '360px' }}
            >
              {/* Background grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = 20 + (1 - pct) * 210;
                const countVal = Math.round(pct * histData.maxCount);
                return (
                  <g key={i}>
                    <line
                      x1={50}
                      y1={y}
                      x2={680}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="3,3"
                      strokeWidth="0.8"
                    />
                    <text
                      x={42}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {countVal}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {histData.bins.map((b, i) => {
                const barWidth = (630 / histData.bins.length) * 0.85;
                const gap = (630 / histData.bins.length) * 0.15;
                const x = 50 + i * (barWidth + gap);
                const barHeight = (b.count / (histData.maxCount || 1)) * 210;
                const y = 230 - barHeight;

                return (
                  <g key={i} className="group cursor-pointer">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="#f59e0b"
                      opacity="0.85"
                      rx="2"
                      className="transition-colors group-hover:fill-amber-400 group-hover:opacity-100"
                    />
                    <title>{`${b.min.toFixed(1)} to ${b.max.toFixed(1)} ${FEATURE_METADATA[histFeature].unit}: ${b.count} batches (${((b.count / histData.total) * 100).toFixed(1)}%)`}</title>
                    {/* Count above bar if space permits */}
                    {b.count > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(15, y - 4)}
                        textAnchor="middle"
                        className="text-[9px] fill-slate-300 font-mono opacity-80"
                      >
                        {b.count}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X Axis line */}
              <line x1={50} y1={230} x2={680} y2={230} stroke="#64748b" strokeWidth="1" />

              {/* X Axis labels */}
              <text x={50} y={248} textAnchor="start" className="text-[10px] fill-slate-400 font-mono">
                {histData.min.toFixed(1)} {FEATURE_METADATA[histFeature].unit}
              </text>
              <text x={680} y={248} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                {histData.max.toFixed(1)} {FEATURE_METADATA[histFeature].unit}
              </text>
              <text
                x={365}
                y={265}
                textAnchor="middle"
                className="text-xs fill-slate-300 font-semibold"
              >
                {FEATURE_METADATA[histFeature].label} ({FEATURE_METADATA[histFeature].unit})
              </text>
            </svg>
          </div>

          {/* Civil engineering distribution notes */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-xs text-slate-300">
            <span className="font-semibold text-amber-400">Civil Engineering Observation: </span>
            {histFeature === 'slag' || histFeature === 'ash' ? (
              <span>
                Notice the prominent spike at zero (0 kg/m³). This reflects conventional mixes without
                supplementary cementitious materials (SCMs). In modern sustainable concrete design, replacing
                20–40% Portland cement with GGBS or Fly Ash lowers embodied carbon while refining pore structure.
              </span>
            ) : histFeature === 'age' ? (
              <span>
                The age distribution is discrete, clustering tightly around standard laboratory curing intervals:
                7 days (early benchmark), 28 days (structural design standard ASTM C39), and 56/90 days (long-term pozzolanic maturity).
              </span>
            ) : histFeature === 'strength' ? (
              <span>
                Compressive strength follows an approximate normal distribution spanning from lean non-structural concrete (2.33 MPa) up to high-performance concrete (82.6 MPa), centered around a mean of 35.8 MPa.
              </span>
            ) : (
              <span>
                Feature values reflect real-world laboratory batch variations sampled across multiple mix designs to establish broad predictive capability across water-to-binder ratios.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
