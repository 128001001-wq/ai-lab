import React from 'react';
import {
  Database,
  BarChart3,
  BrainCircuit,
  Calculator,
  Bot,
  Info,
  CheckCircle2,
  HardHat,
} from 'lucide-react';

export type TabId =
  | 'dataset'
  | 'analytics'
  | 'model'
  | 'calculator'
  | 'assistant'
  | 'about';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  datasetCount: number;
  modelTrained: boolean;
  testR2?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  datasetCount,
  modelTrained,
  testR2,
}) => {
  const navItems: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: 'dataset', label: 'UCI Dataset', icon: <Database className="w-4 h-4" /> },
    { id: 'analytics', label: 'Exploratory Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'model', label: 'ML Training & Evaluation', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'calculator', label: 'Mix Calculator & Inverse', icon: <Calculator className="w-4 h-4" /> },
    { id: 'assistant', label: 'Engineering AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { id: 'about', label: 'Lab Exercise 11 Brief', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Lab Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30">
              <HardHat className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">
                  Concrete Strength <span className="text-amber-400">AI Lab</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  Exercise 11
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Author: <span className="text-slate-200 font-medium">Aasaithambi A</span> &bull; Dept. of Civil Engineering, SASTRA Deemed University
              </p>
            </div>
          </div>

          {/* Quick Real Status Badges */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dataset:</span>
              <strong className="text-emerald-400 font-semibold">{datasetCount}</strong>
              <span className="text-slate-400">records</span>
            </div>

            {modelTrained && testR2 !== undefined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-amber-500/30 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Random Forest:</span>
                <strong className="text-amber-400 font-semibold">R² = {testR2.toFixed(3)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
