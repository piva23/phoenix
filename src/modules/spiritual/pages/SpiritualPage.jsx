import { useState } from 'react'
import { useSpiritualStore } from '../../../stores/useSpiritualStore'
import { MorningRitual } from '../components/MorningRitual'
import { NightRitual } from '../components/NightRitual'
import { QuotesTab } from '../components/QuotesTab'
import { SpiritualAnalytics } from '../components/SpiritualAnalytics'

const ACCENT = '#A855F7'
const today = () => new Date().toISOString().split('T')[0]

export function SpiritualPage() {
  const { getRitual, getStreaks } = useSpiritualStore()
  const [view, setView]   = useState('home') // home | morning | night
  const [tab, setTab]     = useState('home') // home | quotes | analytics

  const date          = today()
  const morningDone   = !!getRitual(date, 'morning')?.completedAt
  const nightDone     = !!getRitual(date, 'night')?.completedAt
  const streaks       = getStreaks()
  const morning       = getRitual(date, 'morning')
  const tasks         = morning?.tasks?.filter(t => t.text.trim()) || []
  const tasksDone     = tasks.filter(t => t.done).length

  if (view === 'morning') return (
    <MorningRitual
      onClose={() => setView('home')}
      onComplete={() => setView('home')} />
  )

  if (view === 'night') return (
    <NightRitual
      onClose={() => setView('home')}
      onComplete={() => setView('home')} />
  )

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Rituais</h1>
            <p className="text-xs text-text-dim mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-3xl">🕯️</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--bg-surface)' }}>
          {[
            { id: 'home',      label: '🏠 Hoje'      },
            { id: 'quotes',    label: '📿 Citações'  },
            { id: 'analytics', label: '📊 Analytics' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: tab === t.id ? ACCENT : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-muted)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-4">

        {/* ── HOME ── */}
        {tab === 'home' && (
          <>
            {/* Streaks rápidos */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Manhã',    value: streaks.morning,    color: '#F59E0B', icon: '🌅' },
                { label: 'Noite',    value: streaks.night,      color: '#6366F1', icon: '🌙' },
                { label: 'Meditação',value: streaks.meditation, color: ACCENT,    icon: '🧘' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3 text-center"
                  style={{ background: 'var(--bg-surface)', border: `1px solid ${s.color}33` }}>
                  <div className="text-lg">{s.icon}</div>
                  <div className="text-xl font-bold mt-1" style={{ color: s.color }}>🔥 {s.value}</div>
                  <div className="text-xs text-text-dim">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Ritual da Manhã */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: `1px solid ${morningDone ? '#10B98133' : '#F59E0B33'}` }}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🌅</span>
                      <h2 className="font-bold text-text-main">Ritual da Manhã</h2>
                      {morningDone && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: '#10B98122', color: '#10B981' }}>
                          ✓ Feito
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-dim">Intenção · Gratidão · Tarefas · Energia</p>
                  </div>
                  <button onClick={() => setView('morning')}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: morningDone ? '#10B981' : '#F59E0B' }}>
                    {morningDone ? '✎ Revisar' : '▶ Iniciar'}
                  </button>
                </div>

                {/* Preview do ritual da manhã se preenchido */}
                {morning && (
                  <div className="space-y-2">
                    {morning.intention && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm">🎯</span>
                        <p className="text-sm text-text-muted italic">"{morning.intention}"</p>
                      </div>
                    )}
                    {tasks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs text-text-dim">Tarefas:</span>
                          <span className="text-xs font-bold"
                            style={{ color: tasksDone === tasks.length ? '#10B981' : '#F59E0B' }}>
                            {tasksDone}/{tasks.length}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {tasks.map((task, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                                style={{ background: task.done ? '#10B981' : 'var(--bg-surface-2)', border: `1px solid ${task.done ? '#10B981' : 'var(--border)'}` }}>
                                {task.done && <span className="text-white text-[8px]">✓</span>}
                              </div>
                              <span className="text-xs" style={{ color: task.done ? 'var(--text-dim)' : 'var(--text-muted)', textDecoration: task.done ? 'line-through' : 'none' }}>
                                {task.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ritual da Noite */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: `1px solid ${nightDone ? '#10B98133' : '#6366F133'}` }}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🌙</span>
                      <h2 className="font-bold text-text-main">Ritual da Noite</h2>
                      {nightDone && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: '#10B98122', color: '#10B981' }}>
                          ✓ Feito
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-dim">Revisão · Reflexão · Amanhã · Energia</p>
                  </div>
                  <button onClick={() => setView('night')}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                    style={{ background: nightDone ? '#10B981' : '#6366F1' }}>
                    {nightDone ? '✎ Revisar' : '▶ Iniciar'}
                  </button>
                </div>

                {!morningDone && !nightDone && (
                  <p className="text-xs text-text-dim mt-2">
                    💡 Complete o ritual da manhã primeiro para revisar as tarefas aqui.
                  </p>
                )}
              </div>
            </div>

            {/* XP do dia */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">⚡ XP de hoje</p>
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl p-3 text-center"
                  style={{ background: morningDone ? '#F59E0B18' : 'var(--bg-surface-2)', border: `1px solid ${morningDone ? '#F59E0B33' : 'var(--border)'}` }}>
                  <div className="text-lg font-bold" style={{ color: morningDone ? '#F59E0B' : 'var(--text-dim)' }}>
                    {morningDone ? '+30' : '30'}
                  </div>
                  <div className="text-xs text-text-dim">XP manhã</div>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center"
                  style={{ background: nightDone ? '#6366F118' : 'var(--bg-surface-2)', border: `1px solid ${nightDone ? '#6366F133' : 'var(--border)'}` }}>
                  <div className="text-lg font-bold" style={{ color: nightDone ? '#6366F1' : 'var(--text-dim)' }}>
                    {nightDone ? '+25' : '25'}
                  </div>
                  <div className="text-xs text-text-dim">XP noite</div>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center"
                  style={{ background: 'var(--bg-surface-2)' }}>
                  <div className="text-lg font-bold" style={{ color: ACCENT }}>+15</div>
                  <div className="text-xs text-text-dim">XP meditação</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── CITAÇÕES ── */}
        {tab === 'quotes' && <QuotesTab />}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && <SpiritualAnalytics />}
      </div>
    </div>
  )
}
