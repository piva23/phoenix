import React, { useState } from 'react';
import { usePersonaStore } from '../../stores/usePersonaStore';
import { useUserStore } from '../../stores/useUserStore';
import { PersonaProjectCard } from './widgets/PersonaProjectCard';
import { TimelineFeed } from './widgets/TimelineFeed';
import { WeatherWidget } from './widgets/WeatherWidget';
import { MediaWidget } from './widgets/MediaWidget';
import { ReadingWidget } from './widgets/ReadingWidget';
import { HabitsWeekGrid } from './widgets/HabitsWeekGrid';
import { UpcomingEvents } from './widgets/UpcomingEvents';
import { PanoramaRings } from './widgets/PanoramaRings';
import { VisionBoardWidget } from './widgets/VisionBoardWidget';
import { DashboardSettingsModal } from './components/DashboardSettingsModal';
import { motion } from 'framer-motion';

const PERSONA_GREETINGS = {
  horus: {
    greeting: 'Eleve a sua visão, Arquiteto.',
    quote: 'O Cosmos reflete a clareza do seu propósito. Desenhe o mundo com sabedoria absoluta.',
    actionStyle: 'shadow-purple-500/10 border-purple-500/20'
  },
  sombra: {
    greeting: 'Sintonize o silêncio interior.',
    quote: 'Olhe para dentro sem medo. A sua maior força reside na integração da sua própria profundidade.',
    actionStyle: 'shadow-gray-500/10 border-gray-500/20'
  },
  leotauro: {
    greeting: 'Erga-se para vencer, Leotauro!',
    quote: 'Corpo indomável, mente inabalável. Força, ação física e autoestima máxima hoje!',
    actionStyle: 'shadow-red-500/10 border-red-500/20'
  },
  maion: {
    greeting: 'Foco estratégico, Mago Leão.',
    quote: 'Conhecimento é poder. Execute as suas tarefas de carreira com maestria e autoridade refinada.',
    actionStyle: 'shadow-teal-500/10 border-teal-500/20'
  },
  'leao-peixe': {
    greeting: 'Lidere com serenidade.',
    quote: 'Flua em águas profundas e proteja o seu círculo com amor e autoridade serena.',
    actionStyle: 'shadow-sky-500/10 border-sky-500/20'
  },
  p: {
    greeting: 'Cultive a conexão, reconstrutor.',
    quote: 'Semeie afeto, paciência e proximidade. O fortalecimento do vínculo afetivo é a sua meta.',
    actionStyle: 'shadow-pink-500/10 border-pink-500/20'
  },
  duck: {
    greeting: 'Acolha-se plenamente, Duck.',
    quote: 'Medo, culpa e vergonha são acolhidos sem julgamentos. Respire e caminhe com suavidade.',
    actionStyle: 'shadow-amber-500/10 border-amber-500/20'
  }
};

const WEEKDAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

export function DashboardPage() {
  const { name } = useUserStore();
  const getActivePersona = usePersonaStore(s => s.getActivePersona);
  const activePersona = getActivePersona();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const personaConfig = PERSONA_GREETINGS[activePersona?.id] || {
    greeting: 'Sintonize a sua lente diária.',
    quote: 'Mantenha o foco nos rituais e nas ações prioritárias da sua jornada.',
    actionStyle: 'border-white/5'
  };

  const now = new Date();
  const dateStr = `${WEEKDAYS[now.getDay()]}, ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 px-1 select-none">
      
      {/* 1. Header: Reativo à Persona com Engrenagem de Configuração */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="icon">
              {activePersona?.icon || '👁'}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
              style={{
                background: `${activePersona?.colorPrimary || 'var(--primary)'}18`,
                color: activePersona?.colorPrimary || 'var(--primary)',
                border: `1px solid ${activePersona?.colorPrimary || 'var(--primary)'}33`
              }}
            >
              Lente Ativa: {activePersona?.name || 'Hórus'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">
            {personaConfig.greeting}
          </h1>
          <p className="text-xs text-text-dim max-w-2xl font-medium leading-relaxed italic">
            "{personaConfig.quote}"
          </p>
        </div>

        {/* Date & Settings Trigger */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-xs font-semibold text-text-main">{dateStr}</div>
            <div className="text-[10px] text-text-dim">Phoenix OS v3.0</div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-primary/40 flex items-center justify-center text-text-dim hover:text-text-main transition-all outline-none"
            title="Configurações do Dashboard"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Vision Board Widget */}
      <div className="w-full">
        <VisionBoardWidget />
      </div>

      {/* 2. Responsive Dashboard Grid */}
      {/* Mobile-First: Column stack putting Timeline at the very top. Desktop: 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* CENTER / MAIN ACTION COLUMN: Timeline Diária (Positioned at the top for mobile) */}
        <div className="order-1 lg:order-2 lg:col-span-1">
          <TimelineFeed />
        </div>

        {/* LEFT COLUMN: Persona Control + Weather */}
        <div className="order-2 lg:order-1 flex flex-col gap-6">
          <PersonaProjectCard />
          <WeatherWidget />
        </div>

        {/* RIGHT COLUMN: Media + Reading + Habits */}
        <div className="order-3 lg:order-3 flex flex-col gap-6">
          <MediaWidget />
          <ReadingWidget />
          <HabitsWeekGrid />
        </div>

      </div>

      {/* 3. Bottom Panels: Habits and Event schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest px-1">
            Mapeamento de Indicadores
          </h3>
          <PanoramaRings />
        </div>
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest px-1">
            Agenda & Compromissos
          </h3>
          <UpcomingEvents />
        </div>
      </div>

      {/* Settings Modal */}
      <DashboardSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
}
