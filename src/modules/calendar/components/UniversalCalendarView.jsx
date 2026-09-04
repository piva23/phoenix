import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCalendarStore } from '../../../stores/useCalendarStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useAggregatedEvents } from '../hooks/useAggregatedEvents';
import { motion, AnimatePresence } from 'framer-motion';

import { CalendarViewSwitcher } from './CalendarViewSwitcher';
import { DayView } from './views/DayView';
import { WeekView } from './views/WeekView';
import { MonthView } from './views/MonthView';
import { YearView } from './views/YearView';
import {
  toDateStr,
  formatLongDate,
  addDays,
  getWeekDates,
} from './views/helpers';

const LEGEND = [
  { color: 'bg-blue-500',    label: 'Projetos' },
  { color: 'bg-purple-500',  label: 'Revisões' },
  { color: 'bg-emerald-500', label: 'Receitas' },
  { color: 'bg-red-500',     label: 'Saídas' },
  { color: 'bg-amber-500',   label: 'Pendências' },
  { color: 'bg-pink-500',    label: 'Manuais' },
];

export function UniversalCalendarView() {
  const addEvent = useCalendarStore((s) => s.addEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const toggleEventDone = useCalendarStore((s) => s.toggleEventDone);
  const getDailyNote = useCalendarStore((s) => s.getDailyNote);
  const saveDailyNote = useCalendarStore((s) => s.saveDailyNote);

  const updateTaskStatus = useProjectStore((s) => s.updateTaskStatus);
  const completeRevision = useRevisionStore((s) => s.completeRevision);

  const [searchParams] = useSearchParams();

  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => toDateStr(new Date()));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualType, setManualType] = useState('compromisso');
  const [noteContent, setNoteContent] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Aggregate all events
  const allEvents = useAggregatedEvents();

  const eventsByDate = useMemo(() => {
    const map = {};
    allEvents.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [allEvents]);

  // Open drawer for a given day (from dashboard Timeline or ?day= param)
  const openDayDrawer = (dateStr, note) => {
    setSelectedDateStr(dateStr);
    setIsDrawerOpen(true);
    const savedNote = note || getDailyNote(dateStr);
    setNoteContent(savedNote?.content || '');
    setIsEditingNote(false);
  };

  // Read ?day=YYYY-MM-DD from URL on mount (Dashboard timeline → calendar)
  useEffect(() => {
    const dayParam = searchParams.get('day');
    if (dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam)) {
      setSelectedDateStr(dayParam);
      setCurrentDate(new Date(dayParam + 'T12:00:00'));
      setIsDrawerOpen(true);
      const savedNote = getDailyNote(dayParam);
      setNoteContent(savedNote?.content || '');
      setIsEditingNote(false);
    }
  }, []);

  const handleSelectDay = (dateStr) => openDayDrawer(dateStr);

  const handleGoToMonth = (m) => {
    setCurrentDate(new Date(year, m, 1));
    setView('month');
  };

  // Navigation helpers per view
  const handlePrev = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    else if (view === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else setCurrentDate(new Date(year - 1, 0, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else if (view === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else setCurrentDate(new Date(year + 1, 0, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(toDateStr(today));
    setView('month');
  };

  // Period label for header
  const periodLabel = useMemo(() => {
    if (view === 'day') return formatLongDate(selectedDateStr);
    if (view === 'week') {
      const weekStart = getWeekDates(currentDate)[0];
      const weekEnd = getWeekDates(currentDate)[6];
      return `${weekStart.getDate()} – ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`;
    }
    if (view === 'month') {
      return currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    }
    return String(year);
  }, [view, selectedDateStr, currentDate, year]);

  const selectedDayEvents = eventsByDate[selectedDateStr] || [];

  const groupedSelectedEvents = useMemo(() => {
    const groups = {
      revisoes:    { label: '🧠 Revisões de Estudo', items: [] },
      tarefas:     { label: '📋 Tarefas & Projetos', items: [] },
      financeiro:  { label: '💰 Finanças & Vencimentos', items: [] },
      compromissos:{ label: '📅 Compromissos Manuais', items: [] },
    };
    selectedDayEvents.forEach((evt) => {
      if (evt.origin === 'study') groups.revisoes.items.push(evt);
      else if (evt.origin === 'project') groups.tarefas.items.push(evt);
      else if (evt.origin === 'finance') groups.financeiro.items.push(evt);
      else groups.compromissos.items.push(evt);
    });
    return Object.entries(groups).filter(([_, group]) => group.items.length > 0);
  }, [selectedDayEvents]);

  const handleAddManualEvent = (e) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    addEvent({ title: manualTitle, time: manualTime, type: manualType, date: selectedDateStr });
    setManualTitle('');
    setManualTime('');
    setShowAddManualModal(false);
  };

  const handleToggleEvent = (evt) => {
    if (evt.origin === 'manual') toggleEventDone(evt.id);
    else if (evt.origin === 'project') updateTaskStatus(null, null, evt.id, evt.completed ? 'todo' : 'done');
    else if (evt.origin === 'study' && !evt.completed) completeRevision(evt.id, 3);
  };

  const handleSaveNote = () => {
    saveDailyNote(selectedDateStr, noteContent);
    setIsEditingNote(false);
  };

  const todayStr = toDateStr(new Date());

  return (
    <div id="universal-calendar-view" className="space-y-5">
      {/* ── Calendar Header ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-surface border border-border p-4 rounded-3xl shadow-lg">
        {/* Title + period */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🗓️</span>
            <div>
              <h2 className="text-base md:text-lg font-black text-white capitalize leading-tight">{periodLabel}</h2>
              <p className="text-[10px] text-text-dim">
                {view === 'day' ? 'Visão do dia' : view === 'week' ? 'Visão semanal' : view === 'month' ? 'Visão mensal' : 'Visão anual'}
              </p>
            </div>
          </div>
          <div className="lg:hidden">
            <CalendarViewSwitcher view={view} onChange={setView} />
          </div>
        </div>

        {/* Navigation + view switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1 lg:flex-none">
            <button onClick={handlePrev}
              className="px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-white/10 text-white rounded-xl text-sm transition-all">
              ◀
            </button>
            <button onClick={handleGoToToday}
              className="px-4 py-2 bg-primary text-black font-extrabold rounded-xl text-sm hover:opacity-90 transition-all shadow-md shadow-primary/15 flex-1 lg:flex-none">
              Hoje
            </button>
            <button onClick={handleNext}
              className="px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-white/10 text-white rounded-xl text-sm transition-all">
              ▶
            </button>
          </div>
          <div className="hidden lg:block">
            <CalendarViewSwitcher view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {/* Legend — collapsed by default, expandable */}
      <div className="bg-surface border border-border rounded-2xl p-3 shadow-lg">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="w-full flex items-center justify-between text-xs font-bold text-text-muted"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm">🎨</span> Legenda de Atividades
          </span>
          <span className="text-[10px] text-text-dim">{showLegend ? '▲ Recolher' : '▼ Expandir'}</span>
        </button>
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-2 pt-3 mt-2 border-t border-white/5">
                {LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-[11px] text-text-dim">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Active View ── */}
      <div>
        {view === 'day' && (
          <DayView dateStr={selectedDateStr} eventsByDate={eventsByDate} />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            selectedDateStr={selectedDateStr}
            onSelectDay={handleSelectDay}
          />
        )}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            selectedDateStr={selectedDateStr}
            onSelectDay={handleSelectDay}
          />
        )}
        {view === 'year' && (
          <YearView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onSelectDay={(ds) => {
              setSelectedDateStr(ds);
              setView('day');
            }}
            onGoToMonth={handleGoToMonth}
          />
        )}
      </div>

      {/* ── Drawer Panel: Daily Routine ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-border-strong z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                      Rotina Diária
                    </span>
                    <h3 className="text-base font-black text-white mt-1 capitalize">
                      {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-PT', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </h3>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-dim hover:text-white transition-all text-sm">
                    ✕
                  </button>
                </div>

                {/* Daily Note */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-muted flex items-center gap-1">📓 Notas do Dia</span>
                    {!isEditingNote ? (
                      <button onClick={() => setIsEditingNote(true)} className="text-[10px] text-primary hover:underline">
                        {noteContent ? 'Editar' : 'Criar Nota'}
                      </button>
                    ) : (
                      <button onClick={handleSaveNote} className="text-[10px] text-emerald-400 hover:underline font-bold">Salvar</button>
                    )}
                  </div>
                  {isEditingNote ? (
                    <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Alguma anotação importante ou diário deste dia..."
                      className="w-full text-xs bg-slate-900 border border-border rounded-xl p-2.5 text-white outline-none focus:border-primary/40 min-h-[80px]" />
                  ) : (
                    <p className="text-xs text-text-dim italic">{noteContent || 'Nenhuma nota registrada para hoje.'}</p>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-text-dim uppercase tracking-wider">Atividades Agendadas</h4>
                    <button onClick={() => setShowAddManualModal(true)}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-white px-2.5 py-1 rounded-xl transition-all">
                      + Novo Evento
                    </button>
                  </div>
                  {groupedSelectedEvents.length === 0 ? (
                    <div className="text-center py-12 bg-white/[0.01] border border-white/5 border-dashed rounded-2xl">
                      <span className="text-3xl block">⛱️</span>
                      <p className="text-xs text-text-muted mt-2">Sem tarefas ou atividades para este dia.</p>
                      <p className="text-[10px] text-text-dim mt-1 max-w-[200px] mx-auto">
                        Aproveite para descansar ou adicione um compromisso manual.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedSelectedEvents.map(([key, group]) => (
                        <div key={key} className="space-y-2">
                          <h5 className="text-[11px] font-black text-text-dim bg-white/[0.03] px-3 py-1 rounded-lg inline-block border border-white/5">
                            {group.label}
                          </h5>
                          <div className="space-y-2 pl-1">
                            {group.items.map((evt) => (
                              <div key={evt.id}
                                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                                  evt.completed ? 'bg-white/[0.01] border-white/5 opacity-55' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                }`}>
                                <button onClick={() => handleToggleEvent(evt)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
                                    evt.completed ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/20 hover:border-white/40'
                                  }`}>
                                  {evt.completed && '✓'}
                                </button>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`text-xs font-bold text-white truncate ${evt.completed ? 'line-through text-text-dim' : ''}`}>{evt.title}</p>
                                    {evt.time && (
                                      <span className="text-[9px] bg-white/5 text-text-dim px-1.5 py-0.5 rounded font-mono">{evt.time}</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-text-dim leading-relaxed">{evt.description}</p>
                                  {evt.origin === 'manual' && (
                                    <button onClick={() => deleteEvent(evt.id)}
                                      className="text-[9px] text-red-400/70 hover:text-red-400 font-mono pt-1">Remover Compromisso</button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6">
                <button onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl text-xs transition-all text-center">
                  Fechar Painel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add Manual Event Modal ── */}
      <AnimatePresence>
        {showAddManualModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddManualModal(false)} className="absolute inset-0 bg-black" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-border rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div>
                <h4 className="text-sm font-black text-white">Criar Compromisso Manual</h4>
                <p className="text-xs text-text-dim">Agende um evento simples no dia {selectedDateStr}</p>
              </div>
              <form onSubmit={handleAddManualEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Título do Evento</label>
                  <input type="text" required value={manualTitle} onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Ex: Consulta médica, Reunião importante"
                    className="w-full text-xs bg-black/40 border border-border rounded-xl p-3 text-white outline-none focus:border-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Horário (Opcional)</label>
                    <input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)}
                      className="w-full text-xs bg-black/40 border border-border rounded-xl p-3 text-white outline-none focus:border-primary/40" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Categoria</label>
                    <select value={manualType} onChange={(e) => setManualType(e.target.value)}
                      className="w-full text-xs bg-black/40 border border-border rounded-xl p-3 text-white outline-none focus:border-primary/40">
                      <option value="compromisso">📅 Compromisso</option>
                      <option value="prova">📝 Prova / Teste</option>
                      <option value="treino">🏃 Treino</option>
                      <option value="outro">✨ Outros</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddManualModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all">Cancelar</button>
                  <button type="submit"
                    className="flex-1 py-3 bg-primary text-black text-xs font-black rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/10">Adicionar Evento</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UniversalCalendarView;