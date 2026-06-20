import React, { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle2, ChevronRight, Swords, Clock, AlertCircle } from 'lucide-react';
import { getOrCreateUserId } from '../utils/freemiumTracker';

interface HistoryItem {
  userId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  winner: string;
  score: string;
  timestamp: number;
}

interface PredictionHistoryProps {
  onSelectMatch: (matchId: string) => void;
  onBrowseMatches: () => void;
}

export default function PredictionHistory({ onSelectMatch, onBrowseMatches }: PredictionHistoryProps) {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const userId = getOrCreateUserId();
        const res = await fetch(`/api/history?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setHistoryList(data.history || []);
        } else {
          setError("Impossible de charger votre historique de prédictions.");
        }
      } catch (err) {
        console.error("Failed to load prediction history:", err);
        setError("Erreur réseau lors de la récupération de votre historique.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  // Format timestamp nicely
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      
      {/* Page Header */}
      <div className="mb-8 border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <History className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="font-sans text-xl font-bold text-white tracking-tight sm:text-2xl">
                Historique de Consultations
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Retrouvez les prédictions IA enregistrées lors de vos lectures d'analyses.
              </p>
            </div>
          </div>
        </div>
        
        <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] font-mono text-slate-400 font-semibold self-start sm:self-auto">
          {historyList.length} {historyList.length > 1 ? 'mémorisations' : 'mémorisation'}
        </span>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-[#0f1426] border border-slate-800 rounded-2xl" />
          <div className="h-16 bg-[#0f1426] border border-slate-800 rounded-2xl" />
          <div className="h-16 bg-[#0f1426] border border-slate-800 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-950/40 bg-rose-950/10 p-5 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-550 mb-3" />
          <h3 className="text-slate-100 font-bold font-sans text-sm mb-1">Une erreur est survenue</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">{error}</p>
        </div>
      ) : historyList.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-[#0f1426] p-12 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800/80 text-slate-500">
            <History className="h-7 w-7" />
          </div>
          <h3 className="font-sans text-base font-bold text-slate-200 mb-1.5Packed">Votre historique est vide</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
            Consultez l'analyse complète d'un match de la Coupe du Monde pour mémoriser automatiquement sa prédiction IA ici.
          </p>
          <button
            onClick={onBrowseMatches}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-xs uppercase px-5 py-3 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <span>Parcourir les matchs</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4.5">
          {historyList.map((item, idx) => {
            const isWinnerHome = item.winner === item.homeTeam;
            const isWinnerAway = item.winner === item.awayTeam;
            const isDraw = item.winner === "Match nul" || item.winner === "Nul";

            return (
              <div
                key={`${item.matchId}-${idx}`}
                onClick={() => onSelectMatch(item.matchId)}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0f1426] p-5.5 transition-all hover:border-emerald-500/35 hover:bg-[#131b34] cursor-pointer shadow-md shadow-slate-950/10"
              >
                {/* Match Header Details */}
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-450 group-hover:bg-slate-950/50 transition-colors">
                    <Clock className="h-4.5 w-4.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div>
                    {/* Teams block */}
                    <div className="flex items-center gap-1.5 font-sans font-extrabold text-[#f1f5f9] tracking-tight text-sm">
                      <span className="text-base" role="img" aria-label={item.homeTeam}>{item.homeFlag}</span>
                      <span>{item.homeTeam}</span>
                      <span className="text-slate-500 font-mono font-medium text-xs px-1">VS</span>
                      <span className="text-base" role="img" aria-label={item.awayTeam}>{item.awayFlag}</span>
                      <span>{item.awayTeam}</span>
                    </div>

                    {/* Meta dates info */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span>Consulté le : {formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Captured Prediction Results block */}
                <div className="flex flex-wrap items-center gap-3 sm:text-right sm:justify-end">
                  
                  {/* Winner flag block */}
                  <div className="rounded-xl bg-slate-950/65 border border-slate-800/80 px-3.5 py-2">
                    <div className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-bold">Vainqueur Estimé</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5 flex items-center sm:justify-end gap-1 font-sans">
                      {isWinnerHome && <span className="text-emerald-400">★ {item.homeTeam}</span>}
                      {isWinnerAway && <span className="text-purple-400">★ {item.awayTeam}</span>}
                      {isDraw && <span className="text-amber-400">⚖ Match nul</span>}
                      {!isWinnerHome && !isWinnerAway && !isDraw && <span className="text-slate-350">{item.winner}</span>}
                    </div>
                  </div>

                  {/* Score block */}
                  <div className="rounded-xl bg-emerald-950/15 border border-emerald-900/40 px-3.5 py-2 min-w-[90px]">
                    <div className="text-[10px] text-slate-450 uppercase font-mono tracking-wider font-bold">Score IA</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5 font-mono">
                      {item.score}
                    </div>
                  </div>

                  {/* chevron forward on hover */}
                  <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/60 border border-slate-800 text-slate-500 group-hover:text-emerald-400 group-hover:border-slate-705 group-hover:bg-slate-900 transition-all ml-1 shrink-0">
                    <ChevronRight className="h-4.5 w-4.5 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Footer warning info */}
      <p className="text-[10px] text-slate-500 text-center leading-relaxed mt-10 italic max-w-md mx-auto">
        * Les prédictions mémorisées ci-dessus représentent les estimations logicielles MatchIQ calculées au moment de la consultation de l&apos;analyse.
      </p>

    </div>
  );
}
