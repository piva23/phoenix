import { useState } from 'react'
import { useFinanceStore, fmtBRL } from '../../../stores/useFinanceStore'
import { useProjectStore } from '../../../stores/useProjectStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'

export function InvestTab() {
  const [section, setSection] = useState('cofre') // cofre | envelopes
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
        {[
          { id: 'cofre', label: '📈 Cofre / Longo prazo' },
          { id: 'envelopes', label: '🎯 Metas & Envelopes' },
        ].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: section === t.id ? 'var(--primary)' : 'transparent', color: section === t.id ? '#fff' : 'var(--text-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>
      {section === 'cofre' ? <VaultSection /> : <EnvelopesSection />}
    </div>
  )
}

// ── COFRE DE LONGO PRAZO (divisões percentuais + projeção) ─────────────────
function VaultSection() {
  const { invest, updateInvest, updateInvestDivisions, addInvestHistory, getInvestProjection } = useFinanceStore()
  const [editingDiv, setEditingDiv] = useState(null)
  const [divVal, setDivVal] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [extraMonthly, setExtraMonthly] = useState(0)

  const projection = getInvestProjection(Number(extraMonthly) || 0)
  const totalPct = invest.divisions.reduce((a, d) => a + d.pct, 0)

  const saveDiv = (id) => {
    const pct = Number(divVal) / 100
    if (isNaN(pct) || pct < 0) return
    updateInvestDivisions(invest.divisions.map(d => d.id === id ? { ...d, pct } : d))
    setEditingDiv(null)
  }

  return (
    <div className="space-y-4">
      {/* Saldo atual + meta */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #38BDF822, transparent)', border: '1px solid #38BDF833' }}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Saldo total investido</p>
        <p className="text-3xl font-bold" style={{ color: '#38BDF8' }}>{fmtBRL(invest.currentBalance)}</p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-text-dim mb-1"><span>Meta: {fmtBRL(invest.goal)}</span><span>{Math.round(projection.pct)}%</span></div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
            <div className="h-full rounded-full" style={{ width: `${projection.pct}%`, background: '#38BDF8' }} />
          </div>
        </div>
        <button onClick={() => setShowHistoryModal(true)} className="mt-4 w-full py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#38BDF8' }}>
          + Atualizar saldo / novo aporte
        </button>
      </div>

      {/* Histórico gráfico */}
      {invest.history.length > 1 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Evolução do patrimônio</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={invest.history.slice(-24)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false}
                tickFormatter={d => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { month: 'short' })} />
              <YAxis hide />
              <Tooltip formatter={v => fmtBRL(v)} labelFormatter={d => new Date(d + 'T12:00').toLocaleDateString('pt-BR')}
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="balance" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Projeção com cenário de aporte extra */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Projeção até a meta</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-text-dim text-xs">Aporte fixo</p><p className="font-bold text-text-main">{fmtBRL(projection.monthlyFixed)}</p></div>
          <div><p className="text-text-dim text-xs">Superávit médio (3m)</p><p className="font-bold text-text-main">{fmtBRL(projection.avgSurplus)}</p></div>
          <div><p className="text-text-dim text-xs">Aporte mensal total</p><p className="font-bold" style={{ color: '#10B981' }}>{fmtBRL(projection.monthlyContrib)}</p></div>
          <div><p className="text-text-dim text-xs">Faltam</p><p className="font-bold text-text-main">{fmtBRL(projection.remaining)}</p></div>
        </div>
        <div className="pt-2 border-t text-sm flex justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="text-text-muted">Chegada estimada</span>
          <span className="font-bold" style={{ color: '#38BDF8' }}>{projection.arrivalDate} ({projection.monthsLeft} meses)</span>
        </div>
        <div>
          <label className="text-xs text-text-dim block mb-1">Simular aporte extra mensal</label>
          <input type="number" className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            placeholder="Ex: 300" value={extraMonthly} onChange={e => setExtraMonthly(e.target.value)} />
        </div>
      </div>

      {/* Divisões percentuais */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Divisão do aporte</p>
          <span className="text-xs font-bold" style={{ color: Math.abs(totalPct - 1) < 0.001 ? '#10B981' : '#F59E0B' }}>{Math.round(totalPct * 100)}%</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {invest.divisions.map(d => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-sm text-text-main">{d.name}</span>
              </div>
              {editingDiv === d.id ? (
                <div className="flex items-center gap-1">
                  <input type="number" className="w-16 px-2 py-1 rounded-lg text-xs text-right outline-none"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--primary)', color: 'var(--text-main)' }}
                    value={divVal} onChange={e => setDivVal(e.target.value)} autoFocus />
                  <button onClick={() => saveDiv(d.id)} className="text-xs w-6 h-6 rounded" style={{ background: 'var(--primary)', color: 'white' }}>✓</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-main">{Math.round(d.pct * 100)}%</span>
                  <span className="text-xs text-text-dim">≈ {fmtBRL(projection.monthlyContrib * d.pct)}/mês</span>
                  <button onClick={() => { setEditingDiv(d.id); setDivVal(String(Math.round(d.pct * 100))) }} className="text-xs text-text-dim hover:text-text-muted">✎</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showHistoryModal && (
        <UpdateBalanceModal
          currentBalance={invest.currentBalance}
          onSave={(balance, note) => { addInvestHistory({ balance, note }); toast.success('Saldo atualizado!'); setShowHistoryModal(false) }}
          onClose={() => setShowHistoryModal(false)} />
      )}
    </div>
  )
}

function UpdateBalanceModal({ currentBalance, onSave, onClose }) {
  const [balance, setBalance] = useState(String(currentBalance))
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}><h3 className="font-semibold text-text-main">Atualizar saldo</h3></div>
        <div className="p-5 space-y-3">
          <input type="number" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            value={balance} onChange={e => setBalance(e.target.value)} autoFocus />
          <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            placeholder="Nota (opcional)" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
          <button onClick={() => onSave(Number(balance), note)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#38BDF8' }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── ENVELOPES / SINKING FUNDS (metas de curto prazo) ────────────────────────
function EnvelopesSection() {
  const { envelopes, addEnvelope, deleteEnvelope, depositEnvelope, withdrawEnvelope } = useFinanceStore()
  const projects = useProjectStore(s => s.projects)
  const personas = usePersonaStore(s => s.personas)
  const [showNew, setShowNew] = useState(false)
  const [depositTarget, setDepositTarget] = useState(null)
  const [depositVal, setDepositVal] = useState('')

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-dim px-1">Envelopes são reservas de curto prazo com nome e meta (ex: "Viagem em dezembro", "IPTU"). Diferente do cofre de investimento, esse dinheiro tem destino certo e sai do seu saldo livre.</p>

      {envelopes.map(env => {
        const pct = env.target > 0 ? Math.min(100, (env.current / env.target) * 100) : 0
        const project = projects.find(p => p.id === env.projectId)
        const persona = personas.find(p => p.id === env.personaId)
        return (
          <div key={env.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: `1px solid ${env.color}33` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-main flex items-center gap-2">{env.icon} {env.name} {env.goalReached && '🎉'}</span>
              <button onClick={() => { if (window.confirm('Excluir esta meta?')) deleteEnvelope(env.id) }} className="text-xs text-text-dim hover:text-red-400">✕</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {project && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--primary)22', color: 'var(--primary)' }}>◇ {project.nome || project.name}</span>}
              {persona && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: env.color + '22', color: env.color }}>{persona.icon} {persona.name}</span>}
              {env.deadline && <span className="text-xs text-text-dim">até {new Date(env.deadline + 'T12:00').toLocaleDateString('pt-BR')}</span>}
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: env.color }} />
            </div>
            <div className="flex justify-between text-xs mb-3">
              <span className="text-text-dim">{fmtBRL(env.current)} / {fmtBRL(env.target)}</span>
              <span className="font-semibold" style={{ color: env.color }}>{Math.round(pct)}%</span>
            </div>
            {depositTarget === env.id ? (
              <div className="flex gap-2">
                <input type="number" autoFocus className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: `1px solid ${env.color}`, color: 'var(--text-main)' }}
                  placeholder="Valor" value={depositVal} onChange={e => setDepositVal(e.target.value)} />
                <button onClick={() => { depositEnvelope(env.id, Number(depositVal)); setDepositTarget(null); setDepositVal('') }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: env.color }}>+ Depositar</button>
                <button onClick={() => { withdrawEnvelope(env.id, Number(depositVal)); setDepositTarget(null); setDepositVal('') }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-text-muted border" style={{ borderColor: 'var(--border)' }}>− Retirar</button>
                <button onClick={() => setDepositTarget(null)} className="text-xs text-text-dim">✕</button>
              </div>
            ) : (
              <button onClick={() => setDepositTarget(env.id)} className="w-full py-2 rounded-xl text-xs font-semibold border" style={{ borderColor: env.color + '44', color: env.color }}>
                + Movimentar
              </button>
            )}
          </div>
        )
      })}

      {envelopes.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-3xl mb-2 opacity-40">🎯</div>
          <p className="text-sm text-text-muted">Nenhuma meta criada ainda</p>
        </div>
      )}

      {showNew ? (
        <NewEnvelopeForm onClose={() => setShowNew(false)} onSave={(data) => { addEnvelope(data); setShowNew(false); toast.success('Meta criada!') }} projects={projects} personas={personas} />
      ) : (
        <button onClick={() => setShowNew(true)} className="w-full py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: 'var(--primary)44', color: 'var(--primary)' }}>
          + Nova meta / envelope
        </button>
      )}
    </div>
  )
}

function NewEnvelopeForm({ onClose, onSave, projects, personas }) {
  const [form, setForm] = useState({ name: '', target: '', icon: '🎯', color: '#38BDF8', deadline: '', projectId: '', personaId: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          placeholder="Ex: Viagem dezembro" value={form.name} onChange={e => set('name', e.target.value)} />
        <input type="number" className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          placeholder="Meta (R$)" value={form.target} onChange={e => set('target', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          placeholder="🏷 emoji" value={form.icon} onChange={e => set('icon', e.target.value)} />
        <input type="color" className="h-9 rounded-xl cursor-pointer" style={{ border: 'none' }} value={form.color} onChange={e => set('color', e.target.value)} />
        <input type="date" className="px-2 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          value={form.deadline} onChange={e => set('deadline', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          value={form.projectId} onChange={e => set('projectId', e.target.value)}>
          <option value="">Sem projeto</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.nome || p.name}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          value={form.personaId} onChange={e => set('personaId', e.target.value)}>
          <option value="">Sem persona</option>
          {personas.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs text-text-muted border" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
        <button onClick={() => onSave(form)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: form.color }}>Criar meta</button>
      </div>
    </div>
  )
}
