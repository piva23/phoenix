import { useState } from 'react'
import { useRelationshipStore } from '../../../stores/useRelationshipStore'
import { INTERACTION_TYPES } from '../algorithms/relationshipAlgorithms'
import toast from 'react-hot-toast'
import { useXPStore } from '../../../stores/useXPStore'
import { useUserStore } from '../../../stores/useUserStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'

const ACCENT = '#8B5CF6'

export function InteractionModal({ person, onClose }) {
  const { addInteraction } = useRelationshipStore()
  const { logXP } = useXPStore()
  const { addXP } = useUserStore()
  const activePersonaId = usePersonaStore(s => s.activePersonaId)
  const [sel, setSel] = useState(null)
  const [note, setNote] = useState('')

  const groups = [...new Set(INTERACTION_TYPES.map(t => t.group))]

  const handleConfirm = () => {
    if (!sel) return
    const type = INTERACTION_TYPES.find(t => t.id === sel)
    addInteraction(person.id, { ...type, note: note.trim() })
    const xp = Math.max(0, type.points) * 2
    if (xp > 0) {
      logXP({ action: 'RELATIONSHIP_INTERACTION', xp, moduleOrigin: 'relationships', personaId: activePersonaId, radarAxis: 'consistencia' })
      addXP(xp)
      toast.success(`${type.emoji} ${type.label} — +${type.points} pts no relacionamento!`)
    } else {
      toast(`${type.emoji} ${type.label} — ${type.points} pts`, { icon: '😔' })
    }
    onClose()
  }

  const selType = INTERACTION_TYPES.find(t => t.id === sel)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-semibold text-text-main">Registrar Interação</h3>
            <p className="text-xs text-text-dim mt-0.5">com {person.nickname || person.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {groups.map(group => (
            <div key={group}>
              <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">{group}</p>
              <div className="space-y-1.5">
                {INTERACTION_TYPES.filter(t => t.group === group).map(type => {
                  const isNeg = type.points < 0
                  const isSel = sel === type.id
                  return (
                    <button key={type.id} onClick={() => setSel(isSel ? null : type.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: isSel ? (isNeg ? '#EF4444' : ACCENT) : 'var(--border)',
                        background: isSel ? (isNeg ? '#EF444415' : ACCENT + '18') : 'var(--bg-surface-2)',
                      }}>
                      <span className="text-xl flex-shrink-0">{type.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-text-main">{type.label}</span>
                      <span className="text-xs font-bold flex-shrink-0"
                        style={{ color: isNeg ? '#EF4444' : '#10B981' }}>
                        {isNeg ? '' : '+'}{type.points}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {sel && (
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Nota (opcional)</label>
              <textarea rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                placeholder="Como foi? O que conversaram?"
                value={note} onChange={e => setNote(e.target.value)} autoFocus />
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={!sel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90"
            style={{ background: selType?.points < 0 ? '#EF4444' : ACCENT }}>
            {selType ? `${selType.emoji} Registrar` : 'Selecione uma interação'}
          </button>
        </div>
      </div>
    </div>
  )
}
