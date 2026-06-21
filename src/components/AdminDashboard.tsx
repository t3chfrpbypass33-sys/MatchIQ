import React from 'react';
import { Users, BarChart3, ShieldCheck } from 'lucide-react';

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  // Mock data for now since we don't have real-time tracking
  const connectedUsers = 4;
  const conversationCTR = '12.5%';

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <button onClick={onBack} className="text-emerald-400 font-bold mb-4">← Retour</button>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-amber-400" /> Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Users className="h-5 w-5" /> Utilisateurs Connectés
          </div>
          <div className="text-3xl font-bold">{connectedUsers}</div>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <BarChart3 className="h-5 w-5" /> Taux de clic (Conversations)
          </div>
          <div className="text-3xl font-bold">{conversationCTR}</div>
        </div>
      </div>
      <div className="mt-8 bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h2 className="text-lg font-bold mb-4">Abonnements</h2>
        <p className="text-slate-400">Section de gestion des abonnements à implémenter.</p>
      </div>
    </div>
  );
}
