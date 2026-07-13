import { useState } from 'react';
import { TodayHealthView } from '../views/TodayHealthView';
import { PlansTab } from '../components/PlansTab';
import { HealthAnalyticsView } from '../views/HealthAnalyticsView';
import { useHealthStore } from '../../../stores/useHealthStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'today', label: '🏠 Hoje' },
  { id: 'plans', label: '📋 Planos' },
  { id: 'analytics', label: '📊 Analytics' },
];

export function HealthPage() {
  const [tab, setTab] = useState('today');
  const { plans, loadDefaults } = useHealthStore();

  const isPlansEmpty = !plans || !plans.habits || plans.habits.length === 0;

  const handleLoadDefaults = () => {
    if (
      window.confirm(
        'Isso vai apagar seus planos personalizados e recarregar os dados do healthDb.json. Deseja continuar?'
      )
    ) {
      loadDefaults();
      toast.success('Dados padrão carregados com sucesso!', { icon: '♻️' });
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-2" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Health OS <span className="text-2xl">💪</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-medium capitalize">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          {/* Botão de Emergência: Carregar Dados Padrão */}
          <button
            onClick={handleLoadDefaults}
            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5"
            title="Carregar Dados Padrão"
          >
            Carregar Dados Padrão ↺
          </button>
        </div>

        {/* Banner de Emergência quando estiver vazio */}
        {isPlansEmpty && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Módulo de Saúde Vazio</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">Seus planos personalizados e registros de hábitos/treinos estão vazios no momento.</p>
              </div>
            </div>
            <button
              onClick={handleLoadDefaults}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5"
            >
              📥 Carregar Dados Padrão
            </button>
          </div>
        )}

        {/* ── TABS PRINCIPAIS ──────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1.5 rounded-xl bg-gray-900/80 border border-gray-800/50 backdrop-blur-md">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === t.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO (Com animação suave) ─────────────────────────────────── */}
      <main className="flex-1 px-5 pt-4 pb-20 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'today' && <TodayHealthView />}
            {tab === 'plans' && <PlansTab />}
            {tab === 'analytics' && <HealthAnalyticsView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
