import { useMemo } from 'react'
import { useSpiritualStore, ENERGY_LEVELS } from '../../../stores/useSpiritualStore'

const ACCENT = '#A855F7'

export function SpiritualAnalytics() {
  const { getLast30, getStreaks, rituals } = useSpiritualStore()
  const days    = getLast30()
  const streaks = getStreaks()

  // Últimos 90 dias para heatmap
  const heatmap = useMemo(() => {
    const arr = []
    for (let i = 89; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      const day  = rituals[date]
      const m    = !!day?.morning?.completedAt
      const n    = !!day?.night?.completedAt
      const score = (m ? 1 : 0) + (n ? 1 : 0)
      arr.push({ date, score, m, n })
    }
    return arr
  }, [rituals])

  // Energia média dos últimos 7 dias
  const avgEnergy = useMemo(() => {
    const vals = days.slice(-7).map(d => {
      const date = d.date
      return rituals[date]?.night?.energyLevel || 0
    }).filter(v => v > 0)
    if (!vals.length) return null
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }, [days, rituals])

  // Tarefas últimos 30 dias
  const taskStats = useMemo(() => {
    let total = 0, done = 0
    days.forEach(d => { total += d.tasksTotal; done += d.tasksDone })
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [days])

  // Dias com ritual completo (ambos manhã e noite)
  const fullDays  = days.filter(d => d.morningDone && d.nightDone).length
  const morningDays = days.filter(d => d.morningDone).length
  const nightDays   = days.filter(d => d.nightDone).length
  const medDays     = days.filter(d => d.meditated).length

  const heatColors = ['transparent', '#A855F744', '#A855F7']

  return (
    <div className="space-y-4">

      {/* Streaks */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Manhã',    value: streaks.morning,   color: '#F59E0B', icon: '🌅' },
          { label: 'Noite',    value: streaks.night,     color: '#6366F1', icon: '🌙' },
          { label: 'Meditação',value: streaks.meditation,color: '#A855F7', icon: '🧘' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center"
            style={{ background: 'var(--bg-surface)', border: `1px solid ${s.color}33` }}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-text-dim mt-0.5">{s.label}</div>
            <div className="text-xs text-text-dim">dias</div>
          </div>
        ))}
      </div>

      {/* Heatmap 90 dias */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-main">Consistência — 90 dias</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">menos</span>
            {heatColors.slice(1).map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span className="text-xs text-text-dim">mais</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-0.5">
          {heatmap.map(d => (
            <div key={d.date}
              title={`${d.date}: ${d.m ? '🌅' : ''}${d.n ? '🌙' : ''} ${!d.m && !d.n ? 'sem ritual' : ''}`}
              className="w-3 h-3 rounded-sm"
              style={{ background: heatColors[d.score] }} />
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-text-dim">
          <span>🌅 manhã</span>
          <span>🌙 noite</span>
          <span>■ ambos</span>
        </div>
      </div>

      {/* KPIs dos últimos 30 dias */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">📅 Últimos 30 dias</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Dias completos',   value: `${fullDays}/30`,    color: ACCENT        },
            { label: 'Ritual manhã',     value: `${morningDays}/30`, color: '#F59E0B'     },
            { label: 'Ritual noite',     value: `${nightDays}/30`,   color: '#6366F1'     },
            { label: 'Dias meditando',   value: `${medDays}/30`,     color: '#10B981'     },
            { label: 'Tarefas criadas',  value: taskStats.total,     color: '#38BDF8'     },
            { label: 'Taxa de conclusão',value: `${taskStats.pct}%`, color: taskStats.pct >= 70 ? '#10B981' : '#F59E0B' },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-3" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-text-dim mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Energia média */}
      {avgEnergy && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">⚡ Energia — últimos 7 dias</p>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold" style={{ color: ACCENT }}>
              {ENERGY_LEVELS.find(e => e.value === Math.round(Number(avgEnergy)))?.emoji || '😐'}
            </div>
            <div>
              <div className="text-2xl font-bold text-text-main">{avgEnergy}/5</div>
              <div className="text-xs text-text-dim">
                {ENERGY_LEVELS.find(e => e.value === Math.round(Number(avgEnergy)))?.label || 'Normal'}
              </div>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {days.slice(-7).map((d, i) => {
              const e = rituals[d.date]?.night?.energyLevel || 0
              const lvl = ENERGY_LEVELS.find(l => l.value === e)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-base">{lvl?.emoji || '·'}</div>
                  <div className="text-xs text-text-dim">
                    {new Date(d.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'narrow' })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
