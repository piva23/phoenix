import { useMemo } from 'react'
import { formatDateBR } from '../../../shared/utils/time'

export function ProjectAnalyticsView({ project }) {
  const stats = useMemo(() => {
    const objetivos = project.objetivos || []
    const allTasks = objetivos.flatMap(o => o.tasks || [])
    const allKRs = objetivos.flatMap(o => o.keyResults || [])

    const total = allTasks.length
    const done = allTasks.filter(t => t.status === 'done').length
    const doing = allTasks.filter(t => t.status === 'doing').length
    const todo = allTasks.filter(t => t.status === 'todo').length
    const overdue = allTasks.filter(t => t.dataFim && t.dataFim < new Date().toISOString().split('T')[0] && t.status !== 'done').length
    const milestones = allTasks.filter(t => t.milestone)
    const milestoneDone = milestones.filter(t => t.status === 'done').length
    const xpEarned = allTasks.filter(t => t.status === 'done').reduce((a, t) => a + (t.xpReward || 10), 0)

    const byObj = objetivos.map(o => {
      const tasks = o.tasks || []
      const krs = o.keyResults || []
      const objDone = tasks.filter(t => t.status === 'done').length
      const pct = tasks.length > 0 ? Math.round((objDone / tasks.length) * 100) : 0
      const krPct = krs.length > 0 ? Math.round(krs.reduce((a, kr) => a + Math.min(100, (kr.metaAtual / (kr.metaAlvo || 1)) * 100), 0) / krs.length) : null
      return { ...o, totalTasks: tasks.length, doneTasks: objDone, pct, krPct }
    })

    const recentDone = allTasks.filter(t => t.status === 'done' && t.completedAt).sort((a, b) => b.completedAt.localeCompare(a.completedAt)).slice(0, 5)

    return { total, done, doing, todo, overdue, milestones, milestoneDone, xpEarned, byObj, recentDone, allKRs }
  }, [project])

  const cor = project.cor || 'var(--primary)'
  const pctGeral = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Progresso Geral', value: `${pctGeral}%`,   color: cor },
          { label: 'Tasks Concluídas', value: `${stats.done}/${stats.total}`, color: '#10B981' },
          { label: 'Atrasadas',       value: stats.overdue,    color: stats.overdue > 0 ? '#EF4444' : '#10B981' },
          { label: 'XP Earned',       value: `+${stats.xpEarned}`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-text-dim mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progresso geral */}
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-semibold text-text-main">Progresso Total</span>
          <span className="text-sm font-bold" style={{ color: cor }}>{pctGeral}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pctGeral}%`, background: `linear-gradient(90deg, ${cor}, ${cor}88)` }} />
        </div>
        <div className="flex gap-4 mt-3">
          {[
            { label: 'A Fazer',      val: stats.todo,  color: '#6B6A7A' },
            { label: 'Em Andamento', val: stats.doing, color: '#F59E0B' },
            { label: 'Concluídas',   val: stats.done,  color: '#10B981' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-xs text-text-dim">{s.label}: <strong className="text-text-main">{s.val}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Por Objetivo */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-sm text-text-main">Progresso por Objetivo</h3>
        </div>
        <div className="p-4 space-y-4">
          {stats.byObj.length === 0 ? (
            <p className="text-sm text-text-dim text-center py-4">Nenhum objetivo criado ainda.</p>
          ) : stats.byObj.map(obj => (
            <div key={obj.id}>
              <div className="flex justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: cor }} />
                  <span className="text-sm font-medium text-text-main">{obj.titulo}</span>
                </div>
                <div className="flex items-center gap-3">
                  {obj.krPct !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cor + '22', color: cor }}>
                      KR: {obj.krPct}%
                    </span>
                  )}
                  <span className="text-xs font-semibold text-text-muted">{obj.doneTasks}/{obj.totalTasks} tasks</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${obj.pct}%`, background: cor }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      {stats.milestones.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-text-main">Milestones</h3>
              <span className="text-xs text-text-dim">{stats.milestoneDone}/{stats.milestones.length} concluídos</span>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {stats.milestones.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: 'var(--bg-surface-2)', borderColor: m.status === 'done' ? '#10B981' + '44' : cor + '33' }}>
                <span style={{ color: m.status === 'done' ? '#10B981' : cor, fontSize: 16 }}>◆</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-main truncate"
                    style={{ textDecoration: m.status === 'done' ? 'line-through' : 'none', opacity: m.status === 'done' ? 0.6 : 1 }}>
                    {m.titulo}
                  </p>
                  {m.dataFim && <p className="text-xs text-text-dim">📅 {formatDateBR(m.dataFim)}</p>}
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: m.status === 'done' ? 'rgba(16,185,129,0.12)' : cor + '18', color: m.status === 'done' ? '#10B981' : cor }}>
                  {m.status === 'done' ? '✓ Concluído' : m.status === 'doing' ? 'Em andamento' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks recentes concluídas */}
      {stats.recentDone.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold text-sm text-text-main">Últimas Concluídas</h3>
          </div>
          <div className="p-4 space-y-2">
            {stats.recentDone.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
                <span className="text-green-400 text-sm">✓</span>
                <span className="flex-1 text-sm text-text-muted line-through">{t.titulo}</span>
                {t.completedAt && <span className="text-xs text-text-dim flex-shrink-0">{formatDateBR(t.completedAt)}</span>}
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--accent)' }}>+{t.xpReward || 10} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
