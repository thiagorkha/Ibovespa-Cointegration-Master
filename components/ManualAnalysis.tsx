import React, { useState } from 'react';
import { IBOVESPA_STOCKS, PERIODS } from '../constants';
import { analyzeSpecificPair } from '../services/geminiService';
import { DetailedAnalysis } from '../types';
import { Calculator, Play, AlertCircle } from 'lucide-react';

interface ManualAnalysisProps {
  onAnalyze: (analysis: DetailedAnalysis) => void;
}

const ManualAnalysis: React.FC<ManualAnalysisProps> = ({ onAnalyze }) => {
  const [assetY, setAssetY] = useState(IBOVESPA_STOCKS[0].symbol);
  const [assetX, setAssetX] = useState(IBOVESPA_STOCKS[1].symbol);
  const [period, setPeriod] = useState(PERIODS[2]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (assetY === assetX) {
      setError("Selecione ativos diferentes para Y e X.");
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeSpecificPair(assetY, assetX, period);
      onAnalyze(result);
    } catch (err: any) {
      setError(err.message || "Falha ao analisar o par. Verifique sua conexão ou a API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-lg animate-fade-in max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-400" />
        Análise Manual
      </h2>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-200 text-sm flex gap-3 items-center">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-emerald-400">Ativo Dependente (Y - Long)</label>
            <select
              value={assetY}
              onChange={(e) => setAssetY(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {IBOVESPA_STOCKS.map(s => (
                <option key={`y-${s.symbol}`} value={s.symbol}>{s.symbol} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-red-400">Ativo Independente (X - Short)</label>
            <select
              value={assetX}
              onChange={(e) => setAssetX(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-red-500 outline-none"
            >
              {IBOVESPA_STOCKS.map(s => (
                <option key={`x-${s.symbol}`} value={s.symbol}>{s.symbol} - {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-400">Período de Dados</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {PERIODS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
            ${loading 
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white active:scale-[0.99]'}
          `}
        >
          {loading ? 'Calculando Cointegração...' : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Executar Análise
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ManualAnalysis;