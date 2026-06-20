import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { aiAPI } from '../services/api';

export default function ContradictionDetector({ caseData, onUpdateCase }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const witnessesCount = caseData.witnesses?.length || 0;

  const runAnalysis = async () => {
    if (!caseData._id) return;
    if (witnessesCount === 0) {
      setError("At least one witness statement is required to run the contradiction detector.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await aiAPI.checkContradictions(caseData._id);
      // Backend automatically updates the case data, so we fetch/sync or update local state
      if (results && results.contradictions) {
        onUpdateCase({
          ...caseData,
          contradictions: results.contradictions
        });
      }
    } catch (err) {
      console.error('Contradiction analysis failed:', err);
      setError(err.message || 'Contradiction check failed');
    } finally {
      setLoading(false);
    }
  };

  // Run automatically when a witness statement is added/updated
  useEffect(() => {
    if (caseData._id && witnessesCount > 0) {
      runAnalysis();
    }
  }, [caseData._id, witnessesCount]);

  const contradictions = caseData.contradictions || [];

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-base font-bold text-police-khaki flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-police-khaki" />
            AI Witness Contradiction Detector
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Compares timeline details, locations, and events across witness statements and FIR narrative.
          </p>
        </div>
        
        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading || witnessesCount === 0}
          className="bg-slate-900 hover:bg-slate-950 border border-police-khaki/30 hover:border-police-khaki/60 text-police-khaki px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Run Detector</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs py-2 px-4 rounded-xl font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3 font-mono text-xs text-police-khaki">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-police-khaki border-t-transparent" />
          <span>RUNNING SEMANTIC CROSS-EXAMINATION ON WITNESSES...</span>
        </div>
      ) : witnessesCount === 0 ? (
        <div className="text-center text-xs text-slate-500 italic py-6">
          No witness statements registered. Please add statements in the Unified Pool tab.
        </div>
      ) : contradictions.length === 0 ? (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 w-12 h-12 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-200">No Contradictions Detected</h4>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">CLEAN BILL</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cross-referencing timeline entries, suspect descriptions, and actions across all {witnessesCount} statements shows no significant discrepancies.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex justify-between items-center text-xs">
            <span className="text-slate-300 font-semibold">Flagged Inconsistencies:</span>
            <span className="bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-0.5 rounded font-black">
              {contradictions.length} Discrepancies Found
            </span>
          </div>

          {/* Conflict Cards */}
          <div className="space-y-4">
            {contradictions.map((conflict, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-5 space-y-4 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500/10 text-red-400 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">!</span>
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">{conflict.type}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Confidence: <span className="text-police-khaki">{conflict.confidenceScore || 85}%</span>
                  </span>
                </div>

                {/* Side-by-side statements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reference Statement A</span>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      &ldquo;{conflict.statement1}&rdquo;
                    </p>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reference Statement B</span>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      &ldquo;{conflict.statement2}&rdquo;
                    </p>
                  </div>
                </div>

                {/* AI Explanation and Action Tip */}
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-police-khaki shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">AI Analysis Excerpt</span>
                    <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                      {conflict.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
