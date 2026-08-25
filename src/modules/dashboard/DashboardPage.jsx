import React, { useState, useMemo } from 'react';
import { usePersonaStore } from '../../stores/usePersonaStore';
import { useGameStore, calcLevelProgress } from '../../stores/useGameStore';
import { useVisionStore } from '../../stores/useVisionStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { TimelineFeed } from './widgets/TimelineFeed';
import { WeatherWidget } from './widgets/WeatherWidget';
import { HabitsWeekGrid } from './widgets/HabitsWeekGrid';
import { PanoramaRings } from './widgets/PanoramaRings';
import { VisionBoardWidget } from './widgets/VisionBoardWidget';
import { DashboardSettingsModal } from './components/DashboardSettingsModal';
import { motion } from 'framer-motion';

const FALLBACK_QUOTES = [
  'Mantenha o foco nos rituais e nas ações prioritárias da sua jornada.',
  'A consistência supera a intensidade. Um passo de cada vez.',
  'O.progresso real acontece quando a disciplina encontra o propósito.',
  'Não é sobre ser perfeito, é sobre ser melhor do que ontem.',
  'A clarity do seus objetivos define a direção do seu futuro.',
];

const WEEKDAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

export function DashboardPage() {
  const name = useGameStore(s => s.name);
  const getActivePersona = usePersonaStore(s => s.getActivePersona);
  const activePersona = getActivePersona();
  const visionItems = useVisionStore(s => s.items);
  const getItemsForPersona = useVisionStore(s => s.getItemsForPersona);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Pick a daily quote from vision items (active ones for current persona, or all active)
  const dailyQuote = useMemo(() => {
    const active = getItemsForPersona(activePersona?.id);
    if (active.length > 0) {
      // Rotate by day-of-year to get deterministic but varied selection
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      return active[dayOfYear % active.length]?.text || active[0]?.text;
    }
    // Fallback to persona quotes or default
    const fallbackIdx = Math.floor(Date.now() / 86400000) % FALLBACK_QUOTES.length;
    return FALLBACK_QUOTES[fallbackIdx];
  }, [activePersona?.id, visionItems.length]);

  const now = new Date();
  const dateStr = `${WEEKDAYS[now.getDay()]}, ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;
  const firstName = (name || 'Felipe').split(' ')[0];

  return (
    <div className="page-container space-y-6 select-none">

      {/* ── 1. HEADER — Frase Diária de Visão ─────────────────────────────── */}
      <PageHeader
        icon="👁️"
        title={`Olá, ${firstName}.`}
        subtitle={activePersona?.greeting || 'Sintonize a sua lente diária.'}
        badge={
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Frase do Dia
          </span>
        }
      >
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-xs font-semibold text-text-main">{dateStr}</div>
            <div className="text-[10px] text-text-dim">Phoenix OS v5.0</div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-2xl card-surface hover:bg-white/5 hover:border-primary/40 flex items-center justify-center text-text-dim hover:text-text-main transition-all outline-none"
            title="Configurações do Dashboard"
          >
            ⚙️
          </button>
        </div>
      </PageHeader>

      {/* Frase de Visão */}
      <p className="text-sm text-text-muted max-w-2xl font-medium leading-relaxed italic px-1">
        "{dailyQuote}"
      </p>

      {/* ── 2. VISION BOARD ────────────────────────────────────────────────── */}
      <VisionBoardWidget />

      {/* ── 3. CENTRO — Grid 3 colunas ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

        {/* Coluna Esquerda: Weather */}
        <div className="order-2 lg:order-1">
          <WeatherWidget />
        </div>

        {/* Coluna Central: Timeline (destaque) */}
        <div className="order-1 lg:order-2 lg:col-span-1">
          <TimelineFeed />
        </div>

        {/* Coluna Direita: Habits */}
        <div className="order-3 lg:order-3">
          <HabitsWeekGrid />
        </div>

      </div>

      {/* ── 4. BASE — Panorama de Indicadores ─────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest px-1">
          Mapeamento de Indicadores
        </h3>
        <PanoramaRings />
      </div>

      {/* Settings Modal */}
      <DashboardSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
}

export default DashboardPage;
