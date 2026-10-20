import React, { useState, useMemo } from 'react';
import {
  InverseDesignInput,
  InverseDesignResult,
  MixDesignInput,
} from '../types/concrete';
import { FEATURE_METADATA } from '../utils/featureMetadata';
import { RandomForestRegressor } from '../utils/mlEngine';
import {
  solveInverseMixDesign,
  validateInverseInputs,
  validateMixInputs,
} from '../utils/inverseDesign';
import {
  Calculator,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Sliders,
  Scale,
  ShieldAlert,
  Beaker,
  BookOpen,
} from 'lucide-react';

interface MixCalculatorProps {
  rfModel: RandomForestRegressor;
}

export const MixCalculator: React.FC<MixCalculatorProps> = ({ rfModel }) => {
  const [calculatorMode, setCalculatorMode] = useState<'inverse' | 'forward'>('inverse');

  // Inverse Design State (Target Strength -> estimate Water & SP)
  const [inverseInput, setInverseInput] = useState<InverseDesignInput>({
    targetStrength: 40.0,
    age: 28,
    cement: 360,
    slag: 0,
    ash: 0,
    coarseagg: 1040,
    fineagg: 750,
    slumpTarget: 'medium',
  });

  const [inverseResult, setInverseResult] = useState<InverseDesignResult | null>(() =>
    solveInverseMixDesign(
      {
        targetStrength: 40.0,
        age: 28,
        cement: 360,
        slag: 0,
        ash: 0,
        coarseagg: 1040,
        fineagg: 750,
        slumpTarget: 'medium',
      },
      rfModel
    )
  );

  // Forward Predictor State
  const [forwardMix, setForwardMix] = useState<MixDesignInput>({
    cement: 350,
    slag: 50,
    ash: 0,
    water: 175,
    superplastic: 6.0,
    coarseagg: 1020,
    fineagg: 760,
    age: 28,
  });

  // Validation
  const inverseValidation = useMemo(
    () => validateInverseInputs(inverseInput),
    [inverseInput]
  );
  const forwardValidation = useMemo(
    () => validateMixInputs(forwardMix),
    [forwardMix]
  );

  // Compute forward prediction
  const forwardPrediction = useMemo(() => {
    const row = [
      forwardMix.cement,
      forwardMix.slag,
      forwardMix.ash,
      forwardMix.water,
      forwardMix.superplastic,
      forwardMix.coarseagg,
      forwardMix.fineagg,
      forwardMix.age,
    ];
    return rfModel.predictRow(row);
  }, [forwardMix, rfModel]);

  const handleRunInverseOptimization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inverseValidation.valid) return;
    const res = solveInverseMixDesign(inverseInput, rfModel);
    setInverseResult(res);
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'm25') {
      setForwardMix({
        cement: 280,
        slag: 0,
        ash: 40,
        water: 185,
        superplastic: 0,
        coarseagg: 1050,
        fineagg: 800,
        age: 28,
      });
    } else if (presetName === 'm40') {
      setForwardMix({
        cement: 360,
        slag: 60,
        ash: 0,
        water: 165,
        superplastic: 6.5,
        coarseagg: 1020,
        fineagg: 750,
        age: 28,
      });
    } else if (presetName === 'm60') {
      setForwardMix({
        cement: 450,
        slag: 90,
        ash: 30,
        water: 145,
        superplastic: 12.0,
        coarseagg: 980,
        fineagg: 710,
        age: 28,
      });
    }
  };

  const totalForwardBinder = forwardMix.cement + forwardMix.slag + forwardMix.ash;
  const forwardWbRatio = totalForwardBinder > 0 ? forwardMix.water / totalForwardBinder : 0;
  const forwardDensity =
    forwardMix.cement +
    forwardMix.slag +
    forwardMix.ash +
    forwardMix.water +
    forwardMix.superplastic +
    forwardMix.coarseagg +
    forwardMix.fineagg;

  return (
    <div className="space-y-6">
      {/* Top Switcher Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Calculator className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Concrete Mix Design & Inverse Optimization Calculator
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exercise 11 Civil Engineering inverse solver & forward strength simulator
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setCalculatorMode('inverse')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                calculatorMode === 'inverse'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Inverse Mix Optimizer
            </button>
            <button
              onClick={() => setCalculatorMode('forward')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                calculatorMode === 'forward'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Forward Strength Simulator
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: INVERSE DESIGN CALCULATOR */}
      {calculatorMode === 'inverse' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  Target Specifications & Known Ingredients
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify target strength, cement, and aggregates to solve for required water and superplasticizer
                </p>
              </div>

              <form onSubmit={handleRunInverseOptimization} className="space-y-3 text-xs">
                {/* Target Strength */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>Target Strength (f'c):</span>
                    </label>
                    <span className="font-mono text-base font-extrabold text-amber-400">
                      {inverseInput.targetStrength} MPa
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="75"
                    step="0.5"
                    value={inverseInput.targetStrength}
                    onChange={(e) =>
                      setInverseInput({
                        ...inverseInput,
                        targetStrength: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-amber-200/70 mt-1">
                    <span>15 MPa (Lean)</span>
                    <span>40 MPa (Standard Structural)</span>
                    <span>75 MPa (HPC)</span>
                  </div>
                </div>

                {/* Target Age */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Curing Age (days):</span>
                    <span className="font-mono text-white font-bold">{inverseInput.age} days</span>
                  </div>
                  <div className="flex gap-2">
                    {[7, 14, 28, 56, 90].map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setInverseInput({ ...inverseInput, age: d })}
                        className={`flex-1 py-1 rounded text-xs font-mono transition-colors ${
                          inverseInput.age === d
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cement */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Cement (Portland):</span>
                    <span className="font-mono text-amber-300 font-bold">{inverseInput.cement} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="550"
                    step="5"
                    value={inverseInput.cement}
                    onChange={(e) =>
                      setInverseInput({
                        ...inverseInput,
                        cement: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* SCMs: Slag & Ash */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">GGBS Slag:</span>
                      <span className="font-mono text-slate-200">{inverseInput.slag} kg/m³</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="250"
                      step="5"
                      value={inverseInput.slag}
                      onChange={(e) =>
                        setInverseInput({
                          ...inverseInput,
                          slag: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Fly Ash:</span>
                      <span className="font-mono text-slate-200">{inverseInput.ash} kg/m³</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      step="5"
                      value={inverseInput.ash}
                      onChange={(e) =>
                        setInverseInput({
                          ...inverseInput,
                          ash: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Aggregates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Coarse Agg (CA):</span>
                      <span className="font-mono text-slate-200">{inverseInput.coarseagg} kg/m³</span>
                    </div>
                    <input
                      type="range"
                      min="850"
                      max="1150"
                      step="10"
                      value={inverseInput.coarseagg}
                      onChange={(e) =>
                        setInverseInput({
                          ...inverseInput,
                          coarseagg: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Fine Agg (FA):</span>
                      <span className="font-mono text-slate-200">{inverseInput.fineagg} kg/m³</span>
                    </div>
                    <input
                      type="range"
                      min="600"
                      max="950"
                      step="10"
                      value={inverseInput.fineagg}
                      onChange={(e) =>
                        setInverseInput({
                          ...inverseInput,
                          fineagg: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>

                {/* Target Workability Slump Class */}
                <div>
                  <label className="block text-slate-300 mb-1">Target Slump / Workability:</label>
                  <select
                    value={inverseInput.slumpTarget}
                    onChange={(e) =>
                      setInverseInput({
                        ...inverseInput,
                        slumpTarget: e.target.value as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="stiff">Stiff Slump (25–50 mm, pavements / mass concrete)</option>
                    <option value="medium">Medium Slump (75–125 mm, beams, slabs & walls)</option>
                    <option value="high">High Slump (150–200 mm, congested reinforcement)</option>
                    <option value="self-compacting">Self-Compacting Flow (&gt; 600 mm spread)</option>
                  </select>
                </div>

                {/* Validation Warnings */}
                {!inverseValidation.valid && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] space-y-1">
                    {inverseValidation.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!inverseValidation.valid}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Inverse Design Solver</span>
                </button>
              </form>
            </div>

            {/* Inverse Solver Results & Engineering Report (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {inverseResult && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-amber-400" />
                        Inverse Optimization Solution
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Solved via surrogate multi-grid optimization on Random Forest model
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400">Target Match:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${
                          inverseResult.deviation <= 1.5
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        ±{inverseResult.deviation} MPa
                      </span>
                    </div>
                  </div>

                  {/* Primary Outputs: Water & Superplasticizer */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-cyan-300">
                        Estimated Mixing Water (W*)
                      </div>
                      <div className="text-3xl font-extrabold text-white mt-1">
                        {inverseResult.water}
                        <span className="text-sm font-normal text-cyan-300 ml-1">kg/m³</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        w/b ratio:{' '}
                        <strong className="text-white font-mono">{inverseResult.wbRatio}</strong>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-amber-300">
                        Estimated Superplasticizer (SP*)
                      </div>
                      <div className="text-3xl font-extrabold text-white mt-1">
                        {inverseResult.superplastic}
                        <span className="text-sm font-normal text-amber-300 ml-1">kg/m³</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        Dosage:{' '}
                        <strong className="text-white font-mono">
                          {((inverseResult.superplastic / inverseResult.totalBinder) * 100).toFixed(2)}%
                        </strong>{' '}
                        of binder
                      </div>
                    </div>
                  </div>

                  {/* Physical Mix Properties Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 block">Predicted Strength:</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        {inverseResult.predictedStrength} MPa
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Total Binder:</span>
                      <span className="font-mono text-slate-200 font-bold text-sm">
                        {inverseResult.totalBinder} kg/m³
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Fresh Density:</span>
                      <span className="font-mono text-slate-200 font-bold text-sm">
                        {inverseResult.density} kg/m³
                      </span>
                    </div>
                  </div>

                  {/* Workability Rheology Assessment */}
                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/40 text-xs text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Rheology & Slump Assessment: </strong>
                      {inverseResult.workabilityNote}
                    </div>
                  </div>

                  {/* Optimization Convergence Specs */}
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Evaluated Iterations: {inverseResult.convergenceDetails.iterations}</span>
                    <span>Water Bounds: [{inverseResult.convergenceDetails.searchBoundWater.join(', ')}] kg/m³</span>
                    <span>Loss: {inverseResult.convergenceDetails.objectiveLoss}</span>
                  </div>

                  {/* Warnings & Engineering Limitations */}
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Civil Engineering Inverse Formulation Limitations & ASTM Checks
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300 leading-relaxed text-[11px]">
                      <li>
                        <strong>Ill-Posed Inverse Problem:</strong> Compressive strength is an integrated scalar output. Finding multiple mix proportions that yield a given strength is non-unique. The solver enforces Abrams' Law ($w/b$) and PCE plasticizer dosage constraints to select physically realistic coordinates.
                      </li>
                      <li>
                        <strong>Aggregate Moisture Corrections:</strong> Batching water must be corrected on-site for absorption capacity and free surface moisture of coarse and fine aggregates.
                      </li>
                      <li>
                        <strong>Mandatory Trial Mixes (ASTM C192 / ASTM C39):</strong> Predictive estimates cannot replace laboratory trial batches, slump tests (ASTM C143), air void tests (ASTM C231), and certified 28-day cylinder crushing tests.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: FORWARD STRENGTH SIMULATOR */}
      {calculatorMode === 'forward' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Sliders (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Mix Proportions Simulator (Forward Prediction)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Adjust ingredient quantities per cubic meter and observe real-time predicted strength
                  </p>
                </div>

                {/* Preset Mix Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Presets:</span>
                  <button
                    onClick={() => handleApplyPreset('m25')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    M25
                  </button>
                  <button
                    onClick={() => handleApplyPreset('m40')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    M40
                  </button>
                  <button
                    onClick={() => handleApplyPreset('m60')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    M60 HPC
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Cement */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">Portland Cement:</span>
                    <span className="font-mono text-amber-400 font-bold">{forwardMix.cement} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="540"
                    step="5"
                    value={forwardMix.cement}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, cement: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>100</span>
                    <span>540</span>
                  </div>
                </div>

                {/* Water */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">Water:</span>
                    <span className="font-mono text-cyan-400 font-bold">{forwardMix.water} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="245"
                    step="2"
                    value={forwardMix.water}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, water: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>120</span>
                    <span>245</span>
                  </div>
                </div>

                {/* Slag */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Blast Furnace Slag:</span>
                    <span className="font-mono text-slate-200 font-semibold">{forwardMix.slag} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="350"
                    step="5"
                    value={forwardMix.slag}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, slag: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0</span>
                    <span>350</span>
                  </div>
                </div>

                {/* Fly Ash */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fly Ash:</span>
                    <span className="font-mono text-slate-200 font-semibold">{forwardMix.ash} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={forwardMix.ash}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, ash: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0</span>
                    <span>200</span>
                  </div>
                </div>

                {/* Superplasticizer */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Superplasticizer:</span>
                    <span className="font-mono text-amber-300 font-bold">{forwardMix.superplastic} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={forwardMix.superplastic}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, superplastic: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0</span>
                    <span>30</span>
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">Curing Age:</span>
                    <span className="font-mono text-indigo-400 font-bold">{forwardMix.age} days</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="180"
                    step="1"
                    value={forwardMix.age}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, age: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1d</span>
                    <span>28d</span>
                    <span>180d</span>
                  </div>
                </div>

                {/* Coarse Aggregate */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Coarse Aggregate:</span>
                    <span className="font-mono text-slate-200">{forwardMix.coarseagg} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="1150"
                    step="10"
                    value={forwardMix.coarseagg}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, coarseagg: parseFloat(e.target.value) })
                    }
                    className="w-full accent-slate-400"
                  />
                </div>

                {/* Fine Aggregate */}
                <div className="space-y-1 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fine Aggregate (Sand):</span>
                    <span className="font-mono text-slate-200">{forwardMix.fineagg} kg/m³</span>
                  </div>
                  <input
                    type="range"
                    min="590"
                    max="990"
                    step="10"
                    value={forwardMix.fineagg}
                    onChange={(e) =>
                      setForwardMix({ ...forwardMix, fineagg: parseFloat(e.target.value) })
                    }
                    className="w-full accent-slate-400"
                  />
                </div>
              </div>

              {/* Validation errors */}
              {!forwardValidation.valid && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  {forwardValidation.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prediction Output & Concrete Indices (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Model Predicted Compressive Strength
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated from 30 ensemble decision trees with variance quantification
                </p>
              </div>

              {/* Hero Predicted Strength Box */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/40 rounded-xl p-6 text-center relative overflow-hidden shadow-lg">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                  Predicted Strength at {forwardMix.age} Days
                </div>
                <div className="text-5xl font-black text-white tracking-tight font-mono">
                  {forwardPrediction.mean.toFixed(1)}
                  <span className="text-xl font-normal text-amber-400 ml-2">MPa</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">
                  Ensemble Std Dev (Uncertainty): ±{forwardPrediction.std.toFixed(2)} MPa
                </div>
              </div>

              {/* Civil Engineering Concrete Ratios */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                  <div className="text-slate-400">Water / Binder (w/b):</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                    {forwardWbRatio.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {forwardWbRatio < 0.35
                      ? 'Low w/b (High Strength)'
                      : forwardWbRatio <= 0.48
                      ? 'Normal structural range'
                      : 'High w/b (Higher porosity)'}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                  <div className="text-slate-400">Total Binder:</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                    {totalForwardBinder.toFixed(0)} <span className="text-xs font-normal">kg/m³</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Cement + Slag + Fly Ash
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                  <div className="text-slate-400">Sand-Aggregate Ratio:</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {((forwardMix.fineagg / (forwardMix.fineagg + forwardMix.coarseagg)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Target: 38% – 44% for packing
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
                  <div className="text-slate-400">Theoretical Density:</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {forwardDensity.toFixed(0)} <span className="text-xs font-normal">kg/m³</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Normal weight concrete
                  </div>
                </div>
              </div>

              {/* Code Checks & Disclaimer */}
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Code & Laboratory Qualification Notice
                </div>
                <p>
                  Predictions are generated by empirical statistical regression on the UCI dataset. In professional practice, mix designs must adhere to ACI 318 / IS 456 durability requirements (minimum cementitious content, maximum w/cm for environmental exposure classes) and undergo standard laboratory testing per ASTM C192 / ASTM C39.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
