import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Clock, Sparkles, HelpCircle, ChevronRight, Check } from 'lucide-react';
import TeamLogo from './TeamLogo';

interface TeamStanding {
  id: string;
  name: string;
  flag: string;
  logo?: string;
  played: number;
  win: number;
  draw: number;
  loss: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
}

interface StandingsData {
  [groupName: string]: TeamStanding[];
}

interface StandingsProps {
  onBack: () => void;
}

export default function Standings({ onBack }: StandingsProps) {
  const [standings, setStandings] = useState<StandingsData>({});
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [timeAgoStr, setTimeAgoStr] = useState<string>('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');

  const fetchStandings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/standings');
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || {});
        setLastUpdated(data.lastUpdated || Date.now());
      }
    } catch (err) {
      console.error("Failed to load standings:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/cron/sync');
      if (res.ok) {
        await fetchStandings(true);
      }
    } catch (err) {
      console.error("Manual sync triggered failure:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  // Update "minutes ago" string dynamically
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) {
        setTimeAgoStr('Jamais mis à jour');
        return;
      }
      const diffMs = Date.now() - lastUpdated;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) {
        setTimeAgoStr("à l'instant");
      } else if (diffMins === 1) {
        setTimeAgoStr("il y a 1 minute");
      } else if (diffMins < 60) {
        setTimeAgoStr(`il y a ${diffMins} minutes`);
      } else {
        const hours = Math.floor(diffMins / 60);
        setTimeAgoStr(`il y a ${hours} heure${hours > 1 ? 's' : ''}`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const groups = [
    'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F',
    'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L'
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in" id="standings-view-container">
      {/* Top Header Card */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0e1324] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-emerald-500/5 filter blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/10">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Classements Officiels</h1>
            <p className="text-xs text-slate-400">Phase de Groupes de la Coupe du Monde FIFA 2026</p>
          </div>
        </div>

        {/* Sync Trigger and indicator */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className={`inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-850 px-4 py-2.5 text-xs font-bold text-slate-200 transition-all select-none cursor-pointer group active:scale-95 ${
                syncing ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-450 transition-transform ${syncing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span>{syncing ? 'Mise à jour...' : 'Rafraîchir les données'}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-950/70 border border-slate-900 px-2.5 py-1 rounded-lg">
            <Clock className="h-3 w-3 text-emerald-400" />
            <span>Dernière mise à jour : <span className="text-emerald-400 font-bold">{timeAgoStr}</span></span>
          </div>
        </div>
      </div>

      {/* Quick Group Selector Bar */}
      <div className="mb-6 flex flex-wrap gap-1.5 bg-[#0f1426]/50 border border-slate-850 p-2 rounded-2xl">
        <button
          onClick={() => setActiveGroupFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all cursor-pointer ${
            activeGroupFilter === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Tous les groupes
        </button>
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroupFilter(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all cursor-pointer ${
              activeGroupFilter === g
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {g.replace('Group ', 'Gr ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">Chargement des classements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups
            .filter(g => activeGroupFilter === 'all' || activeGroupFilter === g)
            .map(groupName => {
              const teamStandings = standings[groupName] || [];
              return (
                <div 
                  key={groupName}
                  className="rounded-2xl border border-slate-850 bg-[#0c1020]/95 hover:border-slate-800 p-4 shadow-md transition-all flex flex-col"
                  id={`standing-group-card-${groupName.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2.5 mb-3">
                    <span className="font-sans text-sm font-extrabold text-white tracking-wide uppercase">
                      {groupName.replace('Group ', 'Groupe ')}
                    </span>
                    <span className="rounded bg-slate-900 border border-slate-800 text-[9px] font-mono px-1.5 py-0.5 text-slate-400">
                      FIFA WC 26
                    </span>
                  </div>

                  {/* Standings Table Formatter */}
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[280px]">
                      <thead>
                        <tr className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-1 pb-2 w-7">Pos</th>
                          <th className="py-1 pb-2">Équipe</th>
                          <th className="py-1 pb-2 text-center w-6">J</th>
                          <th className="py-1 pb-2 text-center w-6">G</th>
                          <th className="py-1 pb-2 text-center w-6 font-medium">N</th>
                          <th className="py-1 pb-2 text-center w-6">P</th>
                          <th className="py-1 pb-2 text-center w-10">BP:BC</th>
                          <th className="py-1 pb-2 text-center w-8">+/-</th>
                          <th className="py-1 pb-2 text-right w-8 text-emerald-400">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {teamStandings.map((team, idx) => {
                          const isTopTwo = idx < 2;
                          return (
                            <tr 
                              key={team.id}
                              className={`text-[11px] transition-colors hover:bg-slate-905/40 ${
                                isTopTwo ? 'text-slate-100 font-medium' : 'text-slate-400'
                              }`}
                            >
                              <td className="py-2 flex items-center gap-1">
                                <span className={`flex h-4.5 w-4.5 items-center justify-center rounded text-[10px] font-mono font-extrabold ${
                                  idx === 0
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : idx === 1
                                    ? 'bg-emerald-600/10 text-emerald-500'
                                    : 'bg-slate-900 text-slate-550'
                                }`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-2">
                                <div className="flex items-center gap-1.5 truncate max-w-[110px] xs:max-w-none">
                                  <TeamLogo logoUrl={team.logo} fallbackFlag={team.flag} name={team.name} className="h-5 w-5 rounded-md p-0.5 bg-slate-950 border-slate-900 shadow-none" />
                                  <span className="truncate" title={team.name}>{team.name}</span>
                                </div>
                              </td>
                              <td className="py-2 text-center font-mono">{team.played}</td>
                              <td className="py-2 text-center font-mono">{team.win}</td>
                              <td className="py-2 text-center font-mono">{team.draw}</td>
                              <td className="py-2 text-center font-mono">{team.loss}</td>
                              <td className="py-2 text-center font-mono text-slate-550">
                                {team.goalsFor}:{team.goalsAgainst}
                              </td>
                              <td className={`py-2 text-center font-mono ${
                                team.goalsDiff > 0
                                  ? 'text-teal-400'
                                  : team.goalsDiff < 0
                                  ? 'text-rose-450'
                                  : 'text-slate-550'
                              }`}>
                                {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                              </td>
                              <td className="py-2 text-right font-mono font-bold text-slate-100">
                                <span className={idx === 0 ? 'text-emerald-400' : ''}>
                                  {team.points}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Qualifications note */}
                  <div className="mt-3.5 pt-2 border-t border-slate-900 flex items-center gap-1.5 text-[8.5px] font-mono text-slate-500 select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-550" />
                    <span>Top 2 qualifiés directement pour les 16es</span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
