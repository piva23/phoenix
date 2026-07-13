import { useState } from 'react'
import { useRelationshipStore } from '../../../stores/useRelationshipStore'
import { generateMeetingBriefing, INTERACTION_TYPES, getLevel, getLevelColor, CATEGORIES } from '../algorithms/relationshipAlgorithms'
import { PersonCard } from './PersonCard'
import { InteractionModal } from './InteractionModal'
import toast from 'react-hot-toast'

const ACCENT = '#8B5CF6'

export function MeetingMode({ onClose }) {
  const people = useRelationshipStore(s => s.people)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [intModal, setIntModal] = useState(false)

  const filtered = query.trim()
    ? people.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.nickname || '').toLowerCase().includes(query.toLowerCase())
      )
    : []

  const briefing = selected ? generateMeetingBriefing(selected) : null
  const color    = selected ? getLevelColor(selected.relationshipScore) : ACCENT
  const cat      = selected ? CATEGORIES.find(c => c.id === selected.categoryId) : null

  if (selected && briefing) return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <button onClick={() => setSelected(null)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10">
          ←
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-white text-lg">{selected.nickname || selected.name}</h2>
          <p className="text-xs text-white/50">{cat?.emoji} {cat?.label} · Briefing ao vivo</p>
        </div>
        <button onClick={() => setIntModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: color }}>
          + Registrar
        </button>
        <button onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Barra de relacionamento */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}44` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">{getLevel(selected.relationshipScore).emoji} {getLevel(selected.relationshipScore).label}</span>
            <span className="font-bold text-lg" style={{ color }}>{selected.relationshipScore}/100</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${selected.relationshipScore}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
          </div>
        </div>

        {/* Contexto */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">📋 Contexto</p>
          <div className="space-y-2">
            {briefing.context.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm text-white/80">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Estratégias */}
        {briefing.strategies.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">✦ Estratégias de Conexão</p>
            <div className="space-y-2.5">
              {briefing.strategies.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                    style={{ background: color + '33', color }}>
                    {i + 1}
                  </div>
                  <span className="text-sm text-white/80 leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tópicos de conversa */}
        {briefing.topics.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">💬 Tópicos Sugeridos</p>
            <div className="space-y-2">
              {briefing.topics.map((t, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-white/30 text-xs mt-0.5 flex-shrink-0">💬</span>
                  <span className="text-sm text-white/75 italic">"{t}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interesses */}
        {selected.interests?.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">🏷️ Interesses</p>
            <div className="flex flex-wrap gap-2">
              {selected.interests.map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: color + '22', color, border: `1px solid ${color}33` }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        {selected.notes?.trim() && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">📝 Notas pessoais</p>
            <p className="text-sm text-white/70 leading-relaxed">{selected.notes}</p>
          </div>
        )}

        {/* Ações rápidas */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">⚡ Ação Rápida</p>
          <div className="grid grid-cols-2 gap-2">
            {INTERACTION_TYPES.filter(t => ['casual_chat','deep_talk','meetup','helped'].includes(t.id)).map(type => (
              <button key={type.id}
                onClick={() => setIntModal(true)}
                className="flex items-center gap-2 p-3 rounded-xl text-left border transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-xl">{type.emoji}</span>
                <div>
                  <div className="text-xs font-semibold text-white/80">{type.label}</div>
                  <div className="text-xs font-bold" style={{ color: '#10B981' }}>+{type.points}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {intModal && <InteractionModal person={selected} onClose={() => { setIntModal(false); onClose() }} />}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-semibold text-text-main">Encontro ao Vivo 🎯</h3>
            <p className="text-xs text-text-dim mt-0.5">Com quem você vai se encontrar?</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
        </div>

        <div className="p-5">
          <input className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            placeholder="🔍 Buscar pelo nome..."
            value={query} onChange={e => setQuery(e.target.value)} autoFocus />

          {query.trim() && (
            <div className="mt-3 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-text-dim text-center py-4">Nenhuma pessoa encontrada</p>
              ) : (
                filtered.slice(0, 5).map(p => (
                  <PersonCard key={p.id} person={p} compact onClick={() => setSelected(p)} />
                ))
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="mt-4 text-center py-4">
              <div className="text-4xl mb-2">🤝</div>
              <p className="text-sm text-text-dim">Digite o nome de quem você vai encontrar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
