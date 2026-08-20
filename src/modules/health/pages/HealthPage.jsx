import { useState } from 'react';
import { TodayHealthView } from '../views/TodayHealthView';
import { PlansTab } from '../components/PlansTab';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/layout/PageHeader';

const TABS = [
  { id: 'today', label: '⚡ Hoje (Execução)' },
  { id: 'admin', label: '⚙️ Administração (Setup)' },
];

export function HealthPage() {
  const [tab, setTab] = useState('today');

  return (
    <div className="page-container">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <PageHeader
        icon="💪"
        title="Health OS"
        subtitle={new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      >
        {/* ── TABS PRINCIPAIS (HOJE VS ADMINISTRAÇÃO) ──────────────────────── */}
        <div className="flex gap-1.5 p-1.5 rounded-2xl card-surface sm:w-auto w-full">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-initial sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 relative cursor-pointer ${
                tab === t.id
                  ? 'text-white shadow-lg shadow-purple-900/30'
                  : 'text-text-dim hover:text-text-muted hover:bg-white/5'
              }`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="activeTopTab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </PageHeader>

      {/* ── CONTEÚDO DA PÁGINA ────────────────────────────────────────────── */}
      <main className="px-5 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'today' && <TodayHealthView />}
            {tab === 'admin' && <PlansTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default HealthPage;
