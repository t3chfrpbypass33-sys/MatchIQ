/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Trophy, ChevronRight, Play, Heart } from 'lucide-react';
import { Match } from '../types';

interface MatchCardProps {
  match: Match;
  onSelect: (matchId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string, event: React.MouseEvent) => void;
}

export default function MatchCard({ match, onSelect, isFavorite, onToggleFavorite }: MatchCardProps) {
  const { id, homeTeam, awayTeam, date, time, stadium, status, score, minute, group } = match;

  // Formatting date for reader (e.g. Saturday, June 20)
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div
      onClick={() => onSelect(id)}
      id={`match-card-${id}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0f1426] p-4.5 transition-all duration-350 hover:-translate-y-1 hover:border-emerald-500/45 hover:bg-[#131b33] hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer active:scale-[0.99] select-none"
    >
      {/* Background Gradient Accent on Hover */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-emerald-500 group-hover:via-teal-400 group-hover:to-blue-500 transition-all duration-500" />

      {/* Flag Gradient Background Highlights */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-emerald-500/5 filter blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500" />

      {/* Card Header Info */}
      <div className="mb-3.5 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-800">
            {group}
          </span>
          {status === 'live' && (
            <span className="flex items-center gap-1.5 rounded-md bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
              </span>
              <span>LIVE • {minute}&apos;</span>
            </span>
          )}
          {status === 'completed' && (
            <span className="rounded-md bg-slate-850 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700/50">
              Terminé
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 capitalize">
            {formattedDate}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(id, e);
            }}
            className="p-1 rounded-full hover:bg-slate-800/80 transition-all cursor-pointer text-slate-400 hover:text-rose-500 scale-100 hover:scale-110 active:scale-90"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart 
              className={`h-4.5 w-4.5 transition-all duration-200 ${
                isFavorite 
                  ? 'text-rose-500 fill-rose-500 scale-105' 
                  : 'text-slate-400 hover:text-rose-450'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Core Score & Teams Grid */}
      <div className="grid grid-cols-12 items-center gap-1.5 py-3">
        
        {/* Home Team */}
        <div className="col-span-4 flex flex-col items-center text-center">
          <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors p-2">
            {homeTeam.crest ? (
              <img
                src={homeTeam.crest}
                alt={homeTeam.name}
                referrerPolicy="no-referrer"
                className="h-[80%] w-[80%] object-contain filter drop-shadow select-none animate-fade-in"
              />
            ) : (
              <span className="text-3xl filter drop-shadow select-none animate-fade-in" role="img" aria-label={homeTeam.name}>
                {homeTeam.flag}
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center">
              #{homeTeam.fifaRank}
            </span>
          </div>
          <span className="font-sans text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors line-clamp-1 px-1">
            {homeTeam.name}
          </span>
          <div className="mt-1 flex gap-0.5">
            {homeTeam.recentForm.map((result, index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-full text-[7px] font-bold flex items-center justify-center font-mono leading-none ${
                  result === 'W' ? 'bg-emerald-500 text-slate-950' :
                  result === 'D' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-slate-950'
                }`}
                title={`Forme: ${result}`}
              />
            ))}
          </div>
        </div>

        {/* Score or Kickoff Spacer */}
        <div className="col-span-4 flex flex-col items-center justify-center text-center px-1">
          {score ? (
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-[#f8fafc] group-hover:scale-105 transition-transform whitespace-nowrap inline-block bg-slate-950/60 border border-slate-800/80 px-2.5 py-0.5 rounded-lg">
                {score.home} - {score.away}
              </span>
              {status === 'live' && (
                <span className="mt-1.5 text-[8px] sm:text-[9px] font-extrabold tracking-widest text-rose-400 uppercase animate-pulse bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-900/30 whitespace-nowrap">
                  En cours
                </span>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-900/95 border border-slate-800 px-2.5 py-1.5 text-center min-w-[70px]">
              <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 block tracking-tight">
                {time}
              </span>
              <span className="text-[8px] tracking-wider text-slate-400 uppercase block font-semibold">
                KICKOFF
              </span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-4 flex flex-col items-center text-center">
          <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors p-2">
            {awayTeam.crest ? (
              <img
                src={awayTeam.crest}
                alt={awayTeam.name}
                referrerPolicy="no-referrer"
                className="h-[80%] w-[80%] object-contain filter drop-shadow select-none animate-fade-in"
              />
            ) : (
              <span className="text-3xl filter drop-shadow select-none animate-fade-in" role="img" aria-label={awayTeam.name}>
                {awayTeam.flag}
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center">
              #{awayTeam.fifaRank}
            </span>
          </div>
          <span className="font-sans text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors line-clamp-1 px-1">
            {awayTeam.name}
          </span>
          <div className="mt-1 flex gap-0.5">
            {awayTeam.recentForm.map((result, index) => (
              <span
                key={index}
                className={`h-3 w-3 rounded-full text-[7px] font-bold flex items-center justify-center font-mono leading-none ${
                  result === 'W' ? 'bg-emerald-500 text-slate-950' :
                  result === 'D' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-slate-950'
                }`}
                title={`Forme: ${result}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Stadium Location Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400 group-hover:text-slate-300">
        <div className="flex items-center gap-1.5 truncate max-w-[85%]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          <span className="font-sans truncate text-[11px] tracking-wide font-medium">
            {stadium.name}, {stadium.city} ({stadium.country})
          </span>
        </div>
        
        <div className="flex items-center gap-0.5 font-semibold text-[10px] text-emerald-400 font-mono tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <span>ANALYSER</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>
      
    </div>
  );
}
