import React from 'react';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { useXPStore } from '../../../stores/useXPStore';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

// Function to calculate level based on cumulative XP:
// Level 1: 0 - 99 XP
// Level 2: 100 - 399 XP
// Level 3: 400 - 899 XP
// Level 4: 900 - 1599 XP
// Formula: Threshold for level L is 100 * (L-1)^2. Level is sqrt(xp/100) + 1.
export function calculateLevelAndProgress(xp) {
  const currentXP = xp || 0;
  const level = Math.floor(Math.sqrt(currentXP / 100)) + 1;
  const xpCurrentLevelBase = 100 * Math.pow(level - 1, 2);
  const xpNextLevelThreshold = 100 * Math.pow(level, 2);

  const xpInCurrentLevel = currentXP - xpCurrentLevelBase;
  const xpNeededForNext = xpNextLevelThreshold - xpCurrentLevelBase;
  const percent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

  return {
    level,
    xpInCurrentLevel,
    xpNeededForNext,
    percent,
    totalXPNeeded: xpNextLevelThreshold,
  };
}

export function AvatarEvolution() {
  const getActivePersona = usePersonaStore((s) => s.getActivePersona);
  const persona = getActivePersona();
  const radarXP = useXPStore((s) => s.radar) || {};

  const xp = persona?.xp || 0;
  const { level, xpInCurrentLevel, xpNeededForNext, percent } = calculateLevelAndProgress(xp);

  // Dynamic attributes mapping the 6 requested RPG axes
  const data = [
    { subject: 'Conhecimento', A: Math.max(10, (radarXP.conhecimento || 0) + 20 * level), fullMark: 150 },
    { subject: 'Disciplina', A: Math.max(10, (radarXP.disciplina || 0) + 25 * level), fullMark: 150 },
    { subject: 'Foco', A: Math.max(10, (radarXP.foco || 0) + 15 * level), fullMark: 150 },
    { subject: 'Consistência', A: Math.max(10, (radarXP.consistencia || 0) + 18 * level), fullMark: 150 },
    { subject: 'Velocidade', A: Math.max(10, (radarXP.velocidade || 0) + 12 * level), fullMark: 150 },
    { subject: 'Retenção', A: Math.max(10, (radarXP.retencao || 0) + 14 * level), fullMark: 150 },
  ];

  return (
    <div id="avatar-evolution-panel" className="bg-surface border border-border-strong rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Visual neon effect decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full filter blur-3xl pointer-events-none" />

      <h2 className="text-sm font-bold text-text-dim uppercase tracking-widest mb-6 flex items-center gap-2">
        <span className="text-primary text-lg">✦</span> Avatar & Evolução RPG
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Level and XP bar */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-lg flex items-center justify-center relative group">
              <span className="text-3xl filter drop-shadow">{persona?.icon || '🧙‍♂️'}</span>
              <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow">
                Lvl {level}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-text-main tracking-tight">
                {persona?.name || 'Inominável'}
              </h3>
              <p className="text-xs text-text-muted capitalize">
                Persona Ativa • {persona?.role || 'Aventureiro'}
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-text-dim uppercase tracking-wider">
                Progresso de Experiência
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                {Math.round(xpInCurrentLevel)} / {xpNeededForNext} XP
              </span>
            </div>

            <div className="h-3 bg-surface-2 rounded-full overflow-hidden border border-white/5 p-[2px]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                style={{ boxShadow: '0 0 10px rgba(var(--primary-rgb), 0.5)' }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-text-muted font-medium">
              <span>Nível {level}</span>
              <span>Nível {level + 1}</span>
            </div>
          </div>

          <div className="p-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-[11px] leading-relaxed text-text-dim">
            <span className="font-bold text-text-main block mb-1">🎮 Regra de Evolução:</span>
            Cada missão reivindicada adiciona XP à sua Persona ativa. Conforme você acumula XP, seu nível sobe exponencialmente baseado na fórmula <code className="text-secondary font-mono">100 * nível²</code>. Atributos do Radar sobem a cada novo nível!
          </div>
        </div>

        {/* Right: Radar Chart */}
        <div className="flex flex-col items-center justify-center h-[260px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--text-dim)', fontSize: 10, fontWeight: 'bold' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 'auto']}
                tick={{ fill: 'rgba(255, 255, 255, 0.3)', fontSize: 8 }}
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
          <div className="absolute bottom-1 text-[10px] font-bold text-text-dim text-center uppercase tracking-wider bg-white/[0.02] border border-white/5 px-3 py-1 rounded-full">
            Distribuição de Atributos RPG
          </div>
        </div>
      </div>
    </div>
  );
}
