import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  ShieldAlert,
  FileText,
  ExternalLink,
  Cpu,
  Layers,
  Scale,
  Atom,
  User,
  Building2,
} from 'lucide-react';

export const AboutLab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Civil Engineering Data Analytics Lab
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Exercise 11 Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive Machine Learning & Mix Optimization System for High-Performance Concrete
            </p>
          </div>
        </div>
      </div>

      {/* Project Author & Academic Context Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <User className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">
            Project Author &amp; Academic Details
          </h2>
          <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
            Student Prototype
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Project Author
            </span>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <span>Aasaithambi A</span>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Student Investigator &amp; Developer
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Academic Institution
            </span>
            <div className="text-base font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>SASTRA Deemed University</span>
            </div>
            <p className="text-slate-300 text-xs">
              Department of Civil Engineering
            </p>
          </div>

          <div className="md:col-span-2 bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Course &amp; Laboratory Context
              </span>
              <div className="text-sm font-bold text-amber-400">
                Data Analytics for Civil Engineering &mdash; Laboratory Exercise 11
              </div>
              <p className="text-slate-300 text-xs">
                Predictive modeling, machine learning regression, and inverse mix design using the UCI Concrete Compressive Strength dataset.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            <strong>Academic Prototype Notice:</strong> This project is a student course prototype developed by Aasaithambi A for academic evaluation and experimental learning in Data Analytics for Civil Engineering (Laboratory Exercise 11). This prototype does not claim official university endorsement or certified laboratory status.
          </span>
        </div>
      </div>

      {/* Lab Brief & Student Objectives */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Lab Exercise 11 Objectives
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Concrete compressive strength is a highly complex, non-linear function of mixture ingredients,
          water-to-cementitious material ratios ($w/cm$), chemical admixtures, and curing age. In Exercise 11,
          students bridge classical civil engineering principles (Abrams' Law, Powers' Gel-Space Ratio)
          with modern supervised machine learning to:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
              01
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Empirical Exploration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyze the real 1,030-row UCI Concrete dataset, investigate correlations, examine zero-inflation in SCMs, and visualize Abrams' Law.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
              02
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Ensemble Regression</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Train reproducible Random Forest models, tune tree hyperparameters, evaluate $R^2$, MAE, RMSE, and inspect Mean Decrease in Impurity (MDI).
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs mb-2">
              03
            </div>
            <h3 className="text-xs font-bold text-white mb-1">Inverse Design</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Formulate inverse optimization to estimate required water and superplasticizer for target strength, recognizing ill-posed problem limits.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Citation & Provenance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Academic Dataset Provenance & Citation
        </h2>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-4 font-mono text-xs text-slate-300 leading-relaxed">
          <p className="font-sans font-bold text-amber-400 mb-1">Official Academic Citation:</p>
          Yeh, I-Cheng (1998). "Modeling of strength of high-performance concrete using artificial neural networks."{' '}
          <em className="text-slate-200">Cement and Concrete Research</em>, Vol. 28, No. 12, pp. 1797-1808.
          <br />
          <span className="text-slate-400 font-sans block mt-1">
            UCI Machine Learning Repository: DOI: 10.24432/C5PK67
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            The dataset consists of 1,030 actual concrete mixture batches tested in laboratory conditions across
            17 separate experimental campaigns. All compressive strength measurements were performed on standard
            cylinders (150 &times; 300 mm) or equivalent cubes, following standard ASTM C39 moist curing procedures.
          </p>
          <p>
            No values are missing (N = 1030, d = 9). Target compressive strength ranges from lean non-structural concrete (2.33 MPa) up to ultra-high-strength mixes (82.6 MPa).
          </p>
        </div>
      </div>

      {/* Theoretical Civil Engineering Foundations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Atom className="w-5 h-5 text-amber-400" />
          Theoretical Concrete Technology Principles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-amber-300">1. Abrams' Water-Cement Law (1918)</h3>
            <p className="text-slate-300 leading-relaxed">
              <span className="block font-mono text-amber-300 font-bold my-1 text-sm">
                f&#39;c = A / (B^(w/c))
              </span>
              Compressive strength is inversely proportional to the water-to-cement ratio (w/c). Excess mixing
              water beyond the stoichiometric requirement (&asymp; 0.23 for hydration) creates interconnected
              capillary pores, diminishing mechanical strength.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-amber-300">2. Supplementary Cementitious Materials (SCMs)</h3>
            <p className="text-slate-300 leading-relaxed">
              <strong>Ground Granulated Blast-Furnace Slag (GGBS):</strong> Latent hydraulic; reacts with $Ca(OH)_2$ released during $C_3S/C_2S$ hydration to generate secondary C-S-H.
              <br />
              <strong>Fly Ash (Class F/C):</strong> Pozzolanic micro-spheres that improve rheology (ball-bearing effect) and long-term durability.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-amber-300">3. Polycarboxylate Ether (PCE) Admixtures</h3>
            <p className="text-slate-300 leading-relaxed">
              Unlike older lignosulfonates that rely on electrostatic repulsion alone, modern PCE comb-polymers
              provide steric hindrance through polyethylene glycol (PEG) side chains, unlocking trapped water
              and allowing high slump at w/b &lt; 0.35.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
            <h3 className="font-bold text-amber-300">4. Aggregate Packing & Skeleton (ASTM C33)</h3>
            <p className="text-slate-300 leading-relaxed">
              Coarse and fine aggregates occupy 65–75% of concrete volume. Dense gradation minimizes voids
              ratio, reducing paste volume demand, shrinkage, and heat of hydration.
            </p>
          </div>
        </div>
      </div>

      {/* Safety & ASTM Standards Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-5 shadow-sm space-y-2 text-amber-200 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          Mandatory Civil Engineering Notice & Code Checks
        </div>
        <p className="text-slate-300 leading-relaxed text-xs">
          This web application is an educational prototype developed for <strong>Civil Engineering Data Analytics Lab, Exercise 11</strong>.
          Machine learning predictions, inverse optimization outputs, and AI assistant suggestions are statistical approximations intended for exploratory evaluation and educational screening only.
        </p>
        <p className="text-slate-300 leading-relaxed text-xs">
          Prior to structural placement in any real-world construction, concrete mix proportions must comply with
          governing codes (ACI 211.1, ACI 318, IS 10262, IS 456, BS EN 206) and undergo physical qualification via
          laboratory trial batches (ASTM C192), slump and rheology tests (ASTM C143), air content checks (ASTM C231),
          and standard moist-cured cylinder compression tests (ASTM C39) certified by a Licensed Professional Engineer.
        </p>
      </div>
    </div>
  );
};
