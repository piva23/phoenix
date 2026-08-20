import React, { useState, useMemo } from 'react';
import { useCalendarStore } from '../../../stores/useCalendarStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useFinanceStore } from '../../../stores/useFinanceStore';
import { useRevisionStore } from '../../../stores/useRevisionStore';
import { useAggregatedEvents } from '../hooks/useAggregatedEvents';
import { motion, AnimatePresence } from 'framer-motion';

export function UniversalCalendarView() {
  const addEvent = useCalendarStore((s) => s.addEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const toggleEventDone = useCalendarStore((s) => s.toggleEventDone);
  const getDailyNote = useCalendarStore((s) => s.getDailyNote);
  const saveDailyNote = useCalendarStore((s) => s.saveDailyNote);

  const updateTaskStatus = useProjectStore((s) => s.updateTaskStatus);
  const revisions = useRevisionStore((s) => s.revisions);
  const completeRevision = useRevisionStore((s) => s.completeRevision);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualType, setManualType] = useState('compromisso');
  const [noteContent, setNoteContent] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Year and Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Aggregate all events
  const allEvents = useAggregatedEvents();

  // Map of events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = {};
    allEvents.forEach((evt) => {
      if (!map[evt.date]) {
        map[evt.date] = [];
      }
      map[evt.date].push(evt);
    });
    return map;
  }, [allEvents]);

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      cells.push({
        day: prevDay,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month padding days to reach multiple of 7
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  // Handle month changes
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Select day
  const handleSelectDay = (dateStr) => {
    setSelectedDateStr(dateStr);
    setIsDrawerOpen(true);
    const savedNote = getDailyNote(dateStr);
    setNoteContent(savedNote?.content || '');
    setIsEditingNote(false);
  };

  // Add a manual event
  const handleAddManualEvent = (e) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    addEvent({
      title: manualTitle,
      time: manualTime,
      type: manualType,
      date: selectedDateStr,
    });
    setManualTitle('');
    setManualTime('');
    setShowAddManualModal(false);
  };

  // Toggle custom interactive complete buttons
  const handleToggleEvent = (evt) => {
    if (evt.origin === 'manual') {
      toggleEventDone(evt.id);
    } else if (evt.origin === 'project') {
      const newStatus = evt.completed ? 'todo' : 'done';
      updateTaskStatus(null, null, evt.id, newStatus);
    } else if (evt.origin === 'study') {
      if (!evt.completed) {
        // Complete with average score of 3
        completeRevision(evt.id, 3);
      }
    }
  };

  // Save Daily Note
  const handleSaveNote = () => {
    saveDailyNote(selectedDateStr, noteContent);
    setIsEditingNote(false);
  };

  // Filter events for the currently selected day
  const selectedDayEvents = eventsByDate[selectedDateStr] || [];

  // Group events by ATIVIDADE -> TASK
  const groupedSelectedEvents = useMemo(() => {
    const groups = {
      revisoes: { label: '🧠 Revisões de Estudo', items: [] },
      tarefas: { label: '📋 Tarefas & Projetos', items: [] },
      financeiro: { label: '💰 Finanças & Vencimentos', items: [] },
      compromissos: { label: '📅 Compromissos Manuais', items: [] },
    };

    selectedDayEvents.forEach((evt) => {
      if (evt.origin === 'study') {
        groups.revisoes.items.push(evt);
      } else if (evt.origin === 'project') {
        groups.tarefas.items.push(evt);
      } else if (evt.origin === 'finance') {
        groups.financeiro.items.push(evt);
      } else {
        groups.compromissos.items.push(evt);
      }
    });

    return Object.entries(groups).filter(([_, group]) => group.items.length > 0);
  }, [selectedDayEvents]);

  // Format month name header
  const monthLabel = currentDate.toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  });

  // Agenda View: get all days in the current month with at least one event
  const agendaDays = useMemo(() => {
    const days = [];
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (eventsByDate[dStr] && eventsByDate[dStr].length > 0) {
        days.push({
          dateStr: dStr,
          dayNum: d,
          events: eventsByDate[dStr],
        });
      }
    }
    return days;
  }, [year, month, eventsByDate]);

  return (
    <div id="universal-calendar-view" className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border p-4 rounded-3xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗓️</span>
          <div>
            <h2 className="text-lg font-black text-white capitalize">{monthLabel}</h2>
            <p className="text-xs text-text-dim">Calendário Universal Consolidado</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrevMonth}
            className="flex-1 sm:flex-none px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-white/10 text-white rounded-xl text-sm transition-all"
          >
            ◀ Mês Anterior
          </button>
          <button
            onClick={handleGoToToday}
            className="px-4 py-2 bg-primary text-black font-extrabold rounded-xl text-sm hover:opacity-90 transition-all shadow-md shadow-primary/15"
          >
            Hoje
          </button>
          <button
            onClick={handleNextMonth}
            className="flex-1 sm:flex-none px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-white/10 text-white rounded-xl text-sm transition-all"
          >
            Mês Seguinte ▶
          </button>
        </div>
      </div>

      {/* Grid view for Desktop / Agenda view for Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop View: Monthly Grid */}
        <div className="hidden md:block lg:col-span-4 bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-4 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, index) => (
              <span
                key={index}
                className="text-xs font-bold text-text-dim uppercase tracking-wider py-1 border-b border-border-strong/40"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Monthly grid days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => {
              const dayEventsList = eventsByDate[cell.dateStr] || [];
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={`min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    cell.isCurrentMonth
                      ? 'bg-white/[0.01] border-white/5 hover:border-primary/20 hover:bg-white/[0.02]'
                      : 'bg-black/10 border-transparent opacity-30'
                  } ${isSelected ? 'border-primary/40 bg-primary/[0.03] ring-1 ring-primary/25' : ''} ${
                    isToday ? 'border-amber-500/30 shadow-md shadow-amber-500/5' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        isToday
                          ? 'bg-amber-500 text-black'
                          : isSelected
                          ? 'bg-primary/20 text-primary'
                          : 'text-text-muted group-hover:text-white'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayEventsList.length > 0 && (
                      <span className="text-[10px] text-text-dim bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">
                        {dayEventsList.length}
                      </span>
                    )}
                  </div>

                  {/* List of micro tags */}
                  <div className="flex-1 space-y-1 overflow-hidden mt-1.5 max-h-[70px]">
                    {dayEventsList.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        className="text-[9px] px-1.5 py-0.5 rounded truncate border leading-none flex items-center gap-1 transition-all"
                        style={{
                          backgroundColor: `${evt.color}15`,
                          color: evt.color,
                          borderColor: `${evt.color}30`,
                        }}
                        title={evt.title}
                      >
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
                        <span className={`truncate ${evt.completed ? 'line-through opacity-55' : ''}`}>
                          {evt.title}
                        </span>
                      </div>
                    ))}
                    {dayEventsList.length > 3 && (
                      <div className="text-[8px] text-text-dim font-bold text-center pt-0.5">
                        +{dayEventsList.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View: Agenda View */}
        <div className="block md:hidden lg:col-span-4 space-y-4">
          <div className="bg-surface border border-border rounded-3xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
              📅 Agenda deste Mês
            </h3>

            {agendaDays.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-3xl">🏜️</span>
                <p className="text-xs text-text-dim mt-2">Nenhum evento registrado para este mês.</p>
                <button
                  onClick={() => handleSelectDay(new Date().toISOString().split('T')[0])}
                  className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white"
                >
                  Ver dia de hoje
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {agendaDays.map((agendaDay) => {
                  const dateObj = new Date(agendaDay.dateStr);
                  const isToday = agendaDay.dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={agendaDay.dateStr}
                      onClick={() => handleSelectDay(agendaDay.dateStr)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 bg-white/[0.01] hover:bg-white/[0.02] ${
                        isToday ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-white/5'
                      }`}
                    >
                      <div className="text-center flex-shrink-0 bg-white/[0.03] border border-white/5 p-2 rounded-xl min-w-[50px]">
                        <span className="block text-lg font-black text-white leading-none">
                          {agendaDay.dayNum}
                        </span>
                        <span className="text-[9px] text-text-dim uppercase tracking-wider">
                          {dateObj.toLocaleDateString('pt-PT', { weekday: 'short' })}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {agendaDay.events.map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center gap-2 text-xs text-white"
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: evt.color }}
                            />
                            <p className={`truncate flex-1 font-medium ${evt.completed ? 'line-through opacity-50' : ''}`}>
                              {evt.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Panel: Daily Routine (ATIVIDADE -> TASK) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-border-strong z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                      Rotina Diária
                    </span>
                    <h3 className="text-base font-black text-white mt-1">
                      {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-PT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-dim hover:text-white transition-all text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Daily Note Area */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-muted flex items-center gap-1">
                      📓 Notas do Dia
                    </span>
                    {!isEditingNote ? (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        {noteContent ? 'Editar' : 'Criar Nota'}
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveNote}
                        className="text-[10px] text-emerald-400 hover:underline font-bold"
                      >
                        Salvar
                      </button>
                    )}
                  </div>

                  {isEditingNote ? (
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Alguma anotação importante ou diário deste dia..."
                      className="w-full text-xs bg-slate-900 border border-border rounded-xl p-2.5 text-white outline-none focus:border-primary/40 min-h-[80px]"
                    />
                  ) : (
                    <p className="text-xs text-text-dim italic">
                      {noteContent || 'Nenhuma nota registrada para hoje.'}
                    </p>
                  )}
                </div>

                {/* ATIVIDADE -> TASK list */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-text-dim uppercase tracking-wider">
                      Atividades Agendadas
                    </h4>
                    <button
                      onClick={() => setShowAddManualModal(true)}
                      className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-white px-2.5 py-1 rounded-xl transition-all"
                    >
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
                              <div
                                key={evt.id}
                                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                                  evt.completed
                                    ? 'bg-white/[0.01] border-white/5 opacity-55'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                }`}
                              >
                                {/* Checkbox for interactable ones */}
                                <button
                                  onClick={() => handleToggleEvent(evt)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
                                    evt.completed
                                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                      : 'border-white/20 hover:border-white/40'
                                  }`}
                                >
                                  {evt.completed && '✓'}
                                </button>

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <p
                                      className={`text-xs font-bold text-white truncate ${
                                        evt.completed ? 'line-through text-text-dim' : ''
                                      }`}
                                    >
                                      {evt.title}
                                    </p>
                                    {evt.time && (
                                      <span className="text-[9px] bg-white/5 text-text-dim px-1.5 py-0.5 rounded font-mono">
                                        {evt.time}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-text-dim leading-relaxed">
                                    {evt.description}
                                  </p>

                                  {/* Delete manual action */}
                                  {evt.origin === 'manual' && (
                                    <button
                                      onClick={() => deleteEvent(evt.id)}
                                      className="text-[9px] text-red-400/70 hover:text-red-400 font-mono pt-1"
                                    >
                                      Remover Compromisso
                                    </button>
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

              {/* Bottom footer */}
              <div className="border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl text-xs transition-all text-center"
                >
                  Fechar Painel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Manual Event Modal */}
      <AnimatePresence>
        {showAddManualModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddManualModal(false)}
              className="absolute inset-0 bg-black"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-border rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div>
                <h4 className="text-sm font-black text-white">Criar Compromisso Manual</h4>
                <p className="text-xs text-text-dim">Agende um evento simples no dia {selectedDateStr}</p>
              </div>

              <form onSubmit={handleAddManualEvent} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                    Título do Evento
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Ex: Consulta médica, Reunião importante"
                    className="w-full text-xs bg-black/40 border border-border rounded-xl p-3 text-white outline-none focus:border-primary/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                      Horário (Opcional)
                    </label>
                    <input
                      type="time"
                      value={manualTime}
                      onChange={(e) => setManualTime(e.target.value)}
                      className="w-full text-xs bg-black/40 border border-border rounded-xl p-3 text-white outline-none focus:border-primary/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                      Categoria
                    </label>
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className="w-full text-xs bg-black/40 border border-border rounded-xl p-3 text-white outline-none focus:border-primary/40"
                    >
                      <option value="compromisso">📅 Compromisso</option>
                      <option value="prova">📝 Prova / Teste</option>
                      <option value="treino">🏃 Treino</option>
                      <option value="outro">✨ Outros</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddManualModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-black text-xs font-black rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/10"
                  >
                    Adicionar Evento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
