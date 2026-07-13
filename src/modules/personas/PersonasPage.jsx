import { useState } from 'react'
import { usePersonaStore } from '../../stores/usePersonaStore'
import { PersonaFormModal } from './PersonaFormModal'
import { calcXPProgress } from '../../shared/utils/xp'

export function PersonasPage() {
  const { personas, activePersonaId, setActivePersona, deletePersona } = usePersonaStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const handleDelete = (id) => {
    if (id === activePersonaId) return
    if (!window.confirm('Excluir esta persona?')) return
    deletePersona(id)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Personas</h1>
          <p className="text-text-muted text-sm mt-1">Cada persona é um modo operacional da sua vida.</p>
        </div>
        <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: 'var(--primary)' }}>
          + Nova Persona
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {personas.map(p => {
          const isActive = p.id === activePersonaId
          const xpData = calcXPProgress(p.xp || 0)
          return (
            <div key={p.id} className="rounded-2xl overflow-hidden transition-all"
              style={{ border: `${isActive ? 2 : 1}px solid ${isActive ? p.colorPrimary : 'var(--border)'}`, background: isActive ? p.colorPrimary + '0f' : 'var(--bg-surface)' }}>
              <div className="p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg,${p.colorPrimary}18,${p.colorSecondary}08)` }}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: p.colorPrimary, transform: 'translate(40%,-40%)' }} />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: `linear-gradient(135deg,${p.colorPrimary}44,${p.colorSecondary}22)`, border: `1px solid ${p.colorPrimary}44`, boxShadow: isActive ? `0 0 20px ${p.colorPrimary}44` : 'none' }}>
                      {p.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-main">{p.name}</span>
                        {isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: p.colorPrimary + '22', color: p.colorPrimary }}>ATIVA</span>}
                      </div>
                      <div className="text-sm" style={{ color: p.colorPrimary }}>{p.title}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditTarget(p); setFormOpen(true) }} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-white/8 text-sm transition-all">✎</button>
                    {!isActive && <button onClick={() => handleDelete(p.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-sm transition-all">✕</button>}
                  </div>
                </div>
              </div>
              <div className="p-5 pt-4 space-y-4">
                {p.focus?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.focus.map(f => <span key={f} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{f}</span>)}
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-xs text-text-dim mb-1.5">
                    <span>Lv. {xpData.level} · {p.xp || 0} XP</span>
                    <span>Lv. {xpData.level + 1}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${xpData.progress}%`, background: `linear-gradient(90deg,${p.colorPrimary},${p.colorSecondary})` }} />
                  </div>
                </div>
                {!isActive ? (
                  <button onClick={() => setActivePersona(p.id)} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: p.colorPrimary + '22', color: p.colorPrimary, border: `1px solid ${p.colorPrimary}44` }}>
                    Ativar {p.name}
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                    style={{ background: p.colorPrimary + '18', color: p.colorPrimary, border: `1px solid ${p.colorPrimary}33` }}>
                    ✓ Persona ativa agora
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {formOpen && <PersonaFormModal editPersona={editTarget} onClose={() => { setFormOpen(false); setEditTarget(null) }} />}
    </div>
  )
}
