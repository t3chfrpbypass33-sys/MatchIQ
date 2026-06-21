import React from 'react';
import { 
  Trophy, CalendarDays, Zap, Sparkles, History, Tv2 
} from 'lucide-react';

interface BottomNavProps {
  activeTab: 'all' | 'today' | 'pricing' | 'history' | 'live';
  onChangeTab: (tab: 'all' | 'today' | 'pricing' | 'history' | 'live') => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'live', label: 'En direct', icon: Tv2 },
    { id: 'today', label: 'Du jour', icon: Zap },
    { id: 'all', label: 'Matchs', icon: CalendarDays },
    { id: 'pricing', label: 'Tarifs', icon: Sparkles },
    { id: 'history', label: 'Historique', icon: History },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#0e1324]/90 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
