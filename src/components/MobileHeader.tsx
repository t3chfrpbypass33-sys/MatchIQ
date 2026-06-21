import React from 'react';
import { Trophy, LogIn, LogOut, User, Crown } from 'lucide-react';

interface MobileHeaderProps {
  onGoHome: () => void;
  userEmail: string;
  userRole: string;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function MobileHeader({ 
  onGoHome, userEmail, userRole, onLogout, onLoginClick 
}: MobileHeaderProps) {
  const isAdmin = userRole === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0e1324]/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          onClick={onGoHome}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="font-sans text-lg font-bold text-white">MatchIQ</span>
        </button>

        <div className="flex items-center gap-2">
          {userEmail ? (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="p-2 rounded-lg bg-emerald-500 text-slate-950"
            >
              <LogIn className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
