import { useMemo } from 'react'
import { useRelationshipStore } from '../../../stores/useRelationshipStore'
import { getDunbarCircles, getAlerts, getSocialHealth, getBirthdayDaysLeft, daysSince, getLevel, getLevelColor, CATEGORIES } from '../algorithms/relationshipAlgorithms'
import { Avatar } from './PersonCard'

const ACCENT = '#8B5CF6'

function MiniPersonRow({ person, onClick, extra }) {
  const color = getLevelColor(person.relationshipScore)
  const level = getLevel(person.relationshipScore)
  return (
    <button onClick={() => onClick(person)}
      className="flex items-center gap-3 p-3 rounded-xl w-full text-left hover:bg-white/5 transition-all">
      <Avatar name={person.name} color={color} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-main truncate">{person.nickname || person.name}</div>
        <div className="text-xs text-text-dim">{level.emoji} {level.label}</div>
      </div>
      {extra && <span className="text-xs text-text-dim flex-shrink-0">{extra}</span>}
    </button>
  )
}

export function AnalyticsTab({ onSelectPerson }) {
  const people = useRelationshipStore(s => s.people)

  const circles = useMemo(() => getDunbarCircles(people), [people])
  const alerts  = useMemo(() => getAlerts(people), [people])
  const health  = useMemo(() => getSocialHealth(people), [people])

  // Distribuição por categoria
  const catDist = useMemo(() => {
    const map = {}
    people.forEach(p => {
      map[p.categoryId] = (map[p.categoryId] || 0) + 1
    })
    return map
  }, [people])

  // Pessoa mais negligenciada (alta pontuação + mais dias sem contato)
  const mostNeglected = useMemo(() => {
    return [...people]
      .filter(p => p.relationshipScore >= 36 && p.lastInteraction)
      .sort((a, b) => (daysSince(b.lastInteraction) || 0) - (daysSince(a.lastInteraction) || 0))
      .slice(0, 3)
  }, [people])

  // Score geral de saúde social (0-100)
  const healthScore = health.score

  if (people.length === 0) return (
    <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="text-5xl mb-4 opacity-30">🌐</div>
      <p className="font-semibold text-text-muted mb-1">Sem dados ainda</p>
      <p className="text-sm text-text-dim">Adicione pessoas para ver os analytics.</p>
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Saúde Social */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-surface)', border: `1px solid ${health.color}33` }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-main">🌡️ Saúde Social</p>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: health.color + '22', color: health.color }}>
            {health.label}
          </span>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-5xl font-bold" style={{ color: health.color }}>{healthScore}</div>
          <div className="flex-1 pb-1">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${healthScore}%`, background: health.color }} />
            </div>
            <div className="flex justify-between text-xs text-text-dim mt-1">
              <span>0</span><span>100</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Total',    value: people.length,                           color: ACCENT },
            { label: 'Ativos',  value: people.filter(p => (daysSince(p.lastInteraction) || 999) <= 30).length, color: '#10B981' },
            { label: 'Íntimos', value: circles.intimate.length,                  color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-text-dim">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {(alerts.cooling.length > 0 || alerts.attention.length > 0 || alerts.birthdays.length > 0) && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">🚨 Alertas</p>
          </div>
          <div className="p-4 space-y-3">
            {alerts.cooling.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#EF4444' }}>
                  ❄️ Esfriando — {alerts.cooling.length} pessoa{alerts.cooling.length > 1 ? 's' : ''} sem contato +30 dias
                </p>
                <div className="space-y-1">
                  {alerts.cooling.slice(0, 3).map(p => (
                    <MiniPersonRow key={p.id} person={p} onClick={onSelectPerson}
                      extra={`${daysSince(p.lastInteraction)}d`} />
                  ))}
                </div>
              </div>
            )}
            {alerts.attention.length > 0 && (
              <div className={alerts.cooling.length > 0 ? 'border-t pt-3' : ''} style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#F59E0B' }}>
                  ⚠️ Atenção — {alerts.attention.length} pessoa{alerts.attention.length > 1 ? 's' : ''} sem contato 14-30 dias
                </p>
                <div className="space-y-1">
                  {alerts.attention.slice(0, 3).map(p => (
                    <MiniPersonRow key={p.id} person={p} onClick={onSelectPerson}
                      extra={`${daysSince(p.lastInteraction)}d`} />
                  ))}
                </div>
              </div>
            )}
            {alerts.birthdays.length > 0 && (
              <div className={(alerts.cooling.length > 0 || alerts.attention.length > 0) ? 'border-t pt-3' : ''} style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#F59E0B' }}>
                  🎂 Aniversários próximos (30 dias)
                </p>
                <div className="space-y-1">
                  {alerts.birthdays.map(p => {
                    const d = getBirthdayDaysLeft(p.birthday)
                    return (
                      <MiniPersonRow key={p.id} person={p} onClick={onSelectPerson}
                        extra={d === 0 ? 'HOJE! 🎉' : `em ${d}d`} />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Círculos de Dunbar */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">🔵 Círculos de Dunbar</p>
          <p className="text-xs text-text-dim mt-0.5">Organização natural das relações humanas</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: '💜 Íntimos',     desc: 'Máx. 5 pessoas',   list: circles.intimate,    color: '#A855F7' },
            { label: '💛 Próximos',    desc: 'Máx. 15 pessoas',  list: circles.close,       color: '#F59E0B' },
            { label: '🤝 Ativos',      desc: 'Máx. 50 pessoas',  list: circles.active,      color: '#38BDF8' },
            { label: '👋 Conhecidos',  desc: 'Máx. 150 pessoas', list: circles.acquaintance, color: '#94A3B8' },
          ].map(circle => (
            <div key={circle.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-text-main">{circle.label}</span>
                  <span className="text-xs text-text-dim ml-2">{circle.desc}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: circle.color }}>{circle.list.length}</span>
              </div>
              {circle.list.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {circle.list.slice(0, 8).map(p => (
                    <button key={p.id} onClick={() => onSelectPerson(p)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: circle.color + '18', color: circle.color, border: `1px solid ${circle.color}33` }}>
                      <Avatar name={p.name} color={circle.color} size={18} />
                      {p.nickname || p.name.split(' ')[0]}
                    </button>
                  ))}
                  {circle.list.length > 8 && (
                    <span className="px-2.5 py-1.5 rounded-full text-xs text-text-dim"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      +{circle.list.length - 8}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-dim italic">Nenhuma pessoa neste círculo</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição por categoria */}
      {Object.keys(catDist).length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">📊 Por Categoria</p>
          <div className="space-y-2.5">
            {CATEGORIES.filter(c => catDist[c.id]).map(cat => {
              const count = catDist[cat.id] || 0
              const pct   = Math.round((count / people.length) * 100)
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span className="text-sm text-text-main">{cat.label}</span>
                    </div>
                    <span className="text-xs text-text-dim">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mais negligenciados */}
      {mostNeglected.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">😴 Mais Negligenciados</p>
            <p className="text-xs text-text-dim mt-0.5">Amigos ou acima, sem contato recente</p>
          </div>
          <div className="p-2">
            {mostNeglected.map(p => (
              <MiniPersonRow key={p.id} person={p} onClick={onSelectPerson}
                extra={`${daysSince(p.lastInteraction)}d sem contato`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
