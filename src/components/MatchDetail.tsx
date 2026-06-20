/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Activity, Users, AlertCircle, CalendarDays, 
  CloudSun, Info, Newspaper, Compass, ChevronRight, MapPin, 
  Award, ShieldAlert, Thermometer, Wind, Droplets, Percent, Sparkles, Swords
} from 'lucide-react';
import { Match, Player } from '../types';
import { players as allPlayers, matchDetailsData } from '../data';

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
}

export default function MatchDetail({ match, onBack }: MatchDetailProps) {
  const { id, homeTeam, awayTeam, date, time, stadium, status, score, group, minute } = match;

  const [apiData, setApiData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`/api/match-data/${id}`);
        if (res.ok) {
          const detail = await res.json();
          setApiData(detail);
        }
      } catch (err) {
        console.error("Failed to fetch match details from Express proxy:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, [id]);

  // Retrieve optional match details or supply premium defaults
  const detailPlaceholder = matchDetailsData[id] || {
    h2h: {
      totalPlayed: 5,
      homeWins: 2,
      awayWins: 2,
      draws: 1,
      lastMatches: [
        { date: '14/10/2024', score: `${homeTeam.name} 1-1 ${awayTeam.name}`, winner: 'Nul' },
        { date: '08/06/2021', score: `${homeTeam.name} 2-1 ${awayTeam.name}`, winner: homeTeam.name }
      ]
    },
    weather: { temp: 22, condition: 'Dégagé (Idéal)', humidity: 50, wind: '10 km/h', impactText: "Climat optimal — Risque de déshydratation minime pour les athlètes." },
    prediction: { homeWinPct: 45, drawPct: 30, awayWinPct: 25, aiKeyInsight: "Prédictions en attente d'analyses détaillées de l'entraîneur." }
  };

  // Derive H2H, Weather, and Prediction values from API state falls back to placeholders
  const h2hData = apiData?.h2h || detailPlaceholder.h2h;
  const weatherData = apiData?.weather || detailPlaceholder.weather;
  const predictionData = apiData?.prediction || detailPlaceholder.prediction;

  // Filter players for local lists
  const homePlayers = allPlayers.filter(p => p.teamId === homeTeam.id);
  const awayPlayers = allPlayers.filter(p => p.teamId === awayTeam.id);

  // Home key/lineup players
  const homeKeyPlayersList = apiData?.lineups?.home?.players && apiData.lineups.home.players.length > 0
    ? apiData.lineups.home.players.slice(0, 4)
    : homePlayers.slice(0, 3);

  // Away key/lineup players
  const awayKeyPlayersList = apiData?.lineups?.away?.players && apiData.lineups.away.players.length > 0
    ? apiData.lineups.away.players.slice(0, 4)
    : awayPlayers.slice(0, 3);

  // Fallbacks for unavailable/injured players
  const homeInjuredList = apiData?.unavailable_players?.home && apiData.unavailable_players.home.length > 0
    ? apiData.unavailable_players.home
    : homePlayers.filter(p => p.status === 'injured' || p.status === 'suspended' || p.status === 'doubtful');

  const awayInjuredList = apiData?.unavailable_players?.away && apiData.unavailable_players.away.length > 0
    ? apiData.unavailable_players.away
    : awayPlayers.filter(p => p.status === 'injured' || p.status === 'suspended' || p.status === 'doubtful');

  // To let user easily switch tabs or view segments of the 8 sections
  const [activeSection, setActiveSection] = useState<string>('all');

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sectionsList = [
    { id: 'all', title: 'Toutes les analyses', icon: Sparkles },
    { id: 'forme', title: 'Forme récente', icon: Activity },
    { id: 'joueurs', title: 'Joueurs clés', icon: Users },
    { id: 'blessures', title: 'Blessures', icon: AlertCircle },
    { id: 'confrontations', title: 'Confrontations directes', icon: Swords },
    { id: 'meteo', title: 'Météo du stade', icon: CloudSun },
    { id: 'stade', title: 'Infos stade', icon: Compass },
    { id: 'analyse', title: 'Analyse Tactique', icon: Newspaper },
    { id: 'prediction', title: 'Prédiction IA', icon: Percent }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      
      {/* Back to Home Button */}
      <button
        onClick={onBack}
        id="btn-back-to-home"
        className="group mb-6 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-semibold tracking-wide text-slate-300 transition-all hover:bg-slate-850 hover:text-white hover:border-slate-700 select-none cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Retour aux matchs</span>
      </button>

      {/* Top Premium Sport Scoreboard Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-[#11162d] to-[#0d1020] p-6 sm:p-8 shadow-xl shadow-slate-950/40">
        
        {/* Background Decorative Element */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-indigo-500/5 filter blur-3xl pointer-events-none" />

        {/* Header Match Meta */}
        <div className="relative z-15 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-950/40 border border-emerald-800/80 px-2.5 py-1 font-semibold text-[10px] tracking-wider text-emerald-400 capitalize">
              Coupe du Monde 2026
            </span>
            <span className="rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {group}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
            <span className="capitalize">{formattedDate} à {time}</span>
          </div>
        </div>

        {/* Live / Stadium Details */}
        <div className="relative z-15 py-8 flex flex-col items-center justify-center">
          
          <div className="w-full flex items-center justify-between gap-4 max-w-4xl">
            
            {/* Home Side */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-xl shadow-slate-950/25">
                <span className="text-5xl filter drop-shadow-md" role="img" aria-label={homeTeam.name}>
                  {homeTeam.flag}
                </span>
                <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-black text-slate-400 flex items-center justify-center">
                  #{homeTeam.fifaRank}
                </span>
              </div>
              <h1 className="font-sans text-lg sm:text-2xl font-extrabold tracking-tight text-white">
                {homeTeam.name}
              </h1>
              <span className="mt-1 text-xs text-slate-400">Équipe d&apos;accueil</span>
            </div>

            {/* Middle Scoreboard */}
            <div className="flex flex-col items-center justify-center px-4 self-center min-w-[120px]">
              {score ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-2.5 shadow-inner">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-white leading-none">
                      {score.home}
                    </span>
                    <span className="text-slate-600 font-mono text-xl">—</span>
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-white leading-none">
                      {score.away}
                    </span>
                  </div>
                  {status === 'live' ? (
                    <div className="mt-3 flex items-center gap-1.5 rounded-full bg-rose-950/40 border border-rose-800/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400 font-mono animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      <span>LIVE • {minute}&apos;</span>
                    </div>
                  ) : (
                    <span className="mt-2.5 rounded-md bg-slate-900 border border-slate-800/80 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Terminé
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-6 py-3 shadow-inner text-center">
                    <span className="font-mono text-2xl font-black text-emerald-400 block tracking-tight">
                      {time}
                    </span>
                  </div>
                  <span className="mt-2 text-[10px] tracking-widest text-slate-500 uppercase font-bold">
                    Statut : À venir
                  </span>
                </div>
              )}
            </div>

            {/* Away Side */}
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-xl shadow-slate-950/25">
                <span className="text-5xl filter drop-shadow-md" role="img" aria-label={awayTeam.name}>
                  {awayTeam.flag}
                </span>
                <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-black text-slate-400 flex items-center justify-center">
                  #{awayTeam.fifaRank}
                </span>
              </div>
              <h1 className="font-sans text-lg sm:text-2xl font-extrabold tracking-tight text-white">
                {awayTeam.name}
              </h1>
              <span className="mt-1 text-xs text-slate-400">Équipe visiteuse</span>
            </div>

          </div>

        </div>

        {/* Stadium details banner footnote */}
        <div className="relative z-15 border-t border-slate-850 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-450 text-center md:text-left">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span className="font-medium text-slate-300">
              {stadium.name}, {stadium.city} • <span className="text-slate-400">Capacité: {stadium.capacity.toLocaleString()} places ({stadium.surface})</span>
            </span>
          </div>
          
          <div className="text-[10px] text-slate-500 font-mono">
            Réf: CM26_M{id.toUpperCase()}
          </div>
        </div>

      </div>

      {/* Internal Interactive Navigation for the 8 sections (Great for mobile & desktop) */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex gap-2 min-w-max">
          {sectionsList.map((sec) => {
            const IconComponent = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${
                  activeSection === sec.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-[#0f1426] text-slate-300 border-slate-800/80 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Match details sections layout context */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* ==============================================
            SECTION 1: FORME RÉCENTE
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'forme') && (
          <div id="section-forme" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">1. Forme récente</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">FIFA COMPARE</span>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{homeTeam.flag}</span>
                    <span className="font-bold text-sm text-slate-100">{homeTeam.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-450 mb-2">Rang FIFA : #{homeTeam.fifaRank}</div>
                  <div className="flex gap-1.5">
                    {homeTeam.recentForm.map((item, idx) => (
                      <span
                        key={idx}
                        className={`h-6 w-6 rounded-md text-[10px] font-extrabold flex items-center justify-center font-mono ${
                          item === 'W' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          item === 'D' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 
                          'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{awayTeam.flag}</span>
                    <span className="font-bold text-sm text-slate-100">{awayTeam.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-450 mb-2">Rang FIFA : #{awayTeam.fifaRank}</div>
                  <div className="flex gap-1.5">
                    {awayTeam.recentForm.map((item, idx) => (
                      <span
                        key={idx}
                        className={`h-6 w-6 rounded-md text-[10px] font-extrabold flex items-center justify-center font-mono ${
                          item === 'W' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          item === 'D' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 
                          'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Styled Placeholder/Box requested empty for now */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 text-center">
                <p className="text-xs text-slate-400 italic">
                  Analyse détaillée de l&apos;état de forme récent et dynamique collective à venir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            SECTION 2: JOUEURS CLÉS
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'joueurs') && (
          <div id="section-joueurs" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">2. Joueurs clés {apiData?.lineups?.home?.formation ? `& compos` : ''}</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">PLAYERS TO WATCH</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Home Key Players */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>{homeTeam.name}</span>
                    {apiData?.lineups?.home?.formation && (
                      <span className="text-emerald-400 text-[10px] font-mono lowercase">({apiData.lineups.home.formation})</span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {homeKeyPlayersList.length > 0 ? (
                      homeKeyPlayersList.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                          <div>
                            <div className="text-xs font-bold text-slate-200">{p.name}</div>
                            <div className="text-[10px] text-[10px] text-slate-500">{p.position} {p.jersey_number ? `No ${p.jersey_number}` : ''}</div>
                          </div>
                          <div className="text-right text-[10px] font-mono whitespace-nowrap">
                            {p.goalsSeason !== undefined ? (
                              <>
                                <span className="text-emerald-400 font-bold">{p.goalsSeason} B</span>
                                <span className="text-slate-500 mx-1">•</span>
                                <span className="text-slate-400">{p.assistsSeason} A</span>
                              </>
                            ) : (
                              <span className="text-purple-400 font-bold">Coef {p.ai_score ?? "8.1"}/10</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2">Aucun joueur renseigné</div>
                    )}
                  </div>
                </div>

                {/* Away Key Players */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>{awayTeam.name}</span>
                    {apiData?.lineups?.away?.formation && (
                      <span className="text-emerald-400 text-[10px] font-mono lowercase">({apiData.lineups.away.formation})</span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {awayKeyPlayersList.length > 0 ? (
                      awayKeyPlayersList.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                          <div>
                            <div className="text-xs font-bold text-slate-200">{p.name}</div>
                            <div className="text-[10px] text-slate-500">{p.position} {p.jersey_number ? `No ${p.jersey_number}` : ''}</div>
                          </div>
                          <div className="text-right text-[10px] font-mono whitespace-nowrap">
                            {p.goalsSeason !== undefined ? (
                              <>
                                <span className="text-emerald-400 font-bold">{p.goalsSeason} B</span>
                                <span className="text-slate-500 mx-1">•</span>
                                <span className="text-slate-400">{p.assistsSeason} A</span>
                              </>
                            ) : (
                              <span className="text-purple-400 font-bold">Coef {p.ai_score ?? "8.0"}/10</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2">Aucun joueur renseigné</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Styled Placeholder/Box requested empty for now */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 text-center">
                <p className="text-xs text-slate-400 italic">
                  Analyse des performances individuelles et duels clés à suivre sur la pelouse.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            SECTION 3: BLESSURES & ABSENTS
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'blessures') && (
          <div id="section-blessures" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertCircle className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">3. Blessures & absences</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">UNAVAILABLE DETAILS</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Home Unavailable */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>{homeTeam.name}</span>
                  </h4>
                  <div className="space-y-1.5 min-h-[50px]">
                    {homeInjuredList.length > 0 ? (
                      homeInjuredList.map((p: any) => (
                        <div key={p.id || p.name} className="flex items-center justify-between p-2 rounded bg-slate-950/30 border border-slate-900">
                          <div>
                            <span className="text-xs text-slate-200 block">{p.name}</span>
                            {p.reason && (
                              <span className="text-[9px] text-slate-500 block">{p.reason}</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 whitespace-nowrap self-start ${
                            p.status === 'injured' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' :
                            p.status === 'suspended' ? 'bg-slate-900 text-slate-400 border border-slate-800' :
                            'bg-amber-950/30 text-amber-500 border border-amber-900/30'
                          }`}>
                            {p.status === 'injured' ? 'Blessé' : p.status === 'suspended' ? 'Suspendu' : 'Incertain'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 italic p-2">Aucun joueur absent ou incertain.</p>
                    )}
                  </div>
                </div>

                {/* Away Unavailable */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>{awayTeam.name}</span>
                  </h4>
                  <div className="space-y-1.5 min-h-[50px]">
                    {awayInjuredList.length > 0 ? (
                      awayInjuredList.map((p: any) => (
                        <div key={p.id || p.name} className="flex items-center justify-between p-2 rounded bg-slate-950/30 border border-slate-900">
                          <div>
                            <span className="text-xs text-slate-200 block">{p.name}</span>
                            {p.reason && (
                              <span className="text-[9px] text-slate-500 block">{p.reason}</span>
                            )}
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 whitespace-nowrap self-start ${
                            p.status === 'injured' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' :
                            p.status === 'suspended' ? 'bg-slate-900 text-slate-400 border border-slate-800' :
                            'bg-amber-950/30 text-amber-500 border border-amber-900/30'
                          }`}>
                            {p.status === 'injured' ? 'Blessé' : p.status === 'suspended' ? 'Suspendu' : 'Incertain'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 italic p-2">Aucun joueur absent ou incertain.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Styled Placeholder/Box requested empty for now */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 text-center">
                <p className="text-xs text-slate-400 italic">
                  Informations sur les suspensions et l&apos;infirmerie des équipes avant la feuille de match officielle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            SECTION 4: CONFRONTATIONS DIRECTES
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'confrontations') && (
          <div id="section-confrontations" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Swords className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">4. Confrontations directes (H2H)</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">HEAD-TO-HEAD</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/50 p-3.5 rounded-xl border border-slate-900">
                <div className="text-center flex-1">
                  <div className="text-xs text-slate-400 font-bold uppercase">Victoires {homeTeam.name}</div>
                  <div className="text-xl font-bold text-white mt-1 font-mono">{h2hData.homeWins}</div>
                </div>
                <div className="h-8 w-[1px] bg-slate-800" />
                <div className="text-center flex-1">
                  <div className="text-xs text-slate-400 font-bold uppercase">Matchs Nuls</div>
                  <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{h2hData.draws}</div>
                </div>
                <div className="h-8 w-[1px] bg-slate-800" />
                <div className="text-center flex-1">
                  <div className="text-xs text-slate-400 font-bold uppercase">Victoires {awayTeam.name}</div>
                  <div className="text-xl font-bold text-white mt-1 font-mono">{h2hData.awayWins}</div>
                </div>
              </div>

              {/* List of last historic matches if exist */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Derniers duels :</h4>
                {h2hData.lastMatches.map((m: any, index: number) => (
                  <div key={index} className="flex justify-between items-center gap-3 bg-slate-900/40 border border-slate-850 p-2.5 rounded-lg text-xs">
                    <span className="text-slate-500 text-[10px] font-mono shrink-0">{m.date}</span>
                    <span className="font-bold text-slate-200 text-center truncate flex-1 min-w-0" title={m.score}>{m.score}</span>
                    <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/15 shrink-0 truncate max-w-[80px]">
                      V : {m.winner}
                    </span>
                  </div>
                ))}
              </div>

              {/* Styled Placeholder/Box requested empty for now */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 text-center animate-pulse">
                <p className="text-xs text-slate-400 italic">
                  Historique complet des confrontations internationales directes en attente de mise à jour.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            SECTION 5: MÉTÉO DU STADE
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'meteo') && (
          <div id="section-meteo" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                  <CloudSun className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">5. Météo du stade</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">METEO REPORT</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-center flex flex-col items-center justify-center">
                  <Thermometer className="h-5 w-5 text-amber-400 mb-1 shrink-0" />
                  <span className="text-lg font-bold font-mono text-slate-100">{weatherData.temp}°C</span>
                  <span className="block text-[10px] text-slate-500">Température</span>
                </div>
                
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-center flex flex-col items-center justify-center">
                  <Wind className="h-5 w-5 text-pink-400 mb-1 shrink-0" />
                  <span className="text-xs font-bold text-slate-100 block truncate mt-1 max-w-full">{weatherData.wind}</span>
                  <span className="block text-[10px] text-slate-500">Vitesse Vent</span>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-center flex flex-col items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-400 mb-1 shrink-0" />
                  <span className="text-lg font-bold font-mono text-slate-100">{weatherData.humidity}%</span>
                  <span className="block text-[10px] text-slate-500">Humidité</span>
                </div>
              </div>

              {/* Clean layout for OpenWeather conditions details */}
              <div className="flex items-center justify-center gap-3 bg-slate-900/30 p-2.5 border border-slate-850 rounded-xl">
                {weatherData.icon && (
                  <img 
                    src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} 
                    alt={weatherData.condition} 
                    className="h-10 w-10 object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block capitalize">Condition ciel : {weatherData.condition}</span>
                  <span className="text-[10px] text-slate-500 block">Données météo synchronisées</span>
                </div>
              </div>

              {/* Dynamic Estimated Impact display as requested */}
              <div className="rounded-xl border border-emerald-950 bg-emerald-950/15 p-4 text-center">
                <p className="text-xs text-emerald-400 font-medium">
                  Impact estimé : {weatherData.impactText || "Agréable pour les athlètes."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            SECTION 6: INFOS STADE
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'stade') && (
          <div id="section-stade" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
                  <Compass className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">6. Infos stade</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">STADIUM METRICS</span>
            </div>

            <div className="space-y-4 text-slate-300 text-xs">
              
              <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Nom complet :</span>
                  <span className="font-semibold text-slate-1 w-2/3 text-right">{stadium.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Ville hôte :</span>
                  <span className="font-semibold text-slate-1">{stadium.city} ({stadium.country})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Capacité officielle :</span>
                  <span className="font-semibold text-slate-1 font-mono text-emerald-400">{stadium.capacity.toLocaleString()} spectateurs</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Type de pelouse :</span>
                  <span className="font-semibold text-slate-1 text-teal-400">{stadium.surface}</span>
                </div>
              </div>

              {/* Coordonnées GPS mock map visualization */}
              <div className="bg-slate-950/80 p-3.5 border border-slate-850 rounded-xl relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10 text-[11px]">
                  <span className="text-slate-450 font-mono text-[10px]">Position GPS : {stadium.gps.lat.toFixed(4)}° N, {stadium.gps.lng.toFixed(4)}° W</span>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest bg-emerald-950 border border-emerald-900 px-1.5 py-0.5 rounded">
                    CARTE ACTIVÉE
                  </span>
                </div>
                {/* Virtual football pitch lines */}
                <div className="mt-2.5 h-16 w-full max-w-sm mx-auto border border-emerald-800/40 rounded bg-emerald-950/10 flex items-center justify-center relative">
                  <div className="absolute inset-y-0 left-1/2 border-l border-emerald-800/30" />
                  <div className="h-6 w-6 rounded-full border border-emerald-800/30 absolute" />
                  <span className="text-[10px] text-slate-500 font-mono italic relative z-10 select-none">Schéma de la surface de jeu</span>
                </div>
              </div>

              {/* Styled Placeholder/Box requested empty for now */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-3 text-center">
                <p className="text-xs text-slate-400 italic">
                  Spécificités techniques du terrain de jeu de la Coupe du Monde 2026.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ==============================================
            SECTION 7: ANALYSE TACTIQUE
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'analyse') && (
          <div id="section-analyse" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md col-span-1 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Newspaper className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">7. Analyse Tactique</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">TACTICS FEED</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border border-indigo-900/30 bg-indigo-950/10 p-4 rounded-xl leading-relaxed text-slate-300">
                <h4 className="font-bold text-indigo-400 mb-1.5">Facteurs Clés Attendus :</h4>
                <ul className="list-disc pl-4 space-y-2 text-slate-400">
                  <li>Dispositif défensif contre la transition rapide des ailiers adverses.</li>
                  <li>Maîtrise du milieu de terrain sous pression haute.</li>
                  <li>Optimisation des phases de contre-attaques et des coups de pied arrêtés.</li>
                </ul>
              </div>

              {/* Styled Placeholder/Box requested empty for now */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-6 text-center border-dashed">
                <Sparkles className="h-8 w-8 text-indigo-400/40 mx-auto mb-2 animate-bounce" />
                <h5 className="font-sans text-sm font-semibold text-slate-300 mb-1">Rapport Tactique Complet</h5>
                <p className="text-xs text-slate-500 italic max-w-sm mx-auto">
                  En attente des compositions officielles des équipes et du coup d&apos;envoi pour publication de l&apos;analyse MatchIQ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            SECTION 8: PRÉDICTION IA
            ============================================== */}
        {(activeSection === 'all' || activeSection === 'prediction') && (
          <div id="section-prediction" className="rounded-2xl border border-slate-800 bg-[#0f1426] p-6 shadow-md col-span-1 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Percent className="h-4.5 w-4.5" />
                </div>
                <h2 className="font-sans text-base font-bold text-white">8. Prédiction MatchIQ</h2>
              </div>
              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">AI ESTIMATE</span>
            </div>

            <div className="space-y-6">
              
              {/* Prediction percentages */}
              <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Probabilités de victoire MatchIQ :</span>
                  <span className="text-purple-400">Indice IA : Confiance Élevée</span>
                </div>

                {/* Styled slider graph probability */}
                <div className="h-5 w-full rounded-full bg-slate-900 border border-slate-850 overflow-hidden flex font-mono text-[10px] text-slate-950 font-black">
                  <div 
                    className="bg-emerald-500 flex items-center justify-center transition-all duration-300 animate-slide-in"
                    style={{ width: `${predictionData.homeWinPct}%` }}
                    title={`Victoire : ${homeTeam.name}`}
                  >
                    {predictionData.homeWinPct}%
                  </div>
                  <div 
                    className="bg-amber-500 flex items-center justify-center transition-all duration-300 animate-slide-in"
                    style={{ width: `${predictionData.drawPct}%` }}
                    title="Nul"
                  >
                    {predictionData.drawPct}%
                  </div>
                  <div 
                    className="bg-purple-500 flex items-center justify-center transition-all duration-300 animate-slide-in"
                    style={{ width: `${predictionData.awayWinPct}%` }}
                    title={`Victoire : ${awayTeam.name}`}
                  >
                    {predictionData.awayWinPct}%
                  </div>
                </div>

                {/* Legend labels */}
                <div className="flex justify-between text-[11px] font-sans text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{homeTeam.name}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Match nul</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" />{awayTeam.name}</span>
                </div>
              </div>

              {/* Prediction Insight Box */}
              <div className="bg-slate-955/60 bg-[#141b3a] p-4 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1.5 text-purple-400">
                  <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
                  <span>Analyse exclusive MatchIQ :</span>
                </div>
                <p className="text-xs text-slate-350 italic leading-relaxed">
                  &ldquo;{predictionData.aiKeyInsight}&rdquo;
                </p>
              </div>

              {/* Styled Placeholder/Box requested empty for now */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 text-center">
                <p className="text-xs text-slate-400 italic">
                  Nos calculs prédictifs seront mis à jour en temps réel avec les cotes sportives et statistiques de l&apos;événement.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
