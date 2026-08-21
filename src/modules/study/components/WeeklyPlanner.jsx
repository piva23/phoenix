// WeeklyPlanner.jsx — Planejador semanal abstrato com sync de N dias ao calendário
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudyStore } from '../../../stores/useStudyStore';
import { useCalendarStore } from '../../../stores/useCalendarStore';
import { useSessionModalStore } from '../../../stores/useSessionModalStore';
import { useCycleStore } from '../../../stores/useCycleStore';
import toast from 'react-hot-toast';

const WEEKDAYS = [
  { key: 0, short: 'Dom', full: 'Domingo' },
  { key: 1, short: 'Seg', full: 'Segunda' },
  { key: 2, short: 'Ter', full: 'Terça' },
  { key: 3, short: 'Qua', full: 'Quarta' },
  { key: 4, short: 'Qui', full: 'Quinta' },
  { key: 5, short: 'Sex', full: 'Sexta' },
  { key: 6, short: 'Sáb', full: 'Sábado' },
];

function minutesToHuman(min) {
  if (!min) return '0h';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

// ── Bloco draggable ───────────────────────────────────────────────────────────

function BlockCard({ block, onDragStart }) {
  const openSessionModal = useSessionModalStore(s => s.openModal);
  const navigate = useNavigate();

  function handleClick(e) {
    e.stopPropagation();
    if (openSessionModal) {
      openSessionModal({ subjectId: block.subjectId });
    } else {
      navigate('/study/today');
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ subjectId: block.subjectId }));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(block.subjectId);
      }}
      onClick={handleClick}
      className="group relative rounded-lg border p-2 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-black/20 select-none"
      style={{
        background: `${block.color}10`,
        borderColor: `${block.color}30`,
      }}
      title={`${block.subjectName} — ${minutesToHuman(block.hours * 60)}\nArrastar para mover • Clique para iniciar sessão`}
    >
      <div
        className="w-full h-1 rounded-full mb-1.5 transition-all duration-300 group-hover:h-1.5"
        style={{ background: block.color }}
      />
      <div
        className="text-[10px] font-bold truncate leading-tight"
        style={{ color: block.color }}
      >
        {block.subjectName}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>
          {minutesToHuman(block.hours * 60)}
        </span>
        <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-dim)' }}>
          ↕
        </span>
      </div>
    </div>
  );
}

// ── Coluna do dia ─────────────────────────────────────────────────────────────

function DayColumn({ dayIdx, blocks, isToday, isRestDay, onDrop, onDragStart, onToggleRest }) {
  const totalMin = blocks.reduce((a, b) => a + (b.hours || 0) * 60, 0);
  const day = WEEKDAYS[dayIdx];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('ring-2', 'ring-primary/40');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('ring-2', 'ring-primary/40');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-primary/40');
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data.subjectId) onDrop(dayIdx, data.subjectId);
        } catch {}
      }}
      className="rounded-xl border flex flex-col transition-all duration-300 overflow-hidden"
      style={{
        background: isRestDay
          ? 'rgba(255,255,255,0.01)'
          : isToday
            ? 'rgba(var(--bg-surface-rgb, 23,23,30), 0.8)'
            : 'rgba(var(--bg-surface-rgb, 23,23,30), 0.5)',
        borderColor: isToday ? 'rgba(139,92,246,0.3)' : isRestDay ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
        minHeight: 160,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2.5 py-2 border-b transition-all"
        style={{
          borderColor: isRestDay ? 'rgba(255,255,255,0.03)' : `${blocks[0]?.color || 'var(--primary)'}20`,
          background: isRestDay
            ? 'transparent'
            : isToday
              ? 'rgba(139,92,246,0.06)'
              : 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-black uppercase tracking-wider"
            style={{
              color: isToday ? 'var(--primary)' : isRestDay ? 'var(--text-dim)' : 'var(--text-muted)',
            }}
          >
            {day.short}
          </span>
          {isToday && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        {!isRestDay && blocks.length > 0 && (
          <span className="text-[9px] font-mono font-bold" style={{ color: 'var(--text-dim)' }}>
            {minutesToHuman(totalMin)}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-1.5 space-y-1.5">
        {isRestDay ? (
          <button
            onClick={() => onToggleRest(dayIdx)}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-[9px] rounded-lg border border-dashed transition-all hover:bg-white/[0.03] cursor-pointer"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-dim)', minHeight: 80 }}
          >
            <span className="text-lg opacity-40">🎯</span>
            <span className="opacity-50">Ativar dia</span>
          </button>
        ) : blocks.length === 0 ? (
          <button
            onClick={() => onToggleRest(dayIdx)}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-[9px] rounded-lg border border-dashed transition-all hover:bg-white/[0.03] cursor-pointer"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)', minHeight: 80 }}
          >
            <span className="opacity-40">Soltar bloco aqui</span>
          </button>
        ) : (
          blocks.map((block, idx) => (
            <BlockCard
              key={`${block.subjectId}-${idx}`}
              block={block}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function WeeklyPlanner({ cycle }) {
  const subjects = useStudyStore(s => s.subjects);
  const addEvent = useCalendarStore(s => s.addEvent);
  const manualEvents = useCalendarStore(s => s.manualEvents);
  const {
    generateWeeklyPlan,
    moveBlock,
    setAvailableDays,
  } = useCycleStore();

  const today = new Date();
  const dayOfWeek = today.getDay();
  const [draggingId, setDraggingId] = useState(null);
  const [syncDays, setSyncDays] = useState(7);

  const availableDays = cycle?.availableDays || [1, 2, 3, 4, 5];

  // Plano semanal (abstrato, day-of-week keys)
  const weeklyPlan = useMemo(() => {
    if (cycle?.weeklyPlan && Object.keys(cycle.weeklyPlan).length > 0) {
      return cycle.weeklyPlan;
    }
    return generateLocalPlan(cycle?.items || [], subjects, availableDays);
  }, [cycle?.weeklyPlan, cycle?.items, subjects, availableDays]);

  // Toggle dia disponível
  function handleToggleDay(dayIdx) {
    const newDays = availableDays.includes(dayIdx)
      ? availableDays.filter(d => d !== dayIdx)
      : [...availableDays, dayIdx].sort();
    setAvailableDays(cycle.id, newDays);
  }

  // Gerar plano
  function handleGenerate() {
    generateWeeklyPlan(cycle.id);
    toast.success('Plano semanal gerado!');
  }

  // Drop: mover bloco
  function handleDrop(toDay, subjectId) {
    if (draggingId) setDraggingId(null);
    let fromDay = null;
    Object.entries(weeklyPlan).forEach(([day, blocks]) => {
      if (blocks.some(b => b.subjectId === subjectId)) fromDay = Number(day);
    });
    if (fromDay === toDay || fromDay === null) return;
    moveBlock(cycle.id, fromDay, toDay, subjectId);
  }

  // Sincronizar com calendário — gera eventos para os próximos N dias
  // repetindo o padrão semanal
  function handleSyncCalendar() {
    let count = 0;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // começar de amanhã

    for (let i = 0; i < syncDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dayNum = d.getDay();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const blocks = weeklyPlan[dayNum] || [];
      if (blocks.length === 0) continue;

      blocks.forEach((block, idx) => {
        const exists = manualEvents.some(
          e => e.date === dateStr && e.type === 'estudo' && e.cycleId === cycle.id && e.subjectId === block.subjectId
        );
        if (exists) return;

        addEvent({
          title: `📚 ${block.subjectName}`,
          date: dateStr,
          time: `${9 + idx * 2}:00`,
          type: 'estudo',
          cycleId: cycle.id,
          subjectId: block.subjectId,
          description: `Bloco do ciclo: ${minutesToHuman(block.hours * 60)} de estudo`,
        });
        count++;
      });
    }

    if (count > 0) {
      toast.success(`${count} evento(s) criado(s) no calendário!`);
    } else {
      toast('Calendário já sincronizado.', { icon: '✅' });
    }
  }

  const totalHours = Object.values(weeklyPlan).flat().reduce((a, b) => a + (b.hours || 0), 0);
  const activeDays = Object.values(weeklyPlan).filter(b => b.length > 0).length;

  const displayDays = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-4">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
            <span className="text-lg">📅</span>
            Planner Semanal
          </h3>
          <p className="text-[11px] text-text-dim mt-0.5">
            {activeDays} dia{activeDays !== 1 ? 's' : ''} • {minutesToHuman(totalHours * 60)} planejado
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Input de dias para sync */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-dim">Sync</span>
            <input
              type="number"
              min={1}
              max={30}
              value={syncDays}
              onChange={(e) => setSyncDays(Math.max(1, Math.min(30, Number(e.target.value) || 7)))}
              className="w-12 px-2 py-1 rounded-lg text-[11px] font-bold text-center border outline-none"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
            />
            <span className="text-[10px] text-text-dim">dias</span>
          </div>
          <button
            onClick={handleSyncCalendar}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
          >
            📅 Sincronizar
          </button>
          <button
            onClick={handleGenerate}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white cursor-pointer"
            style={{ background: 'var(--primary)' }}
          >
            🔄 Gerar
          </button>
        </div>
      </div>

      {/* ── DAY TOGGLES ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map(day => {
          const isActive = availableDays.includes(day.key);
          return (
            <button
              key={day.key}
              onClick={() => handleToggleDay(day.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-white/[0.02] text-text-dim border-white/5 hover:bg-white/5'
              }`}
            >
              {day.short} {isActive ? '✓' : ''}
            </button>
          );
        })}
      </div>

      {/* ── GRID SEMANAL ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-2">
        {displayDays.map(dayIdx => {
          const blocks = weeklyPlan[dayIdx] || [];
          const isToday = dayIdx === dayOfWeek;
          const isRestDay = !availableDays.includes(dayIdx);

          return (
            <DayColumn
              key={dayIdx}
              dayIdx={dayIdx}
              blocks={blocks}
              isToday={isToday}
              isRestDay={isRestDay}
              onDrop={handleDrop}
              onDragStart={setDraggingId}
              onToggleRest={() => handleToggleDay(dayIdx)}
            />
          );
        })}
      </div>

      {/* ── LEGENDA ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 px-1">
        {(cycle?.items || []).slice(0, 8).map((item, idx) => {
          const subj = subjects.find(s => s.id === item.subjectId);
          const color = subj?.color || item.subjectColor || '#8B5CF6';
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[9px] text-text-dim">
                {subj?.name || item.subjectName || '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fallback local ────────────────────────────────────────────────────────────

function generateLocalPlan(cycleItems, subjects, availableDays) {
  if (!cycleItems?.length) return {};
  const days = availableDays?.length > 0 ? availableDays : [1, 2, 3, 4, 5];

  const enriched = cycleItems.map(item => ({
    ...item,
    hours: item.horasPorRodada || 1,
    subjectName: subjects.find(s => s.id === item.subjectId)?.name || item.subjectName || '—',
    color: subjects.find(s => s.id === item.subjectId)?.color || item.subjectColor || '#8B5CF6',
  }));
  const sorted = [...enriched].sort((a, b) => b.hours - a.hours);

  const plan = {};
  days.forEach(d => { plan[d] = []; });
  const dayLoad = {};
  days.forEach(d => { dayLoad[d] = 0; });

  sorted.forEach(item => {
    const lightest = days.reduce((a, b) => dayLoad[a] <= dayLoad[b] ? a : b);
    plan[lightest].push({
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      hours: item.hours,
      color: item.color,
    });
    dayLoad[lightest] += item.hours;
  });

  return plan;
}
