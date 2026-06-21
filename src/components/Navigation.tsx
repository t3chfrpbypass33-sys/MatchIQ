/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Trophy, CalendarDays, Zap, Sparkles, History, 
  User, LogIn, LogOut, Crown, AlertCircle, ShieldCheck
} from 'lucide-react';

interface NavigationProps {
  activeTab: 'all' | 'today' | 'pricing' | 'history';
  onChangeTab: (tab: 'all' | 'today' | 'pricing' | 'history') => void;
  onGoHome: () => void;
  userEmail: string;
  userRole: string;
  onLogin: (email: string) => Promise<boolean>;
  onLogout: () => void;
}

export default function Navigation({ 
  activeTab, 
  onChangeTab, 
  onGoHome,
  userEmail,
  userRole,
  onLogin,
  onLogout 
}: NavigationProps) {
  
  const [showLoginPop, setShowLoginPop] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!emailInput.trim()) {
      setLoginError("Veuillez entrer une adresse e-mail.");
      return;
    }
    const success = await onLogin(emailInput.trim());
    if (success) {
      setShowLoginPop(false);
      setEmailInput('');
    } else {
      setLoginError("Erreur d'authentification.");
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
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
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

        {/* User Role / Authentication Badge Panel */}
        <div className="relative flex items-center gap-2.5 shrink-0">
          {userEmail ? (
            <div className="flex items-center gap-2">
              {/* Profile display with gold/emerald accent */}
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

              {/* Sign out button */}
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-red-950/30 hover:border-red-900/40 hover:text-red-400 text-slate-400 transition-all cursor-pointer"
                title="Se déconnecter de la session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              {/* Anonymous / Join Session trigger */}
              <button
                onClick={() => setShowLoginPop(!showLoginPop)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <LogIn className="h-4 w-4" />
                <span>Se connecter</span>
              </button>
            </div>
          )}

          {/* Minimalist Login Popover Overlay */}
          {showLoginPop && (
            <div id="login-popover" className="absolute right-0 top-full mt-3 w-80 rounded-2xl border border-slate-800 bg-[#0b0f19] p-5 shadow-2xl shadow-black/90 z-55 animate-fade-in space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3 pb-3 border-b border-slate-850">
                <div className="flex items-center gap-1.5 font-sans font-bold text-xs text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span>Saisissez votre e-mail</span>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal">
                  Inscrivez-vous pour tester le rôle d&apos;admin. Entrez <b className="text-amber-400 font-mono">t3ch.frpbypass33@gmail.com</b> pour le statut Admin préconfiguré.
                </p>

                <div className="space-y-1">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="exemple@email.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-205 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {loginError && (
                    <div className="flex items-center gap-1 text-[9px] text-red-400 font-medium">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginPop(false);
                      setLoginError('');
                    }}
                    className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-1.8 text-[10px] font-bold text-slate-950 transition-colors cursor-pointer"
                  >
                    Valider
                  </button>
                </div>
              </form>

              {/* Developer Bypass & Account Role Promoter Utility */}
              <div className="pt-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-amber-500/80 uppercase">
                    🛠️ Passerelle de Rôle (Dev)
                  </span>
                  <span className="text-[9px] font-mono text-emerald-500 bg-emerald-950/45 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                    db-users.json
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Modifiez le rôle de n&apos;importe quel compte utilisateur instantanément. Un excellent substitute au Table Editor de Supabase !
                </p>

                <div className="bg-slate-950/60 rounded-xl border border-slate-850 p-2.5 space-y-2">
                  <div className="grid grid-cols-5 gap-2 items-center">
                    <span className="col-span-2 text-[10px] font-bold text-slate-400">E-mail cible :</span>
                    <input
                      type="email"
                      id="target-promo-email"
                      placeholder="dev@matchiq.app"
                      defaultValue={userEmail || emailInput || ""}
                      className="col-span-3 bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-[10px] font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 items-center">
                    <span className="col-span-2 text-[10px] font-bold text-slate-400">Rôle :</span>
                    <select
                      id="target-promo-role"
                      className="col-span-3 bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-[10px] font-mono text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="admin">ADMIN (Accès Pro)</option>
                      <option value="user">USER (Gratuit - Limité)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const emailVal = (document.getElementById('target-promo-email') as HTMLInputElement)?.value;
                      const roleVal = (document.getElementById('target-promo-role') as HTMLSelectElement)?.value;
                      
                      if (!emailVal || !emailVal.trim()) {
                        alert("Veuillez saisir un e-mail cible.");
                        return;
                      }

                      try {
                        const response = await fetch('/api/user/promote', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: emailVal.trim(), role: roleVal })
                        });

                        if (response.ok) {
                          const result = await response.json();
                          alert(`Succès ! Rôle de ${emailVal} mis à jour en : "${roleVal}" dans db-users.json.`);
                          
                          // Sync active state if setting role on current active user
                          if (emailVal.trim().toLowerCase() === userEmail.trim().toLowerCase()) {
                            await onLogin(userEmail);
                          } else if (!userEmail) {
                            // If not logged in, log in as this newly promoted profile
                            await onLogin(emailVal.trim());
                          }
                          setShowLoginPop(false);
                        } else {
                          const errData = await response.json();
                          alert(`Erreur : ${errData.error || "Échec de l'opération"}`);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Erreur de connexion au serveur.");
                      }
                    }}
                    className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.8 text-[10px] font-black text-slate-950 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Mettre à Jour dans le Dashboard
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}
