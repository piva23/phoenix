import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Droplets, Flame, Utensils, BarChart3, Settings } from 'lucide-react';

import { HidratacaoView } from '../views/HidratacaoView';
import { HabitosView } from '../views/HabitosView';
import { DietaTreinoView } from '../views/DietaTreinoView';
import { HistoricoView } from '../views/HistoricoView';
import { PlansTab } from '../components/PlansTab';

const TABS = [
  { id: 'hidratacao',  label: 'Hidratação',       icon: Droplets,   color: '#38BDF8' },
  { id: 'habitos',     label: 'Hábitos',          icon: Flame,      color: '#A855F7' },
  { id: 'dieta',       label: 'Dieta & Treino',   icon: Utensils,   color: '#10B981' },
  { id: 'historico',   label: 'Histórico',        icon: BarChart3,  color: '#F59E0B' },
  { id: 'config',      label: 'Config',           icon: Settings,   color: '#6B6A7A' },
];

export function HealthPage() {
  const [tab, setTab] = useState('hidratacao');

  return (
    <div className="page-container">
      {/* ── HEADER (clean, not hidden on mobile) ─────────────────────────── */}
      <PageHeader
        icon="💪"
        title="Health OS"
        subtitle={new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      />

      {/* ── TAB BAR (horizontal scrollable, below header) ────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide p-1.5 card-surface mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25'
                  : 'text-text-dim hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} style={{ color: isActive ? 'inherit' : t.color }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <main className="overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'hidratacao' && <HidratacaoView />}
            {tab === 'habitos' && <HabitosView />}
            {tab === 'dieta' && <DietaTreinoView />}
            {tab === 'historico' && <HistoricoView />}
            {tab === 'config' && <PlansTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default HealthPage;