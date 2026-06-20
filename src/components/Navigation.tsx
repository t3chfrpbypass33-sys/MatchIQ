/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, CalendarDays, Zap, Layers } from 'lucide-react';

interface NavigationProps {
  activeTab: 'all' | 'today';
  onChangeTab: (tab: 'all' | 'today') => void;
  onGoHome: () => void;
}

export default function Navigation({ activeTab, onChangeTab, onGoHome }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0e1324]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        
        {/* Brand Logo */}
        <button 
          onClick={onGoHome}
          className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-90 cursor-pointer"
          id="nav-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/10">
            <Trophy className="h-5.5 w-5.5" />
          </div>
          <div className="text-left">
            <span className="font-sans text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Match<span className="text-emerald-400">IQ</span>
            </span>
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase leading-none">
              FIFA World Cup 2026
            </div>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          <button
            id="nav-tab-today"
            onClick={() => onChangeTab('today')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'today'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Matchs du jour</span>
          </button>
          
          <button
            id="nav-tab-all"
            onClick={() => onChangeTab('all')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Tous les matchs</span>
          </button>
        </nav>

        {/* Info Right Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>LIVE CENTRAL ACTIVE</span>
        </div>

      </div>
    </header>
  );
}
