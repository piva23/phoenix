import { useState } from 'react'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import { motion } from 'framer-motion'

const ICONS = ['🎯','🚀','💡','⚡','🔥','🏗️','📐','🎨','📱','💼','🌍','🏆','🔬','📈','🛠️','🎭','🌱','💎','🏛️','⚔️']
const COLORS = ['#7C3AED','#06B6D4','#EF4444','#F59E0B','#10B981','#EC4899','#8B5CF6','#3B82F6','#F97316','#14B8A6']

export function ProjectFormModal({ onClose, onSave, editData = null }) {
  const personas = usePersonaStore(s => s.personas)
  const activePersonaId = usePersonaStore(s => s.activePersonaId)

  const [form, setForm] = useState({
    nome:        editData?.nome        || '',
    descricao:   editData?.descricao   || '',
    icone:       editData?.icone       || '🎯',
    cor:         editData?.cor         || '#7C3AED',
    personaId:   editData?.personaId   || activePersonaId,
    status:      editData?.status      || 'ativo',
    dataInicio:  editData?.dataInicio  || '',
    dataFim:     editData?.dataFim     || '',
  })

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inpStyle = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }
  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all'

  const handleSave = () => {
    if (!form.nome.trim()) return
    onSave(form)
    onClose()
  }

  const activePersona = personas.find(p => p.id === form.personaId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <motion.div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', maxHeight: '90vh' }}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header preview */}
        <div className="p-5 relative overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${form.cor}22, ${form.cor}08)` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-main">{editData ? 'Editar Projeto' : 'Novo Projeto'}</h2>
            <button onClick={onClose} className="text-text-dim hover:text-text-main w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: `${form.cor}33`, border: `1px solid ${form.cor}55`, boxShadow: `0 0 20px ${form.cor}33` }}>
              {form.icone}
            </div>
            <div>
              <div className="font-bold text-lg text-text-main">{form.nome || 'Nome do Projeto'}</div>
              <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: form.cor }}>
                {activePersona?.icon} {activePersona?.name || 'Persona'}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Ícone */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => sf('icone', ic)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
                  style={{
                    background: form.icone === ic ? form.cor + '33' : 'var(--bg-surface-2)',
                    border: `1px solid ${form.icone === ic ? form.cor : 'var(--border)'}`,
                    transform: form.icone === ic ? 'scale(1.1)' : 'scale(1)',
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Nome *</label>
            <input className={inp} style={inpStyle} placeholder="Ex: Aprovação TJRS 2025"
              value={form.nome} onChange={e => sf('nome', e.target.value)} autoFocus
              onFocus={e => e.target.style.borderColor = form.cor}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Descrição</label>
            <textarea rows={2} className={`${inp} resize-none`} style={inpStyle}
              placeholder="Descreva o objetivo geral deste projeto..."
              value={form.descricao} onChange={e => sf('descricao', e.target.value)} />
          </div>

          {/* Persona + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Persona</label>
              <select className={inp} style={inpStyle} value={form.personaId} onChange={e => sf('personaId', e.target.value)}>
                {personas.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Status</label>
              <select className={inp} style={inpStyle} value={form.status} onChange={e => sf('status', e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
                <option value="concluido">Concluído</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Data de Início</label>
              <input type="date" className={inp} style={inpStyle} value={form.dataInicio} onChange={e => sf('dataInicio', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Data de Fim</label>
              <input type="date" className={inp} style={inpStyle} value={form.dataFim} onChange={e => sf('dataFim', e.target.value)} />
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Cor</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => sf('cor', c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    border: form.cor === c ? '3px solid white' : '2px solid transparent',
                    outline: form.cor === c ? `2px solid ${c}` : 'none',
                    transform: form.cor === c ? 'scale(1.15)' : 'scale(1)',
                  }} />
              ))}
            </div>
            <input type="color" value={form.cor} onChange={e => sf('cor', e.target.value)}
              className="w-full h-9 rounded-xl cursor-pointer"
              style={{ background: 'var(--bg-surface-2)' }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5 transition-all"
            style={{ borderColor: 'var(--border)' }}>
            Cancelar
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: form.cor }}>
            {editData ? 'Salvar' : 'Criar Projeto'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
