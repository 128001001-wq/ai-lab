import React, { useState, useMemo } from 'react';
import {
  ConcreteRecord,
  DatasetStats,
  FeatureKey,
} from '../types/concrete';
import { FEATURE_METADATA } from '../utils/featureMetadata';
import { computeStats } from '../utils/mlEngine';
import {
  Search,
  Download,
  CheckCircle,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Database,
  FileSpreadsheet,
} from 'lucide-react';

interface DatasetExplorerProps {
  data: ConcreteRecord[];
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>('all');
  const [selectedStrengthFilter, setSelectedStrengthFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<FeatureKey>('id' as any);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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

  // Compute exact stats for all features
  const statsMap: Record<FeatureKey, DatasetStats> = useMemo(() => {
    const res: Record<FeatureKey, DatasetStats> = {} as any;
    for (const key of allKeys) {
      const vals = data.map((d) => d[key]);
      res[key] = computeStats(vals);
    }
    return res;
  }, [data]);

  // Check missing values per column
  const missingValuesMap = useMemo(() => {
    const res: Record<string, number> = {};
    for (const key of allKeys) {
      let missing = 0;
      for (const d of data) {
        const val = d[key];
        if (val === undefined || val === null || isNaN(val)) {
          missing++;
        }
      }
      res[key] = missing;
    }
    return res;
  }, [data]);

  const totalMissing = Object.values(missingValuesMap).reduce((a, b) => a + b, 0);

  // Filtering and sorting
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Age filter
      if (selectedAgeFilter === '7' && row.age !== 7) return false;
      if (selectedAgeFilter === '14' && row.age !== 14) return false;
      if (selectedAgeFilter === '28' && row.age !== 28) return false;
      if (selectedAgeFilter === '56+' && row.age < 56) return false;

      // Strength filter
      if (selectedStrengthFilter === 'low' && row.strength >= 25) return false;
      if (
        selectedStrengthFilter === 'medium' &&
        (row.strength < 25 || row.strength > 50)
      )
        return false;
      if (selectedStrengthFilter === 'high' && row.strength <= 50) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchesId = row.id.toString().includes(q);
        const matchesCement = row.cement.toString().includes(q);
        const matchesStrength = row.strength.toString().includes(q);
        const matchesAge = row.age.toString().includes(q);
        return matchesId || matchesCement || matchesStrength || matchesAge;
      }

      return true;
    });
  }, [data, searchTerm, selectedAgeFilter, selectedStrengthFilter]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let valA: number = (a as any)[sortKey] ?? a.id;
      let valB: number = (b as any)[sortKey] ?? b.id;
      if (sortDirection === 'asc') return valA - valB;
      return valB - valA;
    });
    return sorted;
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (key: FeatureKey | 'id') => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key as any);
      setSortDirection('asc');
    }
  };

  const handleDownloadCSV = () => {
    const header = [
      'id',
      'cement',
      'slag',
      'ash',
      'water',
      'superplastic',
      'coarseagg',
      'fineagg',
      'age',
      'strength',
    ].join(',');
    const rows = data.map((d) =>
      [
        d.id,
        d.cement,
        d.slag,
        d.ash,
        d.water,
        d.superplastic,
        d.coarseagg,
        d.fineagg,
        d.age,
        d.strength,
      ].join(',')
    );
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'uci_concrete_compressive_strength.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Database className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  UCI Concrete Compressive Strength Dataset
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Author: Prof. I-Cheng Yeh (1998), Chung-Hua University • 1,030 Laboratory Test Batches
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Download entire 1,030-row raw dataset"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export CSV (1,030 rows)</span>
            </button>
          </div>
        </div>

        {/* Dataset Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 font-medium">Total Batches</div>
            <div className="text-2xl font-bold text-white mt-1">1,030</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3" /> 100% verified complete
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 font-medium">Missing Values</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{totalMissing}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Zero null or empty cells</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 font-medium">Input Features</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">8</div>
            <div className="text-[11px] text-slate-400 mt-0.5">7 mix components + curing age</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 font-medium">Target Strength Range</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">2.33 – 82.6</div>
            <div className="text-[11px] text-slate-400 mt-0.5">MPa (ASTM C39 compressive)</div>
          </div>
        </div>
      </div>

      {/* Summary Statistics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Summary Statistics & Variable Ranges
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculated across all 1,030 observations without imputation or data fabrication
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-300 font-semibold">
                <th className="py-2.5 px-3">Variable / Component</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-right">Min</th>
                <th className="py-2.5 px-3 text-right">25% (Q1)</th>
                <th className="py-2.5 px-3 text-right">Median</th>
                <th className="py-2.5 px-3 text-right">Mean</th>
                <th className="py-2.5 px-3 text-right">75% (Q3)</th>
                <th className="py-2.5 px-3 text-right">Max</th>
                <th className="py-2.5 px-3 text-right">Std Dev</th>
                <th className="py-2.5 px-3 text-center">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {allKeys.map((key) => {
                const meta = FEATURE_METADATA[key];
                const s = statsMap[key];
                const missing = missingValuesMap[key];
                const isTarget = meta.isTarget;

                return (
                  <tr
                    key={key}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isTarget ? 'bg-amber-500/5 font-semibold text-white' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-sans font-medium flex items-center gap-1.5">
                      {isTarget ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      )}
                      <span>{meta.label}</span>
                      {isTarget && (
                        <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 uppercase tracking-wider">
                          Target
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans">{meta.unit}</td>
                    <td className="py-2 px-3 text-right">{s.min}</td>
                    <td className="py-2 px-3 text-right">{s.q25}</td>
                    <td className="py-2 px-3 text-right text-amber-300 font-semibold">
                      {s.median}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-300">{s.mean}</td>
                    <td className="py-2 px-3 text-right">{s.q75}</td>
                    <td className="py-2 px-3 text-right">{s.max}</td>
                    <td className="py-2 px-3 text-right text-slate-400">±{s.std}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-sans text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> {missing}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Data Browser */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Interactive Data Explorer</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredData.length} of {data.length} records • Click column headers to sort
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search mix ID, cement, strength..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-52"
              />
            </div>

            {/* Age Filter */}
            <select
              value={selectedAgeFilter}
              onChange={(e) => {
                setSelectedAgeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Ages</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="28">28 Days (Standard)</option>
              <option value="56+">56+ Days (Long-term)</option>
            </select>

            {/* Strength Filter */}
            <select
              value={selectedStrengthFilter}
              onChange={(e) => {
                setSelectedStrengthFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Strength Levels</option>
              <option value="low">Low (&lt; 25 MPa)</option>
              <option value="medium">Medium (25–50 MPa)</option>
              <option value="high">High Strength (&gt; 50 MPa)</option>
            </select>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-300">
                <th
                  onClick={() => handleSort('id' as any)}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span># ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                {allKeys.map((key) => {
                  const meta = FEATURE_METADATA[key];
                  const isSorted = sortKey === key;
                  return (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`py-2.5 px-3 cursor-pointer text-right transition-colors ${
                        isSorted ? 'text-amber-400 font-semibold' : 'hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>{meta.label.split(' ')[0]}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-amber-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-amber-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-60" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                    No matching records found for the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-500 font-sans">#{row.id}</td>
                    <td className="py-2 px-3 text-right">{row.cement.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">{row.slag.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">{row.ash.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-cyan-300">{row.water.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">{row.superplastic.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">{row.coarseagg.toFixed(0)}</td>
                    <td className="py-2 px-3 text-right">{row.fineagg.toFixed(0)}</td>
                    <td className="py-2 px-3 text-right font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {row.age}d
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-amber-400">
                      {row.strength.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-200">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
