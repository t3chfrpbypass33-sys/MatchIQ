import React, { useState } from 'react';

interface TeamLogoProps {
  logoUrl?: string;
  fallbackFlag: string;
  name?: string;
  className?: string;
}

export default function TeamLogo({
  logoUrl,
  fallbackFlag,
  name = '',
  className = 'h-8 w-8'
}: TeamLogoProps) {
  const [errorCount, setErrorCount] = useState(0);

  // If the logoUrl is not present or we encountered error twice (standard fallback retry), display the emoji flag
  if (!logoUrl || errorCount >= 2) {
    return (
      <span className={`inline-flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-base font-sans select-none ${className}`} title={name}>
        {fallbackFlag}
      </span>
    );
  }

  return (
    <div className={`shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shadow-inner p-1 select-none ${className}`}>
      <img
        src={logoUrl}
        alt={name}
        onError={() => setErrorCount(prev => prev + 1)}
        className="h-full w-full object-contain filter drop-shadow-sm transition-opacity duration-300 opacity-100"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
