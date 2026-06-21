/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Search, Calendar, Landmark, MapPin, Sparkles, 
  Tv2, SlidersHorizontal, ArrowRight, Star, HeartPulse, Heart,
  ChevronDown, ChevronUp, Clock, History
} from 'lucide-react';
import Navigation from './components/Navigation';
import AdminDashboard from './components/AdminDashboard';
import BottomNav from './components/BottomNav';
import MatchCard from './components/MatchCard';
import MatchDetail from './components/MatchDetail';
import MatchAnalysisModal from './components/MatchAnalysisModal';
import Pricing from './components/Pricing';
import PredictionHistory from './components/PredictionHistory';
import { Match } from './types';
import { getOrCreateUserId } from './utils/freemiumTracker';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Real-time clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync with backend on login
        await fetch('/api/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, userId: currentUser.uid })
        });
        setUserEmail(currentUser.email || '');
      } else {
        setUserEmail('');
        setUserRole('user');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch('/api/matches');
        if (res.ok) {
          const data = await res.json();
          const adjustedData = data.map((match: Match) => {
            if (match.time) {
              const [hours, minutes] = match.time.split(':').map(Number);
              const newHours = (hours + 1) % 24;
              let adjustedDate = match.date;
              if (hours + 1 >= 24) {
                 const d = new Date(match.date);
                 d.setDate(d.getDate() + 1);
                 const y = d.getFullYear();
                 const m = String(d.getMonth() + 1).padStart(2, '0');
                 const day = String(d.getDate()).padStart(2, '0');
                 adjustedDate = `${y}-${m}-${day}`;
              }
              const newTimeStr = `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              return { ...match, time: newTimeStr, date: adjustedDate };
            }
            return match;
          });
          setAllMatches(adjustedData);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
    
    // Polling every 5 seconds for real-time match status updates
    const interval = setInterval(loadMatches, 5000);
    return () => clearInterval(interval);
  }, []);

  // User Profile, Account management & Admin role states
  const [userEmail, setUserEmail] = useState<string>(() => {
    const saved = localStorage.getItem('matchiq_user_email');
    if (saved) return saved;
    // Default to our user's email so they don't have to struggle logging in during the preview!
    return 't3ch.frpbypass33@gmail.com'; 
  });
  const [userRole, setUserRole] = useState<string>('user');
  const [userId, setUserId] = useState<string>(() => getOrCreateUserId());

  // Load and synchronize user role from backend mirroring Supabase
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const uId = getOrCreateUserId();
        const res = await fetch(`/api/user/profile?userId=${uId}&email=${userEmail}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserRole(data.user.role);
            localStorage.setItem('matchiq_user_email', data.user.email);
            if (data.user.id) {
              localStorage.setItem('matchiq_user_id', data.user.id);
              setUserId(data.user.id);
            }
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    }
    fetchUserProfile();
  }, [userEmail]);

  // Navigation / Routing state
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'pricing' | 'history' | 'live'>('all');
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [analysisMatchId, setAnalysisMatchId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Dashboard collapsible section states - true means collapsed (repliée)
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    hier: true,
    past: true,
  });

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  
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
      } else if (hash === '#historique' || hash === '#history') {
        setActiveTab('history');
        setSelectedMatchId(null);
      } else if (hash.startsWith('#match-')) {
        const id = hash.replace('#match-', '');
        setSelectedMatchId(id);
      } else {
        setSelectedMatchId(null);
        // Clear activeTab pricing or history when we are on home route without hash
        setActiveTab(prev => (prev === 'pricing' || prev === 'history') ? 'all' : prev);
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
    setActiveTab(prev => (prev === 'pricing' || prev === 'history') ? 'all' : prev);
  };

  // Get active selected match
  const selectedMatch = allMatches.find(m => m.id === selectedMatchId);

  // Helper to get local date strings based on current date
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) {
      d.setDate(d.getDate() + offsetDays);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to calculate difference in days between two dates cleanly (independent of timezone hour shifts)
  const getDaysDifference = (matchDateStr: string) => {
    if (!matchDateStr) return 0;
    const [mYear, mMonth, mDay] = matchDateStr.split('-').map(Number);
    const today = new Date();
    
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(mYear, mMonth - 1, mDay);
    
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filter logic
  const filteredMatches = allMatches.filter(match => {
    // 1. Tab filter (Today's matches vs All matches vs Live matches) synchronized with the current system date
    if (activeTab === 'today') {
      const todayStr = getLocalDateString(0);
      const isTodayMatch = match.date === todayStr || match.status === 'live';
      if (!isTodayMatch) return false;
    } else if (activeTab === 'live') {
      if (match.status !== 'live') return false;
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

  // Categorize filtered matches into 7 precise temporal sections for the new sorted dashboard list
  const liveMatchesSec = filteredMatches.filter(m => m.status === 'live');
  const nonLiveMatches = filteredMatches.filter(m => m.status !== 'live');

  const todayMatchesSec: Match[] = [];
  const tomorrowMatchesSec: Match[] = [];
  const afterTomorrowMatchesSec: Match[] = [];
  const thisWeekMatchesSec: Match[] = [];
  const yesterdayMatchesSec: Match[] = [];
  const pastMatchesSec: Match[] = [];

  nonLiveMatches.forEach(match => {
    const diff = getDaysDifference(match.date);
    if (diff === 0) {
      todayMatchesSec.push(match);
    } else if (diff === 1) {
      tomorrowMatchesSec.push(match);
    } else if (diff === 2) {
      afterTomorrowMatchesSec.push(match);
    } else if (diff >= 3) {
      thisWeekMatchesSec.push(match);
    } else if (diff === -1) {
      yesterdayMatchesSec.push(match);
    } else if (diff <= -2) {
      pastMatchesSec.push(match);
    }
  });

  const hasAnyMatches = filteredMatches.length > 0;

  // Separate live matches for a high-priority live dashboard widget at the very top of the home page
  const liveMatches = allMatches.filter(m => m.status === 'live');
  const favoriteMatches = allMatches.filter(m => favorites.includes(m.id));

  // High-performance reusable UI renderer for each dashboard temporal section
  const renderSection = (
    title: string, 
    matchesList: Match[], 
    icon: React.ReactNode, 
    badge?: React.ReactNode,
    collapsibleKey?: 'hier' | 'past'
  ) => {
    if (matchesList.length === 0) return null;

    const isCollapsible = !!collapsibleKey;
    const isCollapsed = isCollapsible ? collapsedSections[collapsibleKey] : false;

    return (
      <div className="space-y-4" id={`section-${collapsibleKey || title.toLowerCase().replace(/\s+/g, '-')}`}>
        {/* Section Header */}
        <div 
          onClick={() => isCollapsible && toggleSection(collapsibleKey)}
          className={`flex items-center justify-between border-b border-slate-800/60 pb-2.5 ${isCollapsible ? 'cursor-pointer group select-none hover:border-slate-700/80 transition-colors' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 shadow-sm shadow-emerald-500/5">
              {icon}
            </div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-sans text-sm sm:text-base font-extrabold tracking-tight text-white capitalize group-hover:text-emerald-400 transition-colors">
                {title} <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded ml-1.5">{matchesList.length} match{matchesList.length > 1 ? 's' : ''}</span>
              </h3>
              {badge && badge}
            </div>
          </div>

          {isCollapsible && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold tracking-wider font-mono bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-lg group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all duration-300">
              <span>{isCollapsed ? 'DÉPLIER' : 'REPLIER'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${!isCollapsed ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} />
            </div>
          )}
        </div>

        {/* Section Grid Content */}
        {!isCollapsed && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300">
            {matchesList.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onSelect={handleSelectMatch}
                isFavorite={favorites.includes(match.id)}
                onToggleFavorite={handleToggleFavorite}
                onShowAnalysis={(id) => setAnalysisMatchId(id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#060913] font-sans antialiased text-slate-205 pb-16">
      
      {/* Top Main Navigation Header */}
      <Navigation 
        activeTab={activeTab} 
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setShowAdmin(false);
          if (tab === 'pricing') {
            window.location.hash = '#pricing';
          } else if (tab === 'history') {
            window.location.hash = '#historique';
          } else {
            window.location.hash = '';
            setSelectedMatchId(null);
          }
        }}
        onGoHome={handleBackToHome}
        userEmail={userEmail}
        userRole={userRole}
        onShowAdmin={() => {
          setShowAdmin(true);
          setActiveTab('all');
        }}
      />

      <BottomNav 
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'pricing') {
            window.location.hash = '#pricing';
          } else if (tab === 'history') {
            window.location.hash = '#historique';
          } else {
            window.location.hash = '';
            setSelectedMatchId(null);
          }
        }}
      />

      {/* Dynamic Main Body */}
      {showAdmin ? (
        <AdminDashboard onBack={() => setShowAdmin(false)} />
      ) : activeTab === 'pricing' ? (
        <Pricing onBack={handleBackToHome} />
      ) : activeTab === 'history' ? (
        <PredictionHistory 
          onSelectMatch={handleSelectMatch}
          onBrowseMatches={() => {
            setActiveTab('all');
            window.location.hash = '';
          }}
        />
      ) : selectedMatch ? (
        // Detal Match Page Route View
        <MatchDetail 
          match={selectedMatch} 
          onBack={handleBackToHome} 
          isFavorite={favorites.includes(selectedMatch.id)}
          onToggleFavorite={handleToggleFavorite}
          userRole={userRole}
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
                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl min-w-[110px] text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] flex items-center gap-1 font-mono tracking-wider text-slate-400 block mb-1"><Clock className="w-3 h-3 text-indigo-400" /> HEURE LOCALE</span>
                  <span className="text-xl font-bold tracking-tight text-white font-mono block leading-none">
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
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
                {['all', 'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F'].map((g) => (
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
          ) : hasAnyMatches ? (
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

              {/* 1. En direct */}
              {renderSection(
                "En direct",
                liveMatchesSec,
                <Tv2 className="h-4.5 w-4.5 text-rose-500" />,
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5 select-none animate-pulse">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                  </span>
                  LIVE
                </span>
              )}

              {/* 2. Aujourd'hui */}
              {renderSection(
                "Aujourd'hui",
                todayMatchesSec,
                <Calendar className="h-4.5 w-4.5 text-emerald-400" />
              )}

              {/* 3. Demain */}
              {renderSection(
                "Demain",
                tomorrowMatchesSec,
                <Clock className="h-4.5 w-4.5 text-emerald-400" />
              )}

              {/* 4. Après-demain */}
              {renderSection(
                "Après-demain",
                afterTomorrowMatchesSec,
                <Clock className="h-4.5 w-4.5 text-blue-400" />
              )}

              {/* 5. Cette semaine */}
              {renderSection(
                "Cette semaine",
                thisWeekMatchesSec,
                <Sparkles className="h-4.5 w-4.5 text-purple-400" />
              )}

              {/* 6. Hier */}
              {renderSection(
                "Hier",
                yesterdayMatchesSec,
                <History className="h-4.5 w-4.5 text-slate-400" />,
                undefined,
                'hier'
              )}

              {/* 7. Résultats passés */}
              {renderSection(
                "Résultats passés",
                pastMatchesSec,
                <Trophy className="h-4.5 w-4.5 text-slate-400" />,
                undefined,
                'past'
              )}
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

      {analysisMatchId && (
        <MatchAnalysisModal
          matchId={analysisMatchId}
          onClose={() => setAnalysisMatchId(null)}
        />
      )}

    </div>
  );
}
