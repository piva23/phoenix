import { useState } from 'react'
import { usePersonaStore } from '../../stores/usePersonaStore'
import { motion } from 'framer-motion'

const ICONS = ['👁','⚖️','🔥','⚡','🌿','🦅','🐉','⚔️','🧬','🌊','☀️','🌙','💎','🦁','🐺','🌌','🏔️','🎯','🧠','💡','🏛️','🔱','🌀','🎭']
const COLORS = ['#7C3AED','#6D28D9','#DC2626','#059669','#22C55E','#06B6D4','#F59E0B','#EC4899','#8B5CF6','#3B82F6','#F97316','#14B8A6','#A855F7','#EF4444','#10B981']

export function PersonaFormModal({ onClose, editPersona = null }) {
  const { addPersona, updatePersona } = usePersonaStore()
  const [form, setForm] = useState({
    name: editPersona?.name || '',
    title: editPersona?.title || '',
    icon: editPersona?.icon || '🎯',
    colorPrimary: editPersona?.colorPrimary || '#7C3AED',
    colorSecondary: editPersona?.colorSecondary || '#A855F7',
    colorAccent: editPersona?.colorAccent || '#F59E0B',
    focus: editPersona?.focus?.join(', ') || '',
  })
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return
    const data = { ...form, focus: form.focus.split(',').map(f => f.trim()).filter(Boolean), glow: form.colorPrimary + '55', dashboardModules: editPersona?.dashboardModules || ['study'] }
    if (editPersona) updatePersona(editPersona.id, data)
    else addPersona(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <motion.div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', maxHeight: '90vh' }}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}>
        <div className="p-5 relative overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${form.colorPrimary}22, ${form.colorSecondary}11)` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-main">{editPersona ? 'Editar Persona' : 'Nova Persona'}</h2>
            <button onClick={onClose} className="text-text-dim hover:text-text-main w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: `linear-gradient(135deg,${form.colorPrimary}44,${form.colorSecondary}22)`, border: `1px solid ${form.colorPrimary}44`, boxShadow: `0 0 24px ${form.colorPrimary}44` }}>
              {form.icon}
            </div>
            <div>
              <div className="font-bold text-lg text-text-main">{form.name || 'Nome da Persona'}</div>
              <div className="text-sm" style={{ color: form.colorPrimary }}>{form.title || 'Título'}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => s('icon', ic)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all"
                  style={{ background: form.icon === ic ? form.colorPrimary + '33' : 'var(--bg-surface-2)', border: `1px solid ${form.icon === ic ? form.colorPrimary : 'var(--border)'}`, transform: form.icon === ic ? 'scale(1.1)' : 'scale(1)' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['name','Nome *','Ex: AJAA, Atlas...'],['title','Título','Ex: Concurseiro...']].map(([k,l,p]) => (
              <div key={k}>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">{l}</label>
                <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                  placeholder={p} value={form[k]} onChange={e => s(k, e.target.value)}
                  onFocus={e => e.target.style.borderColor = form.colorPrimary}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Áreas de foco <span className="font-normal normal-case text-text-dim">(vírgula)</span></label>
            <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="concurso, disciplina, aprovação" value={form.focus} onChange={e => s('focus', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Cor Principal</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => s('colorPrimary', c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, border: form.colorPrimary === c ? '3px solid white' : '2px solid transparent', outline: form.colorPrimary === c ? `2px solid ${c}` : 'none', transform: form.colorPrimary === c ? 'scale(1.15)' : 'scale(1)' }} />
              ))}
            </div>
            <input type="color" value={form.colorPrimary} onChange={e => s('colorPrimary', e.target.value)} className="w-full h-9 rounded-xl cursor-pointer" style={{ background: 'var(--bg-surface-2)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['colorSecondary','Cor Secundária'],['colorAccent','Cor de Destaque']].map(([k,l]) => (
              <div key={k}>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">{l}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form[k]} onChange={e => s(k, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer flex-shrink-0" />
                  <input className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                    value={form[k]} onChange={e => s(k, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border transition-all hover:text-text-main hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: form.colorPrimary }}>
            {editPersona ? 'Salvar' : 'Criar Persona'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
