import { getLevel, getLevelColor, getBirthdayDaysLeft, daysSince, CATEGORIES, BADGES } from '../algorithms/relationshipAlgorithms'

export function PersonCard({ person, onClick, compact = false }) {
  const level      = getLevel(person.relationshipScore)
  const color      = getLevelColor(person.relationshipScore)
  const cat        = CATEGORIES.find(c => c.id === person.categoryId)
  const days       = daysSince(person.lastInteraction)
  const bdayLeft   = getBirthdayDaysLeft(person.birthday)
  const initial    = (person.name || '?')[0].toUpperCase()
  const displayName = person.nickname || person.name

  const badgeDefs = BADGES.reduce((m, b) => { m[b.id] = b; return m }, {})
  const visibleBadges = (person.badges || []).slice(0, compact ? 2 : 4)

  if (compact) {
    return (
      <button onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-xl w-full text-left transition-all hover:bg-white/5 active:scale-[0.98]"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <Avatar name={person.name} color={color} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-main truncate">{displayName}</span>
            <span className="text-xs">{level.emoji}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <MiniBar score={person.relationshipScore} color={color} />
            <span className="text-xs font-bold" style={{ color }}>{person.relationshipScore}</span>
          </div>
        </div>
        {days !== null && days > 14 && (
          <span className="text-xs text-text-dim flex-shrink-0">{days}d</span>
        )}
      </button>
    )
  }

  return (
    <button onClick={onClick}
      className="rounded-2xl overflow-hidden w-full text-left transition-all hover:scale-[1.01] active:scale-[0.98]"
      style={{ background: 'var(--bg-surface)', border: `1px solid ${color}33` }}>
      {/* Topo colorido */}
      <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div className="p-4">
        {/* Avatar + Info */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={person.name} color={color} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div>
                <div className="font-bold text-text-main leading-tight">{displayName}</div>
                {person.nickname && person.name !== person.nickname && (
                  <div className="text-xs text-text-dim">{person.name}</div>
                )}
              </div>
              {cat && (
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}33` }}>
                  {cat.emoji}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-base">{level.emoji}</span>
              <span className="text-xs font-semibold" style={{ color }}>{level.label}</span>
            </div>
          </div>
        </div>

        {/* Barra de relacionamento */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-text-dim">Relacionamento</span>
            <span className="text-sm font-bold" style={{ color }}>{person.relationshipScore}/100</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-surface-2)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${person.relationshipScore}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
            {/* Marcadores de nível */}
            {[20, 35, 50, 65, 78, 88, 95, 99].map(mark => (
              <div key={mark} className="absolute top-0 bottom-0 w-px opacity-30"
                style={{ left: `${mark}%`, background: 'var(--bg-base)' }} />
            ))}
          </div>
        </div>

        {/* Info rápida */}
        <div className="flex items-center gap-3 text-xs text-text-dim mb-3 flex-wrap">
          {days !== null
            ? <span>{days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : `Há ${days} dias`}</span>
            : <span>Sem interações</span>}
          {person.city && <><span>·</span><span>{person.city}</span></>}
          {bdayLeft !== null && bdayLeft <= 30 && (
            <span style={{ color: '#F59E0B' }}>🎂 {bdayLeft === 0 ? 'Hoje!' : `em ${bdayLeft}d`}</span>
          )}
        </div>

        {/* Badges */}
        {visibleBadges.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {visibleBadges.map(bId => {
              const b = badgeDefs[bId]
              if (!b) return null
              return (
                <span key={bId} title={b.label}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                  {b.emoji} {b.label}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

export function Avatar({ name, color, size = 48 }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div className="flex items-center justify-center font-bold flex-shrink-0 rounded-full"
      style={{ width: size, height: size, background: color + '33', border: `2px solid ${color}66`, color, fontSize: size * 0.4 }}>
      {initial}
    </div>
  )
}

export function MiniBar({ score, color }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)', maxWidth: 80 }}>
      <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
    </div>
  )
}
