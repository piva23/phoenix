import React, { useState, useMemo, useRef, useEffect } from 'react';
import { formatDateBR } from '../../../shared/utils/time';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import toast from 'react-hot-toast';

// Configuração de Pixels por Dia para o Zoom
const ZOOM_LEVELS = {
  day: { label: 'Dia', ppd: 45 }, // 45px por dia
  week: { label: 'Semana', ppd: 12 }, // 12px por dia
  month: { label: 'Mês', ppd: 4 }, // 4px por dia
  year: { label: 'Ano', ppd: 0.8 }, // 0.8px por dia (Visão de Pássaro)
};

export function GanttView({ project }) {
  const [zoom, setZoom] = useState('month');
  const scrollRef = useRef(null);

  // Recupera as informações da Persona ativa
  const getActivePersona = usePersonaStore(s => s.getActivePersona);
  const activePersona = getActivePersona();
  const personaColor = activePersona?.colorPrimary || '#7C3AED';

  // Estados para o Drag-to-Scroll (Arrastar com o mouse)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Se não houver data de início ou fim, pede configuração
  if (!project.dataInicio || !project.dataFim) {
    return (
      <div
        className="rounded-2xl p-10 text-center border select-none"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="text-4xl mb-4 opacity-50">📅</div>
        <h3 className="text-lg font-bold text-text-main mb-2">
          Defina os Prazos do Projeto
        </h3>
        <p className="text-sm text-text-dim max-w-md mx-auto">
          Para visualizar o Gráfico de Gantt, você precisa definir a Data de
          Início e o Prazo Final editando o projeto.
        </p>
      </div>
    );
  }

  const projectCor = project.cor || 'var(--primary)';
  const msPerDay = 1000 * 60 * 60 * 24;

  // Força meia-noite para evitar bugs de fuso horário
  const startMs = new Date(project.dataInicio + 'T00:00:00').getTime();
  const endMs = new Date(project.dataFim + 'T00:00:00').getTime();
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / msPerDay));

  const ppd = ZOOM_LEVELS[zoom].ppd;
  const totalWidthPx = totalDays * ppd;

  // Calcula posição de HOJE
  const todayMs = new Date().getTime();
  const isTodayInRange = todayMs >= startMs && todayMs <= endMs;
  // Se hoje estiver antes do projeto, fixa no início. Se depois, no fim.
  const todayLeftPx = Math.max(
    0,
    Math.min(((todayMs - startMs) / msPerDay) * ppd, totalWidthPx)
  );

  // Função para centralizar no HOJE
  const scrollToToday = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const centerPosition = todayLeftPx - container.clientWidth / 2;
    container.scrollTo({ left: centerPosition, behavior: 'smooth' });
  };

  // Auto-foco no Hoje sempre que montar o componente ou mudar o zoom
  useEffect(() => {
    const timer = setTimeout(scrollToToday, 150);
    return () => clearTimeout(timer);
  }, [zoom]);

  // Funções do Drag-to-Scroll
  const handleMouseDown = e => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = e => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Velocidade do arraste
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Função matemática absoluta: converte data em posição na tela
  const getStyle = (itemStart, itemEnd) => {
    if (!itemStart || !itemEnd) return { display: 'none' };
    const s = Math.max(startMs, new Date(itemStart + 'T00:00:00').getTime());
    const e = Math.min(endMs, new Date(itemEnd + 'T00:00:00').getTime());

    if (e < s) return { display: 'none' };

    const leftPx = ((s - startMs) / msPerDay) * ppd;
    const widthPx = Math.max(ppd, ((e - s) / msPerDay) * ppd); // Mínimo de 1 dia de largura

    return { left: `${leftPx}px`, width: `${widthPx}px` };
  };

  // Gerador da Régua Superior baseado no Zoom
  const ticks = useMemo(() => {
    const markers = [];
    let currentMs = startMs;

    while (currentMs <= endMs) {
      const date = new Date(currentMs);
      const leftPx = ((currentMs - startMs) / msPerDay) * ppd;

      if (zoom === 'year' && date.getMonth() === 0 && date.getDate() === 1) {
        // 1º de Janeiro
        markers.push({ left: leftPx, label: date.getFullYear().toString() });
      } else if (zoom === 'month' && date.getDate() === 1) {
        // 1º dia do Mês
        markers.push({
          left: leftPx,
          label: date.toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit',
          }),
        });
      } else if (zoom === 'week' && date.getDay() === 0) {
        // Domingo
        markers.push({
          left: leftPx,
          label: date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
        });
      } else if (zoom === 'day') {
        // Todos os dias
        markers.push({ left: leftPx, label: date.getDate().toString() });
      }
      currentMs += msPerDay;
    }
    return markers;
  }, [startMs, endMs, zoom, ppd]);

  const objetivos = project.objetivos || [];

  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden select-none"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        '--color-primary': personaColor // Injects active persona color globally in local scope
      }}
    >
      {/* Injeta CSS para esconder a scrollbar horizontal nativa em dispositivos */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* HEADER: Controles de Zoom e Foco */}
      <div
        className="flex items-center justify-between p-3 border-b flex-wrap gap-2"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-surface-2)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-text-main flex items-center gap-2">
            <span>📅</span> Cronograma
          </span>
          {/* Botão de Focar no Hoje */}
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80 outline-none"
            style={{
              background: 'rgba(239,68,68,0.15)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Hoje
          </button>
        </div>

        {/* Seletores de Zoom */}
        <div
          className="flex bg-[var(--bg-surface)] rounded-lg p-1 border"
          style={{ borderColor: 'var(--border)' }}
        >
          {Object.entries(ZOOM_LEVELS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setZoom(key)}
              className="px-3 py-1 text-xs font-semibold rounded transition-all outline-none"
              style={{
                background: zoom === key ? 'var(--color-primary)' : 'transparent',
                color: zoom === key ? '#fff' : 'var(--text-muted)',
              }}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE SCROLL DO GANTT (Com Drag-to-Scroll horizontal suave e sem scrollbar visível) */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`overflow-x-auto overflow-y-hidden relative scrollbar-hide bg-[var(--bg-surface)] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } scroll-smooth`}
      >
        {/* Adiciona folga de padding nas laterais */}
        <div
          className="relative pb-10 px-8"
          style={{
            width: `${Math.max(totalWidthPx + 150, 800)}px`,
            minHeight: '360px',
          }}
        >
          {/* Timeline Ticks (Régua) */}
          <div
            className="h-8 border-b sticky top-0 z-20 pointer-events-none"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-surface-2)',
            }}
          >
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute h-full border-l pl-1 text-[10px] font-bold text-text-dim flex items-end pb-1 uppercase tracking-wide"
                style={{ left: `${t.left}px`, borderColor: 'var(--border)' }}
              >
                {t.label}
              </div>
            ))}
          </div>

          {/* Grid de Fundo Vertical */}
          <div className="absolute top-8 bottom-0 left-0 right-0 pointer-events-none z-0">
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-dashed opacity-5"
                style={{
                  left: `${t.left}px`,
                  borderColor: 'var(--text-muted)',
                }}
              />
            ))}
          </div>

          {/* Marcador de HOJE com destaque Glow dinâmico reativo à Persona ativa */}
          <div
            className="absolute top-8 bottom-0 w-[2px] z-10 pointer-events-none transition-all duration-300"
            style={{
              left: `${todayLeftPx}px`,
              background: 'var(--color-primary)',
              boxShadow: `0 0 10px 2px var(--color-primary), 0 0 4px 1px var(--color-primary)`
            }}
          >
            <div
              className="text-white text-[8px] font-bold px-2 py-0.5 rounded-b absolute -left-[14px] shadow-md transition-all duration-300"
              style={{ background: 'var(--color-primary)' }}
            >
              HOJE
            </div>
          </div>

          {/* BARRAS DO GANTT */}
          <div className="pt-6 space-y-8 z-10 relative pointer-events-none">
            {objetivos.map(obj => {
              const objStyle = getStyle(
                obj.dataInicio || project.dataInicio,
                obj.dataFim || project.dataFim
              );
              const tasks = (obj.tasks || []).filter(
                t => t.dataInicio && t.dataFim
              );

              return (
                <div key={obj.id} className="relative">
                  {/* Barra do Objetivo (Agrupador) */}
                  <div
                    className="relative h-6 mb-2 rounded-md flex items-center shadow-sm pointer-events-auto transition-all"
                    style={{
                      ...objStyle,
                      background: `${projectCor}18`,
                      border: `1px solid ${projectCor}33`,
                    }}
                  >
                    <div
                      className="sticky left-2 text-[10px] font-bold uppercase tracking-wider px-2 truncate"
                      style={{ color: projectCor }}
                    >
                      {obj.titulo || obj.nome}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 mt-2">
                    {tasks.map(task => {
                      const tStyle = getStyle(task.dataInicio, task.dataFim);
                      const isDone = task.status === 'done';
                      const isNarrow = parseInt(tStyle.width) < 60; // Se a barra for muito fina

                      return (
                        <div
                          key={task.id}
                          className="relative h-7 flex items-center group pointer-events-auto cursor-pointer"
                          onClick={e => {
                            if (!isDragging) {
                              toast(
                                `Task: ${task.title || task.titulo || task.nome}\nPrazo: ${formatDateBR(task.dataFim)}`,
                                { icon: isDone ? '✅' : '⏳' }
                              );
                            }
                          }}
                        >
                          <div
                            className="absolute h-5 flex items-center rounded transition-all shadow-sm group-hover:scale-[1.02]"
                            style={{
                              ...tStyle,
                              background: isDone
                                ? '#10B981'
                                : task.milestone
                                  ? '#F59E0B'
                                  : 'var(--bg-surface-2)',
                              border: `1px solid ${isDone ? '#059669' : task.milestone ? '#D97706' : 'var(--border-strong)'}`,
                              borderRadius: task.milestone
                                ? '4px 12px 12px 4px'
                                : '6px',
                              opacity: isDone ? 0.7 : 1,
                            }}
                          >
                            {task.milestone && (
                              <span className="absolute -right-2 text-white text-[10px] drop-shadow-md z-10">
                                ◆
                              </span>
                            )}

                            {/* Label Interno */}
                            {!isNarrow && (
                              <span
                                className="text-[10px] font-medium truncate px-2 select-none"
                                style={{
                                  color:
                                    isDone || task.milestone
                                      ? '#fff'
                                      : 'var(--text-main)',
                                }}
                              >
                                {task.title || task.titulo || task.nome}
                              </span>
                            )}
                          </div>

                          {/* Label Externo (para barras espremidas) */}
                          {isNarrow && (
                            <div
                              className="absolute text-[10px] font-medium whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity pl-2 select-none"
                              style={{
                                left: `calc(${tStyle.left} + ${tStyle.width})`,
                                color: 'var(--text-main)',
                              }}
                            >
                              {task.title || task.titulo || task.nome}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER: Legenda */}
      <div
        className="border-t p-3 flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase font-bold text-text-muted"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-surface-2)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded"
            style={{
              background: projectCor + '33',
              border: `1px solid ${projectCor}`,
            }}
          />
          Objetivo
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[var(--bg-surface-2)] border border-[var(--border-strong)]" />
          Pendente
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" /> Concluída
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-r-full bg-amber-500 flex items-center justify-center">
            <span className="text-white text-[6px]">◆</span>
          </div>
          Milestone
        </div>
      </div>
    </div>
  );
}
