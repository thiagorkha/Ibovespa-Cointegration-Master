import React, { useState, useEffect } from 'react';
import { scanMarketForPairs, analyzeSpecificPair } from '../services/geminiService';
import { ScannedPair, DetailedAnalysis } from '../types';
import { PERIODS } from '../constants';
import { Search, TrendingUp, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

interface ScannerProps {
  onSelectPair: (analysis: DetailedAnalysis) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onSelectPair }) => {
  const [period, setPeriod] = useState(PERIODS[2]); // Default 6 Months
  const [pairs, setPairs] = useState<ScannedPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleScan = async () => {
    setLoading(true);
    setPairs([]);
    try {
      const results = await scanMarketForPairs(period);
      setPairs(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeClick = async (pair: ScannedPair) => {
    setAnalyzingId(pair.id);
    try {
      const detailedData = await analyzeSpecificPair(pair.assetY, pair.assetX, period);
      onSelectPair(detailedData);
    } catch (e) {
      alert("Erro ao analisar par. Tente novamente.");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-400" />
          Scanner de Cointegração
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-slate-400 mb-1">Período de Análise</label>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          
          <button
            onClick={handleScan}
            disabled={loading}
            className={`w-full md:w-auto px-6 py-2.5 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2
              ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-900/20'}
            `}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Escaneando Mercado...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                Buscar Pares Oportunos
              </>
            )}
          </button>
        </div>
        
        <p className="text-xs text-slate-500 mt-3">
          * Filtros aplicados: ADF Confidence &gt; 95% e Z-Score &gt; 2.0 ou &lt; -2.0
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pairs.map((pair) => (
          <div 
            key={pair.id} 
            className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-900/10 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-baseline gap-2">
                   <span className="text-lg font-bold text-emerald-400">{pair.assetY}</span>
                   <span className="text-xs text-slate-500">vs</span>
                   <span className="text-lg font-bold text-red-400">{pair.assetX}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Long / Short</div>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-mono font-bold border border-emerald-500/20">
                ADF {pair.adfConfidence}%
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Z-Score Atual</span>
                <span className={`font-mono font-bold ${Math.abs(pair.currentZScore) > 2 ? 'text-yellow-400' : 'text-white'}`}>
                  {pair.currentZScore.toFixed(2)}σ
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Meia-vida</span>
                <span className="text-white font-mono">{pair.halfLife} dias</span>
              </div>
            </div>

            <button
              onClick={() => handleAnalyzeClick(pair)}
              disabled={analyzingId === pair.id}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {analyzingId === pair.id ? 'Gerando Gráficos...' : (
                <>
                  Ver Análise Completa <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ))}

        {!loading && pairs.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhum par encontrado ou busca ainda não iniciada.
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
