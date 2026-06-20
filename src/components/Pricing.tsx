import React, { useState } from 'react';
import { Check, Sparkles, Trophy, ShieldCheck, ArrowLeft, Zap, Star } from 'lucide-react';

interface PricingProps {
  onBack: () => void;
}

export default function Pricing({ onBack }: PricingProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleProClick = () => {
    setToastMessage("Paiement bientôt disponible");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl shadow-lg font-bold text-xs sm:text-sm animate-bounce">
          <Star className="h-5 w-5 animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour à l'accueil</span>
        </button>
      </div>

      {/* Header section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>STRUCTURE FREEMIUM DEMO</span>
        </div>
        <h1 className="text-3xl sm:text-4.5xl font-black text-white tracking-tight mb-3">
          Soutenez Match<span className="text-emerald-400">IQ</span> Premium
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Obtenez des analyses approfondies guidées par l'IA des matchs de la Coupe du Monde FIFA 2026 en illimité.
        </p>
      </div>

      {/* Plans Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        
        {/* FREE PLAN */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0c1122]/80 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                Plan Gratuit
              </span>
              <div className="bg-slate-900 border border-slate-750 text-slate-400 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase">
                Actif par défaut
              </div>
            </div>
            
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">0$</span>
              <span className="text-slate-500 font-mono text-xs">/ toujours</span>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Pour découvrir l'application, tester l'outil d'analyse prédictive et consulter les fiches de match.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>2 analyses de match gratuites par jour</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Calendrier complet Coupe du Monde 2026</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Fiches d'infirmerie & blessures des joueurs</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Confrontations directes historiques</span>
              </li>
            </ul>
          </div>

          <button
            disabled
            className="w-full bg-slate-900 text-slate-500 border border-slate-800 py-3 rounded-xl font-bold text-xs uppercase tracking-wide cursor-not-allowed select-none"
          >
            Votre Plan Actuel
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500 bg-[#0e162b] p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-emerald-950/20">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[9px] font-mono font-black uppercase px-3 py-1 rounded-bl">
            POPULAIRE
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                Plan Pro
              </span>
            </div>
            
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">12$</span>
              <span className="text-slate-400 font-mono text-xs">/ mois</span>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Pour les analystes passionnés d'analytics qui veulent suivre chaque seconde de la compétition sans limites.
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-bold text-emerald-300">Analyses d'IA illimitées</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Alertes email de compositions (à venir)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Export PDF des analyses tactiques (à venir)</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-200">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Couverture prioritaire des serveurs Live IA</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleProClick}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            Passer Pro
          </button>
        </div>

      </div>

      {/* Bottom disclaimer */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 max-w-md bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Note : Stripe sera branché ici ultérieurement. Aucun montant réel ne sera prélevé. Tout le contenu pro est visible gratuitement.</span>
        </div>
      </div>

    </div>
  );
}
