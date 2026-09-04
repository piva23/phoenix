import React, { useState } from 'react';

import { useGameStore } from '../../stores/useGameStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { TimelineFeed } from './widgets/TimelineFeed';
import { WeatherWidget } from './widgets/WeatherWidget';
import { HabitsWeekGrid } from './widgets/HabitsWeekGrid';
import { PanoramaRings } from './widgets/PanoramaRings';
import { VisionBoardWidget } from './widgets/VisionBoardWidget';
import { QuickAccess } from './widgets/QuickAccess';
import { DashboardSettingsModal } from './components/DashboardSettingsModal';
import { motion } from 'framer-motion';

const WEEKDAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

export function DashboardPage() {
  const name = useGameStore(s => s.name);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const now = new Date();
  const dateStr = `${WEEKDAYS[now.getDay()]}, ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;
  const firstName = (name || 'Felipe').split(' ')[0];

  return (
    <div className="page-container space-y-5 select-none">

      {/* ── 1. HEADER — Olá + data + versão + settings ────────────────────── */}
      <PageHeader
        icon="👁️"
        title={`Olá, ${firstName}.`}
        subtitle="Sintonize a sua lente diária."
      >
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-xs font-semibold text-text-main">{dateStr}</div>
            <div className="text-[10px] text-text-dim">Phoenix OS v6.0.0</div>
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

      {/* ── 2. VISION BOARD ────────────────────────────────────────────────── */}
      <VisionBoardWidget />

      {/* ── 3. ACESSO RÁPIDO ───────────────────────────────────────────────── */}
      <QuickAccess />

      {/* ── 4. TIMELINE — card compacto ────────────────────────────────────── */}
      <TimelineFeed />

      {/* ── 5. BASE — Panorama de Indicadores ──────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest px-1">
          Mapeamento de Indicadores
        </h3>
        <PanoramaRings />
      </div>

      {/* ── 6. WEATHER + HABITS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <WeatherWidget />
        <HabitsWeekGrid />
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