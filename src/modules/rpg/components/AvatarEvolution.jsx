import React from 'react';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { useGameStore, calcLevelProgress } from '../../../stores/useGameStore';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export function AvatarEvolution() {
  const getActivePersona = usePersonaStore((s) => s.getActivePersona);
  const persona = getActivePersona();
  const totalXP = useGameStore((s) => s.totalXP);
  const radarXP = useGameStore((s) => s.radar) || {};

  const { level, currentXP, neededXP, progress } = calcLevelProgress(totalXP || 0);

  const data = [
    { subject: 'Conhecimento', A: Math.max(10, (radarXP.conhecimento || 0) + 20 * level), fullMark: 150 },
    { subject: 'Disciplina', A: Math.max(10, (radarXP.disciplina || 0) + 25 * level), fullMark: 150 },
    { subject: 'Foco', A: Math.max(10, (radarXP.foco || 0) + 15 * level), fullMark: 150 },
    { subject: 'Consistência', A: Math.max(10, (radarXP.consistencia || 0) + 18 * level), fullMark: 150 },
    { subject: 'Velocidade', A: Math.max(10, (radarXP.velocidade || 0) + 12 * level), fullMark: 150 },
    { subject: 'Retenção', A: Math.max(10, (radarXP.retencao || 0) + 14 * level), fullMark: 150 },
  ];

  return (
    <div id="avatar-evolution-panel" className="bg-surface border border-border-strong rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Visual neon effect decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full filter blur-3xl pointer-events-none" />

      <h2 className="text-sm font-bold text-text-dim uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
        <span className="text-primary text-lg">✦</span> Avatar & Evolução RPG
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
        {/* Left: Level and XP bar */}
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-lg flex items-center justify-center relative group flex-shrink-0">
              <span className="text-2xl sm:text-3xl filter drop-shadow">{persona?.icon || '🧙‍♂️'}</span>
              <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow">
                Lvl {level}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-text-main tracking-tight truncate">
                {persona?.name || 'Inominável'}
              </h3>
              <p className="text-xs text-text-muted capitalize truncate">
                Persona Ativa • {persona?.role || 'Aventureiro'}
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] sm:text-xs font-bold text-text-dim uppercase tracking-wider">
                Progresso de Experiência
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-primary">
                {Math.round(currentXP)} / {neededXP} XP
              </span>
            </div>

            <div className="h-2.5 sm:h-3 bg-surface-2 rounded-full overflow-hidden border border-white/5 p-[2px]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                style={{ boxShadow: '0 0 10px rgba(var(--primary-rgb), 0.5)' }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-text-muted font-medium">
              <span>Nível {level}</span>
              <span>Nível {level + 1}</span>
            </div>
          </div>

          {/* Stats Grid - Mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {data.map((item) => (
              <div
                key={item.subject}
                className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 sm:p-3 text-center"
              >
                <div className="text-[10px] text-text-dim font-bold uppercase tracking-wider mb-1">
                  {item.subject.slice(0, 6)}
                </div>
                <div className="text-sm sm:text-base font-black text-primary font-mono">
                  {item.A}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 sm:p-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-[10px] sm:text-[11px] leading-relaxed text-text-dim">
            <span className="font-bold text-text-main block mb-1">🎮 Regra de Evolução:</span>
            Cada sessão, treino e hábito real gera XP automaticamente. Conforme você acumula XP, seu nível sobe pela fórmula <code className="text-secondary font-mono">100 + 50L + 25L²</code> e o Radar de Atributos evolui com suas ações reais.
          </div>
        </div>

        {/* Right: Radar Chart */}
        <div className="flex flex-col items-center justify-center h-[220px] sm:h-[260px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--text-dim)', fontSize: 9, fontWeight: 'bold' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 'auto']}
                tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 7 }}
                axisLine={false}
              />
              <Radar
                name={persona?.name || 'Atributos'}
                dataKey="A"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 text-[9px] sm:text-[10px] font-bold text-text-dim text-center uppercase tracking-wider bg-white/[0.02] border border-white/5 px-2 sm:px-3 py-1 rounded-full">
            Distribuição de Atributos RPG
          </div>
        </div>
      </div>
    </div>
  );
}
