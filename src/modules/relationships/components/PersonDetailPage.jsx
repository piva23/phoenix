import { useState } from 'react'
import { useRelationshipStore } from '../../../stores/useRelationshipStore'
import { getLevel, getLevelColor, getBirthdayDaysLeft, daysSince, CATEGORIES, LOVE_LANGUAGES, ATTACHMENT_TYPES, BADGES } from '../algorithms/relationshipAlgorithms'
import { Avatar } from './PersonCard'
import { InteractionModal } from './InteractionModal'
import { PersonFormModal } from './PersonFormModal'
import { MeetingMode } from './MeetingMode'

const ACCENT = '#8B5CF6'

export function PersonDetailPage({ person, onBack }) {
  const { deleteInteraction, deletePerson, toggleBadge } = useRelationshipStore()
  // Pega sempre a versão mais recente da store
  const personLive = useRelationshipStore(s => s.people.find(p => p.id === person.id)) || person

  const [intModal, setIntModal]   = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [meetModal, setMeetModal] = useState(false)
  const [tab, setTab]             = useState('overview') // overview | history

  const level   = getLevel(personLive.relationshipScore)
  const color   = getLevelColor(personLive.relationshipScore)
  const cat     = CATEGORIES.find(c => c.id === personLive.categoryId)
  const days    = daysSince(personLive.lastInteraction)
  const bdayLeft = getBirthdayDaysLeft(personLive.birthday)
  const ll      = LOVE_LANGUAGES.find(l => l.id === personLive.loveLanguage)
  const att     = ATTACHMENT_TYPES.find(a => a.id === personLive.attachmentType)
  const badgeDefs = BADGES.reduce((m, b) => { m[b.id] = b; return m }, {})

  const handleDelete = () => {
    if (!window.confirm(`Remover ${personLive.name}?`)) return
    deletePerson(personLive.id)
    onBack()
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-white/8">←</button>
        <div className="flex-1">
          <div className="font-bold text-text-main">{personLive.nickname || personLive.name}</div>
          {personLive.nickname && <div className="text-xs text-text-dim">{personLive.name}</div>}
        </div>
        <button onClick={() => setMeetModal(true)}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: color }}>
          🎯 Encontro
        </button>
        <button onClick={() => setEditModal(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-white/8 text-sm">
          ✎
        </button>
        <button onClick={handleDelete}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-dim hover:text-red-400 hover:bg-red-500/10 text-sm">
          🗑
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar name={personLive.name} color={color} size={72} />
            <div className="flex-1">
              {cat && (
                <span className="text-xs px-2 py-0.5 rounded-full inline-block mb-2"
                  style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}33` }}>
                  {cat.emoji} {cat.label}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{level.emoji}</span>
                <span className="font-bold" style={{ color }}>{level.label}</span>
              </div>
              {personLive.city && <p className="text-xs text-text-dim">📍 {personLive.city}</p>}
              {bdayLeft !== null && (
                <p className="text-xs mt-1" style={{ color: bdayLeft <= 7 ? '#F59E0B' : 'var(--text-dim)' }}>
                  🎂 {bdayLeft === 0 ? 'Aniversário HOJE!' : bdayLeft === 1 ? 'Aniversário amanhã!' : `Aniversário em ${bdayLeft} dias`}
                </p>
              )}
            </div>
          </div>

          {/* Barra de relacionamento */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: `1px solid ${color}33` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-text-main">Relacionamento</span>
              <span className="text-2xl font-bold" style={{ color }}>{personLive.relationshipScore}/100</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden relative mb-2" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${personLive.relationshipScore}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
              {[20, 35, 50, 65, 78, 88, 95, 99].map(mark => (
                <div key={mark} className="absolute top-0 bottom-0 w-px opacity-20"
                  style={{ left: `${mark}%`, background: 'white' }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-text-dim">
              <span>Desconhecido</span>
              <span>Alma Gêmea ⭐</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-text-dim">
                {days === null ? 'Sem interações ainda' : days === 0 ? 'Última interação: hoje' : `Última interação: há ${days} dias`}
              </span>
              <button onClick={() => setIntModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90"
                style={{ background: color }}>
                + Registrar interação
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)' }}>
            {[['overview', '👤 Perfil'], ['history', '📋 Histórico']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: tab === id ? ACCENT : 'transparent', color: tab === id ? '#fff' : 'var(--text-muted)' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Badges */}
              {personLive.badges?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">🏅 Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {personLive.badges.map(bId => {
                      const b = badgeDefs[bId]
                      if (!b) return null
                      return (
                        <span key={bId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          {b.emoji} {b.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Perfil psicológico */}
              {(ll || att || personLive.mbti) && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">🧠 Perfil Psicológico</p>
                  {ll && (
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
                      <span className="text-xl">{ll.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-text-main">{ll.label}</div>
                        <div className="text-xs text-text-dim">{ll.desc}</div>
                      </div>
                    </div>
                  )}
                  {att && (
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
                      <span className="text-xl">{att.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-text-main">Apego {att.label}</div>
                        <div className="text-xs text-text-dim">{att.desc}</div>
                      </div>
                    </div>
                  )}
                  {personLive.mbti && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
                      <span className="text-xl">🧩</span>
                      <div>
                        <div className="text-sm font-semibold text-text-main">
                          {personLive.mbti}
                          {personLive.introvertExtrovert && ` · ${personLive.introvertExtrovert === 'introvert' ? 'Introvertido' : 'Extrovertido'}`}
                        </div>
                        <div className="text-xs text-text-dim">Tipo de personalidade</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Interesses */}
              {personLive.interests?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">🏷️ Interesses</p>
                  <div className="flex flex-wrap gap-2">
                    {personLive.interests.map(tag => (
                      <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: color + '22', color, border: `1px solid ${color}33` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {personLive.notes?.trim() && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">📝 Notas</p>
                  <p className="text-sm text-text-muted leading-relaxed">{personLive.notes}</p>
                </div>
              )}

              {personLive.contactPref && (
                <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="text-xs text-text-dim">Contato preferido</div>
                    <div className="text-sm font-medium text-text-main">{personLive.contactPref}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          {tab === 'history' && (
            <div className="space-y-2">
              {!personLive.interactions?.length ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="text-4xl mb-3 opacity-30">💬</div>
                  <p className="font-semibold text-text-muted">Nenhuma interação registrada</p>
                  <button onClick={() => setIntModal(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: ACCENT }}>
                    + Registrar primeira interação
                  </button>
                </div>
              ) : (
                [...personLive.interactions].sort((a, b) => b.date?.localeCompare(a.date)).map(int => (
                  <div key={int.id} className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <span className="text-2xl flex-shrink-0">{int.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-text-main">{int.label}</span>
                        <span className="text-xs font-bold flex-shrink-0"
                          style={{ color: int.points < 0 ? '#EF4444' : '#10B981' }}>
                          {int.points > 0 ? '+' : ''}{int.points}
                        </span>
                      </div>
                      {int.note && <p className="text-xs text-text-dim mt-1 italic">"{int.note}"</p>}
                      <p className="text-xs text-text-dim mt-1">
                        {int.date} {int.time && `às ${int.time}`}
                      </p>
                    </div>
                    <button onClick={() => deleteInteraction(personLive.id, int.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs flex-shrink-0">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {intModal  && <InteractionModal person={personLive} onClose={() => setIntModal(false)} />}
      {editModal && <PersonFormModal  person={personLive} onClose={() => setEditModal(false)} />}
      {meetModal && <MeetingMode onClose={() => setMeetModal(false)} />}
    </div>
  )
}
