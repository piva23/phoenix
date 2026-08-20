import { useState } from 'react'
import { useProjectStore } from '../../../stores/useProjectStore'
import { ObjetivoItem } from '../components/ObjetivoItem'

export function ObjetivosView({ project }) {
  const { addObjetivo } = useProjectStore()
  const [novoObj, setNovoObj] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!novoObj.trim()) return
    addObjetivo(project.id, { titulo: novoObj, descricao: '' })
    setNovoObj('')
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {/* Botão novo objetivo */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-dim">
          {(project.objetivos || []).length} objetivo{(project.objetivos || []).length !== 1 ? 's' : ''}
        </p>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: project.cor || 'var(--primary)' }}>
          + Novo Objetivo
        </button>
      </div>

      {/* Form novo objetivo */}
      {showForm && (
        <div className="flex gap-2">
          <input className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-surface)', border: `1px solid ${project.cor || 'var(--primary)'}`, color: 'var(--text-main)' }}
            placeholder="Qual é o objetivo? Ex: Dominar Direito Administrativo"
            value={novoObj} onChange={e => setNovoObj(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false) }} />
          <button onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: project.cor || 'var(--primary)' }}>
            Adicionar
          </button>
          <button onClick={() => setShowForm(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border text-text-muted hover:bg-white/5"
            style={{ borderColor: 'var(--border)' }}>
            ✕
          </button>
        </div>
      )}

      {/* Lista de objetivos */}
      {(project.objetivos || []).length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">🎯</div>
          <p className="font-semibold text-text-muted mb-2">Nenhum objetivo ainda</p>
          <p className="text-sm text-text-dim mb-5">Crie objetivos claros e mensuráveis com Key Results e Tasks.</p>
          <button onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: project.cor || 'var(--primary)' }}>
            + Criar Primeiro Objetivo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(project.objetivos || []).map(obj => (
            <ObjetivoItem key={obj.id} objetivo={obj} projectId={project.id} projectCor={project.cor || 'var(--primary)'} />
          ))}
        </div>
      )}
    </div>
  )
}
