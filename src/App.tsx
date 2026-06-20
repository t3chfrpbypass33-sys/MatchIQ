/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Search, Calendar, Landmark, MapPin, Sparkles, 
  Tv2, SlidersHorizontal, ArrowRight, Star, HeartPulse, Heart 
} from 'lucide-react';
import Navigation from './components/Navigation';
import MatchCard from './components/MatchCard';
import MatchDetail from './components/MatchDetail';
import Pricing from './components/Pricing';
import PredictionHistory from './components/PredictionHistory';
import Standings from './components/Standings';
import { Match } from './types';
import { getOrCreateUserId } from './utils/freemiumTracker';

export default function App() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch('/api/matches');
        if (res.ok) {
          const data = await res.json();
          setAllMatches(data);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  // Navigation / Routing state
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'standings' | 'pricing' | 'history'>('all');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // Load favorites on mount
  useEffect(() => {
    async function loadFavorites() {
      try {
        const uId = getOrCreateUserId();
        const res = await fetch(`/api/favorites?userId=${uId}`);
        if (res.ok) {
          const data = await res.json();
          setFavorites(data.favorites || []);
        }
      } catch (err) {
        console.error("Failed to load favorites on mount:", err);
      }
    }
    loadFavorites();
  }, []);

  const handleToggleFavorite = async (matchId: string) => {
    try {
      const uId = getOrCreateUserId();
      const isFav = favorites.includes(matchId);
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: uId,
          matchId,
          isFavorite: !isFav
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // Handle browser back button simulation or simple URL hashes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#pricing') {
        setActiveTab('pricing');
        setSelectedMatchId(null);
      } else if (hash === '#standings' || hash === '#classement' || hash === '#classements') {
        setActiveTab('standings');
        setSelectedMatchId(null);
      } else if (hash === '#historique' || hash === '#history') {
        setActiveTab('history');
        setSelectedMatchId(null);
      } else if (hash.startsWith('#match-')) {
        const id = hash.replace('#match-', '');
        setSelectedMatchId(id);
      } else {
        setSelectedMatchId(null);
        // Clear activeTab pricing, history or standings when we are on home route without hash
        setActiveTab(prev => (prev === 'pricing' || prev === 'history' || prev === 'standings') ? 'all' : prev);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update hash when match is selected
  const handleSelectMatch = (matchId: string) => {
    window.location.hash = `#match-${matchId}`;
    setSelectedMatchId(matchId);
  };

  const handleBackToHome = () => {
    window.location.hash = '';
    setSelectedMatchId(null);
    setActiveTab(prev => (prev === 'pricing' || prev === 'history' || prev === 'standings') ? 'all' : prev);
  };

  // Get active selected match
  const selectedMatch = allMatches.find(m => m.id === selectedMatchId);

  // Filter logic
  const filteredMatches = allMatches.filter(match => {
    // 1. Tab filter (Today's matches vs All matches)
    // For test visualization, "today" covers matches occurring on 2026-06-20 (our default testing date) or are live
    if (activeTab === 'today') {
      const isTodayMatch = match.date === '2026-06-20' || match.status === 'live';
      if (!isTodayMatch) return false;
    }

    // 2. Group Filter
    if (groupFilter !== 'all' && match.group !== groupFilter) {
      return false;
    }

    // 3. Search query filter (matches home/away country name or stadium name or city name)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchHome = match.homeTeam.name.toLowerCase().includes(query);
      const matchAway = match.awayTeam.name.toLowerCase().includes(query);
      const matchStadium = match.stadium.name.toLowerCase().includes(query);
      const matchCity = match.stadium.city.toLowerCase().includes(query);
      return matchHome || matchAway || matchStadium || matchCity;
    }

    return true;
  });

  // Group filtered matches by unique date strings
  const groupedMatches: { [date: string]: Match[] } = {};
  filteredMatches.forEach(match => {
    if (!groupedMatches[match.date]) {
      groupedMatches[match.date] = [];
    }
    groupedMatches[match.date].push(match);
  });

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedMatches).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // Helper translations for day headings
  const formatGroupHeaderDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'long' });
    return `${dayName} ${dayNum} ${monthName}`;
  };

  // Separate live matches for a high-priority live dashboard widget at the very top of the home page
  const liveMatches = allMatches.filter(m => m.status === 'live');
  const favoriteMatches = allMatches.filter(m => favorites.includes(m.id));

  return (
    <div className="min-h-screen bg-[#060913] font-sans antialiased text-slate-205 pb-16">
      
      {/* Top Main Navigation Header */}
      <Navigation 
        activeTab={activeTab} 
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'pricing') {
            window.location.hash = '#pricing';
          } else if (tab === 'history') {
            window.location.hash = '#historique';
          } else if (tab === 'standings') {
            window.location.hash = '#classement';
          } else {
            window.location.hash = '';
            setSelectedMatchId(null);
          }
        }}
        onGoHome={handleBackToHome}
      />

      {/* Dynamic Main Body */}
      {activeTab === 'pricing' ? (
        <Pricing onBack={handleBackToHome} />
      ) : activeTab === 'history' ? (
        <PredictionHistory 
          onSelectMatch={handleSelectMatch}
          onBrowseMatches={() => {
            setActiveTab('all');
            window.location.hash = '';
          }}
        />
      ) : activeTab === 'standings' ? (
        <Standings onBack={handleBackToHome} />
      ) : selectedMatch ? (
        // Detal Match Page Route View
        <MatchDetail 
          match={selectedMatch} 
          onBack={handleBackToHome} 
          isFavorite={favorites.includes(selectedMatch.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : (
        // Home List Page Route View
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          
          {/* Brand Intro & Quick Stats Counter Header panel */}
          <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-[#0c1122]/75 px-5 py-6 sm:px-8 sm:py-8 shadow-md">
            
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/5 filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-indigo-500/5 filter blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-widest text-[#a3b3cc] uppercase">
                    FIFA WORLD CUP 2026 ANALYTICS
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-white leading-tight">
                  Prenez une longueur d&apos;avance sur <span className="bg-gradient-to-r from-emerald-400 to-teal-350 bg-clip-text text-transparent">l&apos;analyse de jeu</span>
                </h2>
                <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
                  Accédez à des statistiques de pointe : performances historiques des équipes, fiches d&apos;infirmerie, météo locale des 16 stades hôtes (USA/Canada/Mexique) et probabilités d&apos;issue par IA.
                </p>
              </div>

              {/* Live Count Widget */}
              <div className="flex flex-wrap gap-3 shrink-0">
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl min-w-[110px] text-center">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 block">EN COURS</span>
                  <span className="text-2xl font-black text-rose-500 font-mono mt-0.5 block leading-none">
                    {liveMatches.length}
                  </span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl min-w-[110px] text-center">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 block">TOTAL FILTRÉS</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block leading-none">
                    {filteredMatches.length}
                  </span>
                </div>
                <div className="bg-[#0f1b21] border border-emerald-950 p-3.5 rounded-2xl min-w-[110px] text-center">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 block">STADES DE TEST</span>
                  <span className="text-2xl font-black text-teal-400 font-mono mt-0.5 block leading-none">
                    16
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Quick Realtime Active Highlight Badge Carousel */}
          {liveMatches.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3.5">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                  Matchs en Direct (Live Dashboard)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.map(lm => (
                  <div 
                    key={lm.id}
                    onClick={() => handleSelectMatch(lm.id)}
                    className="relative overflow-hidden rounded-2xl border border-rose-900/60 bg-gradient-to-r from-rose-950/25 to-[#16111f] p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-rose-500/80 transition-all shadow-md group select-none active:scale-[0.99]"
                    id={`live-widget-${lm.id}`}
                  >
                    <div className="absolute top-0 right-0 bg-rose-500 text-slate-950 text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-bl select-none">
                      LIVE NOW
                    </div>

                    <div className="flex-1 grid grid-cols-3 items-center gap-1.5 pt-2">
                      {/* Home Team */}
                      <div className="flex items-center justify-end gap-2 text-right">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-rose-400 truncate max-w-[70px] xs:max-w-[90px] sm:max-w-[120px]">
                          {lm.homeTeam.name}
                        </span>
                        <span className="text-xl sm:text-2xl shrink-0 filter drop-shadow select-none">{lm.homeTeam.flag}</span>
                      </div>
                      
                      {/* Score Segment */}
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="whitespace-nowrap inline-flex items-center justify-center font-mono text-base sm:text-lg font-black tracking-widest bg-slate-950/95 border border-slate-800 rounded px-2.5 py-1 text-rose-400 shadow-md">
                          {lm.score?.home} - {lm.score?.away}
                        </span>
                        <span className="whitespace-nowrap block text-[8px] font-bold text-rose-500 font-mono tracking-wider mt-1 select-none text-center">
                          MIN {lm.minute}&apos;
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-start gap-2 text-left">
                        <span className="text-xl sm:text-2xl shrink-0 filter drop-shadow select-none">{lm.awayTeam.flag}</span>
                        <span className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-rose-400 truncate max-w-[70px] xs:max-w-[90px] sm:max-w-[120px]">
                          {lm.awayTeam.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-8 w-8 rounded-full bg-rose-950/40 border border-rose-800/40 flex items-center justify-center text-rose-400 hover:bg-rose-900 transition-colors shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters & Search Toolbar Panel */}
          <div className="mb-6 bg-[#0e1324] border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="search-match-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une équipe, un stade, une ville..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-white"
                >
                  EFFACER
                </button>
              )}
            </div>

            {/* Right filter groups selection */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span>Groupe :</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {['all', 'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroupFilter(g)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      groupFilter === g
                        ? 'bg-emerald-500 text-slate-950 shadow-sm border border-emerald-500'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {g === 'all' ? 'Tous' : g.replace('Group ', 'Gr ')}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Grouped Match Lists Rendering */}
          {allMatches.length === 0 ? (
            <div className="mt-12 text-center bg-[#0c1122]/40 rounded-3xl border border-slate-800 border-dashed p-10 max-w-lg mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-500 mx-auto mb-4">
                <Trophy className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Aucun match à venir dans les prochains jours</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Les données de l&apos;API BSD ne rapportent aucun match programmé pour les jours à venir. Veuillez ré-essayer ultérieurement.
              </p>
            </div>
          ) : sortedDates.length > 0 ? (
            <div className="space-y-8">
              {/* Mes matchs favoris Section */}
              {favoriteMatches.length > 0 && (
                <div className="mb-10 bg-slate-950/30 border border-slate-900/80 rounded-3xl p-5.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4.5 pb-2 border-b border-rose-950/40">
                    <Heart className="h-4.5 w-4.5 text-rose-500 fill-rose-500 animate-pulse" />
                    <h3 className="font-sans text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                      Mes Matchs Favoris ({favoriteMatches.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {favoriteMatches.map((match) => (
                      <MatchCard
                        key={`fav-${match.id}`}
                        match={match}
                        onSelect={handleSelectMatch}
                        isFavorite={true}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}

              {sortedDates.map((dateStr) => {
                const dateMatches = groupedMatches[dateStr];
                return (
                  <div key={dateStr} className="space-y-4">
                    {/* Date grouping heading */}
                    <div className="flex items-center gap-3.5 border-b border-slate-800/60 pb-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 shadow-sm">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <h3 className="font-sans text-sm font-bold tracking-tight text-white capitalize">
                        {formatGroupHeaderDate(dateStr)}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-900 border border-slate-800 rounded px-2 py-0.5">
                        {dateMatches.length} MATCH{dateMatches.length > 1 ? 'S' : ''}
                      </span>
                    </div>

                    {/* Grid matches list */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {dateMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onSelect={handleSelectMatch}
                          isFavorite={favorites.includes(match.id)}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty filter state
            <div className="mt-12 text-center bg-[#0c1122]/40 rounded-3xl border border-slate-805 border-dashed p-10 max-w-lg mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-500 mx-auto mb-4">
                <Trophy className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Aucun match trouvé</h4>
              <p className="text-xs text-slate-450 leading-relaxed max-w-xs mx-auto">
                Aucun match ne correspond aux critères de recherche définis. Réinitialisez les filtres ou changez de recherche.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGroupFilter('all');
                  setActiveTab('all');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-bold leading-none hover:bg-emerald-400 transition-colors"
              >
                Tout réinitialiser
              </button>
            </div>
          )}

        </main>
      )}

      {/* Styled sports page footer */}
      <footer className="mt-16 border-t border-slate-900/80 bg-[#04060d] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4.5 w-4.5 text-emerald-400" />
            <span className="font-sans text-sm font-extrabold text-slate-300">
              Match<span className="text-emerald-400">IQ</span>
            </span>
            <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded leading-none">
              v1.0.0
            </span>
          </div>
          <p className="font-sans leading-relaxed text-[11px] max-w-md sm:text-right">
            MatchIQ est un outil d&apos;aide à la décision sportive fictif pour la Coupe du Monde FIFA 2026. Tout contenu, emblème national ou nom commercial s&apos;entend à fin d&apos;illustration.
          </p>
        </div>
      </footer>

    </div>
  );
}
