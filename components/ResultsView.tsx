import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import { DetailedAnalysis } from '../types';
import { XCircle, Info, ExternalLink, Globe } from 'lucide-react';

interface ResultsViewProps {
  data: DetailedAnalysis;
  onClose: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 p-2 rounded shadow-xl">
        <p className="text-slate-300 text-xs mb-1">{label}</p>
        <p className="text-white font-mono font-bold">
          {payload[0].value.toFixed(3)}
        </p>
      </div>
    );
  }
  return null;
};

const ResultsView: React.FC<ResultsViewProps> = ({ data, onClose }) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-slate-850 p-4 rounded-lg border-l-4 border-emerald-500 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white">{data.pair}</h2>
          <p className="text-slate-400 text-sm">Última atualização: {data.lastUpdated}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <XCircle className="w-8 h-8" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Confiança ADF</p>
          <p className={`text-2xl font-mono font-bold ${data.adfConfidence >= 95 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {data.adfConfidence}%
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Meia-Vida</p>
          <p className="text-2xl font-mono font-bold text-blue-400">{data.halfLife} <span className="text-sm text-slate-500">dias</span></p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Expoente Hurst</p>
          <p className={`text-2xl font-mono font-bold ${data.hurstExponent < 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.hurstExponent.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Z-Score Atual</p>
          <p className={`text-2xl font-mono font-bold ${Math.abs(data.currentZScore) > 2 ? 'text-yellow-400' : 'text-slate-200'}`}>
            {data.currentZScore.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-lg">
         <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Resíduos (Z-Score)
         </h3>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.residuals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <ReferenceLine y={2} stroke="#facc15" strokeDasharray="5 5" label={{ value: '+2σ', position: 'right', fill: '#facc15', fontSize: 10 }} />
                <ReferenceLine y={-2} stroke="#facc15" strokeDasharray="5 5" label={{ value: '-2σ', position: 'right', fill: '#facc15', fontSize: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 6, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-lg">
         <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Rotação do Beta
         </h3>
         <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.betaRotation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="step" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex gap-3 h-full">
          <Info className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-white mb-1">Interpretação (Baseada em dados recentes)</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{data.interpretation}</p>
          </div>
        </div>

        {data.sources && data.sources.length > 0 && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-full">
             <div className="flex items-center gap-2 mb-3">
               <Globe className="w-5 h-5 text-emerald-400" />
               <h4 className="font-bold text-white">Fontes de Dados</h4>
             </div>
             <ul className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
               {data.sources.map((source, index) => (
                 <li key={index} className="flex items-start gap-2">
                   <ExternalLink className="w-3 h-3 text-slate-500 mt-1 shrink-0" />
                   <a 
                     href={source.uri} 
                     target="_blank" 
                     rel="noreferrer"
                     className="text-xs text-blue-400 hover:text-blue-300 break-all hover:underline"
                   >
                     {source.title}
                   </a>
                 </li>
               ))}
             </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsView;