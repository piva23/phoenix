import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Droplets, Flame, Utensils, Dumbbell, BarChart3, Settings } from 'lucide-react';

import { HidratacaoView } from '../views/HidratacaoView';
import { HabitosView } from '../views/HabitosView';
import { DietaView } from '../views/DietaView';
import { TreinoView } from '../views/TreinoView';
import { HistoricoView } from '../views/HistoricoView';
import { PlansTab } from '../components/PlansTab';

const TABS = [
  { id: 'hidratacao', label: 'Hidratação', icon: Droplets, color: '#38BDF8' },
  { id: 'habitos', label: 'Hábitos', icon: Flame, color: '#A855F7' },
  { id: 'dieta', label: 'Dieta', icon: Utensils, color: '#10B981' },
  { id: 'treino', label: 'Treino', icon: Dumbbell, color: '#F59E0B' },
  { id: 'historico', label: 'Histórico', icon: BarChart3, color: '#F97316' },
  { id: 'config', label: 'Config', icon: Settings, color: '#6B6A7A' },
];

const VALID_TABS = TABS.map(t => t.id);

export function HealthPage({ initialTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [tab, setTab] = useState(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab
      : urlTab && VALID_TABS.includes(urlTab) ? urlTab
        : 'hidratacao'
  );

  // Sync URL when tab changes
  useEffect(() => {
    if (tab !== 'hidratacao') {
      setSearchParams({ tab }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [tab, setSearchParams]);

  return (
    <div className="page-container">
      {/* ── HEADER (clean, not hidden on mobile) ─────────────────────────── */}
      <PageHeader
        icon="💪"
        title="Saúde"
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
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${isActive
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
            {tab === 'dieta' && <DietaView />}
            {tab === 'treino' && <TreinoView />}
            {tab === 'historico' && <HistoricoView />}
            {tab === 'config' && <PlansTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default HealthPage;