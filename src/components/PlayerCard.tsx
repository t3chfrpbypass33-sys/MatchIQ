import React, { useState } from 'react';
import { Award, ShieldAlert, BadgeInfo } from 'lucide-react';

interface PlayerCardProps {
  id: string;
  name: string;
  position: string;
  jersey_number?: number | string;
  photo?: string;
  goals?: number;
  assists?: number;
  ai_score?: number | string;
  status?: 'probable' | 'injured' | 'suspended' | 'doubtful' | string;
  reason?: string;
  className?: string;
}

export default function PlayerCard({
  id,
  name,
  position,
  jersey_number,
  photo,
  goals,
  assists,
  ai_score,
  status,
  reason,
  className = ""
}: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);

  // Compute elegant initials fallback
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  // Compute beautiful hashed gradient
  const bgGradients = [
    "from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30",
    "from-blue-600/20 to-cyan-600/20 text-blue-400 border-blue-500/30",
    "from-indigo-600/20 to-purple-600/20 text-purple-400 border-purple-500/30",
    "from-amber-600/20 to-orange-600/20 text-amber-400 border-amber-500/30",
    "from-rose-600/20 to-red-600/20 text-rose-400 border-rose-500/30",
  ];
  const charHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const activeGradient = bgGradients[charHash % bgGradients.length];

  // Map API-Football standard ID if photo is not specified
  const computedPhotoUrl = photo || (id && !id.startsWith('f') && !id.startsWith('b') && !id.startsWith('a') && !id.startsWith('u') && !id.startsWith('m') && !id.startsWith('c')
    ? `https://media.api-sports.io/football/players/${id}.png`
    : undefined);

  // Status mapping UI
  const isUnavailable = status === 'injured' || status === 'suspended' || status === 'doubtful';

  return (
    <div 
      className={`group flex items-center justify-between p-3 rounded-2xl bg-[#0b0f1e]/80 border border-slate-850/80 hover:border-slate-800 hover:bg-[#0e1326] transition-all duration-300 shadow-md ${className}`}
      id={`player-card-${id || name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Rounded Player Photo Container with lightweight frame */}
        <div className="relative shrink-0">
          <div className="h-11 w-11 rounded-full overflow-hidden border border-slate-800 flex items-center justify-center bg-slate-900 shadow-inner group-hover:border-slate-700 transition-colors">
            {computedPhotoUrl && !imgError ? (
              <img
                src={computedPhotoUrl}
                alt={name}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`h-full w-full flex items-center justify-center rounded-full bg-gradient-to-tr font-mono text-xs font-bold leading-none uppercase border ${activeGradient}`}>
                {initials}
              </div>
            )}
          </div>
          
          {/* Jersey Number small Badge overlay */}
          {jersey_number !== undefined && jersey_number !== null && (
            <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-950 border border-slate-800 text-[8px] font-mono font-black text-slate-350 shadow">
              {jersey_number}
            </span>
          )}
        </div>

        {/* Player Name and Role details */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 shrink-0 max-w-full">
            <span className="text-xs font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors truncate max-w-[140px] xs:max-w-[180px]" title={name}>
              {name}
            </span>
            {status === 'injured' && <ShieldAlert className="h-3 w-3 text-rose-450 shrink-0" />}
            {status === 'doubtful' && <BadgeInfo className="h-3 w-3 text-amber-500 shrink-0" />}
          </div>
          <div className="text-[10px] font-medium text-slate-450 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850 text-[9px] text-slate-450">
              {position}
            </span>
            {reason && (
              <span className="text-slate-500 italic max-w-[130px] truncate" title={reason}>
                {reason}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats or Coef Column */}
      <div className="text-right shrink-0">
        {goals !== undefined || assists !== undefined ? (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold text-emerald-450 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/10">
                {goals ?? 0} B
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-450 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                {assists ?? 0} A
              </span>
            </div>
            {isUnavailable && (
              <span className={`text-[8px] font-bold uppercase mt-1 px-1 py-0.2 rounded border hidden xs:inline-block ${
                status === 'injured' ? 'text-rose-400 border-rose-900/30 bg-rose-950/20' :
                status === 'suspended' ? 'text-slate-400 border-slate-800 bg-slate-900' :
                'text-amber-500 border-amber-900/30 bg-amber-950/20'
              }`}>
                {status === 'injured' ? 'Blessé' : status === 'suspended' ? 'Suspendu' : 'Incertain'}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/60 px-2 py-1 rounded-xl">
              <Award className="h-3 w-3 text-purple-400 shrink-0" />
              <span className="text-[10px] font-mono font-bold text-slate-205">
                {ai_score ?? "7.8"}
              </span>
            </div>
            {isUnavailable && (
              <span className={`text-[8px] font-bold uppercase mt-1 px-1 py-0.2 rounded border ${
                status === 'injured' ? 'text-rose-400 border-rose-900/30 bg-rose-950/20' :
                status === 'suspended' ? 'text-slate-400 border-slate-800 bg-slate-900' :
                'text-amber-500 border-amber-900/30 bg-amber-950/20'
              }`}>
                {status === 'injured' ? 'Blessé' : status === 'suspended' ? 'Suspendu' : 'Incertain'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
