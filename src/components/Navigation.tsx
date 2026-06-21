/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Trophy, CalendarDays, Zap, Sparkles, History, 
  User, LogOut, Crown, Tv2, LogIn
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface NavigationProps {
  activeTab: 'all' | 'today' | 'pricing' | 'history' | 'live';
  onChangeTab: (tab: 'all' | 'today' | 'pricing' | 'history' | 'live') => void;
  onGoHome: () => void;
  userEmail: string;
  userRole: string;
  onShowAdmin: () => void;
}

export default function Navigation({ 
  activeTab, 
  onChangeTab, 
  onGoHome,
  userEmail,
  userRole,
  onShowAdmin
}: NavigationProps) {
  
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Firebase Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0e1324]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 gap-4">
        
        {/* Brand Logo */}
        <button 
          onClick={onGoHome}
          className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-90 cursor-pointer shrink-0"
          id="nav-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/10">
            <Trophy className="h-5.5 w-5.5" />
          </div>
          <div className="text-left hidden xs:block">
            <span className="font-sans text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Match<span className="text-emerald-400">IQ</span>
            </span>
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase leading-none">
              FIFA World Cup 2026
            </div>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            id="nav-tab-live"
            onClick={() => onChangeTab('live')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.8 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Tv2 className="h-4 w-4 shrink-0" />
            <span>En direct</span>
          </button>
          
          <button
            id="nav-tab-today"
            onClick={() => onChangeTab('today')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.8 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Zap className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Matchs du jour</span>
            <span className="sm:hidden">Du jour</span>
          </button>
          
          <button
            id="nav-tab-all"
            onClick={() => onChangeTab('all')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.8 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>Matchs</span>
          </button>

          <button
            id="nav-tab-pricing"
            onClick={() => onChangeTab('pricing')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.8 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-emerald-950/80 text-emerald-400 shadow-sm border border-emerald-800'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-405 shrink-0" />
            <span>Tarifs</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={onShowAdmin}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.8 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap bg-amber-950/80 text-amber-400 shadow-sm border border-amber-800"
            >
              <Crown className="h-4 w-4 shrink-0" />
              <span>Admin</span>
            </button>
          )}

          <button
            id="nav-tab-history"
            onClick={() => onChangeTab('history')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.8 text-xs font-semibold sm:text-sm tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <History className="h-4 w-4 shrink-0" />
            <span>Historique</span>
          </button>
        </nav>

          {/* Auth Section */}
          <div className="relative flex items-center gap-2.5 shrink-0">
            {userEmail ? (
              <div className="flex items-center gap-2">
                <div 
                  className={`flex items-center gap-2 text-[11px] sm:text-xs font-medium py-1.5 px-3 rounded-xl border ${
                    isAdmin 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                      : 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {isAdmin ? (
                    <Crown className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
                  ) : (
                    <User className="h-4 w-4 text-indigo-400 shrink-0" />
                  )}
                  
                  <div className="flex flex-col text-left">
                    <span className="font-bold leading-tight font-sans">
                      {isAdmin ? "Rôle : Administrateur" : "Rôle : Membre Gratuit"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono leading-none truncate max-w-[120px] sm:max-w-[160px]">
                      {userEmail}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-950/30 hover:border-red-900/40 hover:text-red-400 text-slate-400 transition-all cursor-pointer"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-[0.98] cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>Se connecter via Google</span>
              </button>
            )}
          </div>

      </div>
    </header>
  );
}
