import React, { useState } from 'react';
import Scanner from './components/Scanner';
import ManualAnalysis from './components/ManualAnalysis';
import ResultsView from './components/ResultsView';
import { DetailedAnalysis } from './types';
import { LayoutGrid, Calculator, BarChart3 } from 'lucide-react';

enum ViewState {
  SCANNER = 'SCANNER',
  MANUAL = 'MANUAL',
  RESULTS = 'RESULTS'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SCANNER);
  const [analysisResult, setAnalysisResult] = useState<DetailedAnalysis | null>(null);

  const handlePairSelection = (data: DetailedAnalysis) => {
    setAnalysisResult(data);
    setCurrentView(ViewState.RESULTS);
  };

  const handleBackToScanner = () => {
    setAnalysisResult(null);
    setCurrentView(ViewState.SCANNER);
  };
  
  const handleBackToManual = () => {
     setAnalysisResult(null);
     setCurrentView(ViewState.MANUAL);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              IBOV Cointegration
            </h1>
          </div>
          <div className="hidden md:flex gap-1 bg-slate-800 p-1 rounded-lg">
             <button 
                onClick={() => setCurrentView(ViewState.SCANNER)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === ViewState.SCANNER ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               Scanner
             </button>
             <button 
                onClick={() => setCurrentView(ViewState.MANUAL)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === ViewState.MANUAL ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               Manual
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === ViewState.SCANNER && (
          <Scanner onSelectPair={handlePairSelection} />
        )}

        {currentView === ViewState.MANUAL && (
          <ManualAnalysis onAnalyze={handlePairSelection} />
        )}

        {currentView === ViewState.RESULTS && analysisResult && (
          <ResultsView 
            data={analysisResult} 
            onClose={() => {
                // Return to the previous screen logic
                // For simplicity, we can verify checking a state, but here I'll default to Scanner unless we add specific "lastView" state
                setCurrentView(ViewState.SCANNER); 
            }} 
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => setCurrentView(ViewState.SCANNER)}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center ${currentView === ViewState.SCANNER ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Scanner</span>
          </button>
          <button 
            onClick={() => setCurrentView(ViewState.MANUAL)}
            className={`flex flex-col items-center gap-1 w-full h-full justify-center ${currentView === ViewState.MANUAL ? 'text-blue-400' : 'text-slate-500'}`}
          >
            <Calculator className="w-5 h-5" />
            <span className="text-[10px] font-medium">Manual</span>
          </button>
        </div>
      </nav>
      
      {/* Global styles for animations */}
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default App;
