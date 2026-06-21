import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';

interface MatchAnalysisModalProps {
  matchId: string;
  onClose: () => void;
}

export default function MatchAnalysisModal({ matchId, onClose }: MatchAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/gemini-analysis/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data.analysis || '');
        } else {
          setError("Impossible de charger l'analyse IA.");
        }
      } catch (err) {
        console.error("Failed to fetch analysis:", err);
        setError("Erreur de connexion.");
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [matchId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Sparkles className="w-5 h-5" />
            <h2>Analyse IA du match</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-mono text-sm tracking-wide animate-pulse">Génération de l'analyse...</p>
            </div>
          ) : error ? (
            <div className="text-center p-10">
              <p className="text-rose-400 bg-rose-500/10 py-3 px-4 rounded-xl border border-rose-500/20">{error}</p>
            </div>
          ) : (
            <div className="text-slate-300 leading-relaxed font-sans text-sm">
              <Markdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-base font-extrabold text-indigo-400 mt-5 mb-2 uppercase tracking-wider border-b border-indigo-950/60 pb-1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-extrabold text-indigo-400 mt-5 mb-2 uppercase tracking-wider border-b border-indigo-950/60 pb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-extrabold text-indigo-400 mt-5 mb-2 uppercase tracking-wider border-b border-indigo-950/60 pb-1" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-sm font-extrabold text-indigo-400 mt-5 mb-2 uppercase tracking-wider border-b border-indigo-950/60 pb-1" {...props} />,
                  p: ({node, ...props}) => <p className="text-xs leading-relaxed mb-4 text-slate-300" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-350" {...props} />,
                  li: ({node, ...props}) => <li className="text-xs leading-relaxed" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                }}
              >
                {analysis || ""}
              </Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
