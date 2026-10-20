/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import concreteDataRaw from './data/concreteData.json';
import {
  ConcreteRecord,
  LinearModelMetrics,
  ModelMetrics,
  ModelTrainingConfig,
} from './types/concrete';
import { trainModelsPipeline, RandomForestRegressor } from './utils/mlEngine';
import { Navbar, TabId } from './components/Navbar';
import { DatasetExplorer } from './components/DatasetExplorer';
import { ExploratoryAnalytics } from './components/ExploratoryAnalytics';
import { ModelTrainer } from './components/ModelTrainer';
import { MixCalculator } from './components/MixCalculator';
import { AIAssistant } from './components/AIAssistant';
import { AboutLab } from './components/AboutLab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dataset');
  const [isTraining, setIsTraining] = useState<boolean>(false);

  // Load real dataset (1030 records)
  const data: ConcreteRecord[] = useMemo(() => {
    return concreteDataRaw as ConcreteRecord[];
  }, []);

  // ML model configuration state
  const [modelConfig, setModelConfig] = useState<ModelTrainingConfig>({
    testSplit: 0.20,
    nEstimators: 30,
    maxDepth: 10,
    minSamplesSplit: 4,
    randomSeed: 42,
  });

  // Train model synchronously on initialization
  const [modelState, setModelState] = useState<{
    rfMetrics: ModelMetrics;
    linearMetrics: LinearModelMetrics;
    rfModel: RandomForestRegressor;
  }>(() => trainModelsPipeline(data, modelConfig));

  // Handle re-training
  const handleRetrain = (newConfig: ModelTrainingConfig) => {
    setIsTraining(true);
    // Allow UI to update spinner before heavy computation
    setTimeout(() => {
      try {
        const result = trainModelsPipeline(data, newConfig);
        setModelState(result);
        setModelConfig(newConfig);
      } catch (err) {
        console.error('Retrain error:', err);
      } finally {
        setIsTraining(false);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Sticky Header / Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetCount={data.length}
        modelTrained={true}
        testR2={modelState.rfMetrics.r2}
      />

      {/* Small Project Attribution Area on Main Dashboard */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Student Prototype
            </span>
            <span>
              Author: <strong className="text-slate-200 font-semibold">Aasaithambi A</strong>
            </span>
            <span className="hidden md:inline text-slate-600">&bull;</span>
            <span className="hidden md:inline">
              Department of Civil Engineering, <span className="text-slate-300 font-medium">SASTRA Deemed University</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Data Analytics for Civil Engineering &mdash; Laboratory Exercise 11</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dataset' && <DatasetExplorer data={data} />}

        {activeTab === 'analytics' && <ExploratoryAnalytics data={data} />}

        {activeTab === 'model' && (
          <ModelTrainer
            metrics={modelState.rfMetrics}
            linearMetrics={modelState.linearMetrics}
            config={modelConfig}
            onRetrain={handleRetrain}
            isTraining={isTraining}
          />
        )}

        {activeTab === 'calculator' && (
          <MixCalculator rfModel={modelState.rfModel} />
        )}

        {activeTab === 'assistant' && (
          <AIAssistant modelMetrics={modelState.rfMetrics} />
        )}

        {activeTab === 'about' && <AboutLab />}
      </main>

      {/* Engineering Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Concrete Strength AI Lab</span>
              <span>&bull;</span>
              <span>Data Analytics for Civil Engineering &mdash; Laboratory Exercise 11</span>
            </div>

            <div className="text-slate-400 text-center sm:text-right font-mono text-[11px]">
              UCI Dataset: Prof. I-Cheng Yeh (1998) &bull; 1,030 Validated Batches &bull; ASTM C39 / ACI 211.1
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              Project Author: <strong className="text-slate-300">Aasaithambi A</strong> &bull; Department of Civil Engineering, SASTRA Deemed University
            </div>
            <div className="text-slate-400 italic">
              Academic course prototype; no official university endorsement claimed.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
