import { useState } from 'react'
import { useFinanceStore, monthKey, fmtBRL, parseMonthKey, todayKey } from '../../../stores/useFinanceStore'
import { useProjectStore } from '../../../stores/useProjectStore'
import toast from 'react-hot-toast'

export function BudgetTab() {
  const [section, setSection] = useState('orcamento') // orcamento | grupos | recorrentes
  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
        {[
          { id: 'orcamento', label: 'Orçamento' },
          { id: 'grupos', label: 'Grupos' },
          { id: 'recorrentes', label: 'Fixos & Recorrentes' },
        ].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: section === t.id ? 'var(--primary)' : 'transparent', color: section === t.id ? '#fff' : 'var(--text-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>
      {section === 'orcamento' && <BudgetSection />}
      {section === 'grupos' && <GroupsSection />}
      {section === 'recorrentes' && <RecurringSection />}
    </div>
  )
}

// ── ORÇAMENTO POR CATEGORIA (base zero) ─────────────────────────────────────
function BudgetSection() {
  const { categories, budgets, setBudget, copyBudgetFromPrev, getMonthByCategory, getMonthSummary, getZeroBasedSummary } = useFinanceStore()
  const [curKey, setCurKey] = useState(monthKey(new Date().getFullYear(), new Date().getMonth()))
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [showCatModal, setShowCatModal] = useState(false)

  const budget   = budgets[curKey] || {}
  const byCat    = getMonthByCategory(curKey)
  const summary  = getMonthSummary(curKey)
  const zeroBased = getZeroBasedSummary(curKey)

  const navMonth = (dir) => {
    const { year, month } = parseMonthKey(curKey)
    const d = new Date(year, month + dir, 1)
    setCurKey(monthKey(d.getFullYear(), d.getMonth()))
  }

  const saveEdit = (catId) => {
    const val = Number(editVal)
    if (isNaN(val) || val < 0) return
    setBudget(curKey, catId, val)
    setEditing(null)
    setEditVal('')
  }

  const handleCopy = () => {
    const ok = copyBudgetFromPrev(curKey)
    if (ok) toast.success('Orçamento copiado do mês anterior!')
    else toast.error('Não há orçamento no mês anterior para copiar.')
  }

  const expCats = categories.filter(c => c.type === 'expense')
  const incCats = categories.filter(c => c.type === 'income')

  const totalBudgeted = expCats.reduce((a, c) => a + (budget[c.id] || 0), 0)
  const totalSpent    = expCats.reduce((a, c) => a + (byCat[c.id] || 0), 0)
  const totalInc      = incCats.reduce((a, c) => a + (budget[c.id] || 0), 0)

  const monthLabel = new Date(curKey + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/8">◀</button>
          <span className="text-sm font-semibold text-text-main capitalize">{monthLabel}</span>
          <button onClick={() => navMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/8">▶</button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            📋 Copiar mês anterior
          </button>
          <button onClick={() => setShowCatModal(true)} className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all" style={{ borderColor: 'var(--primary)44', color: 'var(--primary)', background: 'var(--primary)0f' }}>
            ⚙ Categorias
          </button>
        </div>
      </div>

      {/* Orçamento base-zero: todo real tem destino */}
      <div className="rounded-2xl p-4" style={{ background: zeroBased.unassigned === 0 ? '#10B98111' : 'var(--bg-surface)', border: `1px solid ${zeroBased.unassigned === 0 ? '#10B98144' : 'var(--border)'}` }}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Orçamento base zero</p>
        <div className="flex justify-between text-sm">
          <span className="text-text-dim">Receita fixa planejada</span>
          <span className="font-bold text-text-main">{fmtBRL(zeroBased.plannedIncome)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-text-dim">Total orçado em despesas</span>
          <span className="font-bold text-text-main">{fmtBRL(zeroBased.plannedExpense)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="font-semibold text-text-main">{zeroBased.unassigned === 0 ? '✓ Todo real tem destino' : zeroBased.unassigned > 0 ? 'Ainda sem destino' : 'Orçamento estourado'}</span>
          <span className="font-bold" style={{ color: zeroBased.unassigned === 0 ? '#10B981' : zeroBased.unassigned > 0 ? '#F59E0B' : '#EF4444' }}>{fmtBRL(zeroBased.unassigned)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Orçado',   value: totalBudgeted, color: '#38BDF8' },
          { label: 'Gasto',    value: totalSpent,    color: totalSpent > totalBudgeted ? '#EF4444' : '#F59E0B' },
          { label: 'Sobrou',   value: totalBudgeted - totalSpent, color: (totalBudgeted - totalSpent) >= 0 ? '#10B981' : '#EF4444' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-3 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="text-sm font-bold" style={{ color: k.color }}>{fmtBRL(k.value)}</div>
            <div className="text-xs text-text-dim mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#10B98108' }}>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">↑ Receitas</span>
          <span className="text-xs font-bold" style={{ color: '#10B981' }}>Orçado: {fmtBRL(totalInc)}</span>
        </div>
        {incCats.map((cat, i) => (
          <BudgetRow key={cat.id} cat={cat} budgeted={budget[cat.id] || 0} spent={byCat[cat.id] || 0}
            isLast={i === incCats.length - 1} isIncome
            editing={editing === cat.id} editVal={editVal}
            onEdit={() => { setEditing(cat.id); setEditVal(String(budget[cat.id] || '')) }}
            onEditVal={setEditVal} onSave={() => saveEdit(cat.id)} onCancel={() => { setEditing(null); setEditVal('') }} />
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#EF444408' }}>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">↓ Despesas</span>
          <span className="text-xs font-bold" style={{ color: '#EF4444' }}>Orçado: {fmtBRL(totalBudgeted)}</span>
        </div>
        {expCats.map((cat, i) => (
          <BudgetRow key={cat.id} cat={cat} budgeted={budget[cat.id] || 0} spent={byCat[cat.id] || 0}
            isLast={i === expCats.length - 1}
            editing={editing === cat.id} editVal={editVal}
            onEdit={() => { setEditing(cat.id); setEditVal(String(budget[cat.id] || '')) }}
            onEditVal={setEditVal} onSave={() => saveEdit(cat.id)} onCancel={() => { setEditing(null); setEditVal('') }} />
        ))}
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-main">Saldo projetado do mês</p>
            <p className="text-xs text-text-dim mt-0.5">Receitas orçadas − Despesas orçadas</p>
          </div>
          <span className="text-xl font-bold" style={{ color: (totalInc - totalBudgeted) >= 0 ? '#10B981' : '#EF4444' }}>{fmtBRL(totalInc - totalBudgeted)}</span>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-sm font-semibold text-text-main">Saldo real do mês</p>
            <p className="text-xs text-text-dim mt-0.5">Receitas reais − Despesas reais</p>
          </div>
          <span className="text-xl font-bold" style={{ color: summary.balance >= 0 ? '#10B981' : '#EF4444' }}>{fmtBRL(summary.balance)}</span>
        </div>
      </div>

      {showCatModal && <CategoryModal onClose={() => setShowCatModal(false)} />}
    </div>
  )
}

function BudgetRow({ cat, budgeted, spent, isLast, isIncome, editing, editVal, onEdit, onEditVal, onSave, onCancel }) {
  const diff = budgeted - spent
  const pct  = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0
  const over = !isIncome && budgeted > 0 && spent > budgeted

  return (
    <div className={`px-4 py-3 ${!isLast ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3">
        <span className="text-base flex-shrink-0">{cat.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-text-main truncate">{cat.name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {editing ? (
                <div className="flex items-center gap-1">
                  <input type="number" min={0} step={10}
                    className="w-24 px-2 py-1 rounded-lg text-xs text-right outline-none"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--primary)', color: 'var(--text-main)' }}
                    value={editVal} onChange={e => onEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }} autoFocus />
                  <button onClick={onSave} className="text-xs w-6 h-6 flex items-center justify-center rounded" style={{ background: 'var(--primary)', color: 'white' }}>✓</button>
                  <button onClick={onCancel} className="text-xs text-text-dim hover:text-text-muted">✕</button>
                </div>
              ) : (
                <>
                  <span className="text-xs text-text-dim">{fmtBRL(spent)}</span>
                  {budgeted > 0 && <span className="text-xs text-text-dim">/ {fmtBRL(budgeted)}</span>}
                  <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center rounded-lg text-text-dim hover:text-text-muted hover:bg-white/8 text-xs">✎</button>
                </>
              )}
            </div>
          </div>
          {budgeted > 0 && !editing && (
            <div className="mt-1.5">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#EF4444' : isIncome ? '#10B981' : cat.color }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                {over ? <span style={{ color: '#EF4444' }}>⚠ Estourou {fmtBRL(Math.abs(diff))}</span> : <span style={{ color: '#10B981' }}>✓ Sobrou {fmtBRL(diff)}</span>}
                <span className="text-text-dim">{Math.round(pct)}%</span>
              </div>
            </div>
          )}
          {budgeted === 0 && !editing && spent > 0 && <p className="text-xs text-text-dim mt-0.5">Sem orçamento definido · clique ✎ para definir</p>}
        </div>
      </div>
    </div>
  )
}

function CategoryModal({ onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinanceStore()
  const [form, setForm] = useState({ name: '', type: 'expense', color: '#6366F1', icon: '💸' })
  const [editId, setEditId] = useState(null)
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editId) { updateCategory(editId, form); setEditId(null) }
    else addCategory(form)
    setForm({ name: '', type: 'expense', color: '#6366F1', icon: '💸' })
  }

  const inp = 'px-2 py-1.5 rounded-lg text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-text-main">Categorias</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 p-3 rounded-xl border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <span className="text-lg">{cat.icon}</span>
              <span className="flex-1 text-sm text-text-main">{cat.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cat.color + '22', color: cat.color }}>{cat.type === 'income' ? 'receita' : 'despesa'}</span>
              <button onClick={() => { setEditId(cat.id); setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon }) }} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-muted hover:bg-white/8 text-xs">✎</button>
              <button onClick={() => deleteCategory(cat.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs">✕</button>
            </div>
          ))}
        </div>
        <div className="p-5 border-t space-y-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{editId ? 'Editando categoria' : 'Nova categoria'}</p>
          <div className="flex gap-2">
            <input className={`${inp} w-10`} style={inpSt} placeholder="🏷" value={form.icon} onChange={e => setF('icon', e.target.value)} />
            <input className={`${inp} flex-1`} style={inpSt} placeholder="Nome da categoria" value={form.name} onChange={e => setF('name', e.target.value)} />
            <select className={`${inp}`} style={inpSt} value={form.type} onChange={e => setF('type', e.target.value)}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
            <input type="color" className="w-10 h-9 rounded-lg cursor-pointer" style={{ border: 'none', background: 'none' }} value={form.color} onChange={e => setF('color', e.target.value)} />
          </div>
          <button onClick={handleSave} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: editId ? '#10B981' : 'var(--primary)' }}>
            {editId ? '✓ Salvar edição' : '+ Adicionar'}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm({ name: '', type: 'expense', color: '#6366F1', icon: '💸' }) }} className="w-full py-2 rounded-xl text-xs font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
              Cancelar edição
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── GRUPOS DE CATEGORIA ──────────────────────────────────────────────────────
function GroupsSection() {
  const { categoryGroups, categories, addCategoryGroup, updateCategoryGroup, deleteCategoryGroup, moveCategoryToGroup, getGroupForCategory } = useFinanceStore()
  const [newGroupName, setNewGroupName] = useState('')

  const ungrouped = categories.filter(c => !getGroupForCategory(c.id))

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-dim px-1">Organize suas categorias em grupos (ex: "Casa" reúne Moradia + Mercado + Serviços) para visualizar melhor pra onde vai o dinheiro.</p>

      {categoryGroups.map(group => (
        <div key={group.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: `1px solid ${group.color}33` }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: group.color + '11' }}>
            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: group.color }}>{group.icon} {group.name}</span>
            <button onClick={() => { if (window.confirm('Excluir grupo? As categorias voltam para "sem grupo".')) deleteCategoryGroup(group.id) }}
              className="text-xs text-text-dim hover:text-red-400">✕</button>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {group.categoryIds.map(cid => {
              const cat = categories.find(c => c.id === cid)
              if (!cat) return null
              return (
                <span key={cid} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-main)' }}>
                  {cat.icon} {cat.name}
                  <button onClick={() => moveCategoryToGroup(cid, null)} className="text-text-dim hover:text-red-400">✕</button>
                </span>
              )
            })}
            {group.categoryIds.length === 0 && <span className="text-xs text-text-dim italic">Nenhuma categoria neste grupo ainda</span>}
          </div>
          {/* Adicionar categoria a este grupo */}
          <div className="px-3 pb-3">
            <select className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              value="" onChange={e => { if (e.target.value) moveCategoryToGroup(e.target.value, group.id) }}>
              <option value="">+ Adicionar categoria a este grupo...</option>
              {categories.filter(c => !group.categoryIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="rounded-2xl p-3" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)' }}>
          <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">Sem grupo</p>
          <div className="flex flex-wrap gap-2">
            {ungrouped.map(c => <span key={c.id} className="px-2.5 py-1.5 rounded-lg text-xs text-text-muted" style={{ background: 'var(--bg-surface-2)' }}>{c.icon} {c.name}</span>)}
          </div>
        </div>
      )}

      {/* Novo grupo */}
      <div className="rounded-2xl p-4 flex gap-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <input className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          placeholder="Nome do novo grupo (ex: Lazer)" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
        <button onClick={() => { if (newGroupName.trim()) { addCategoryGroup({ name: newGroupName, icon: '📁', color: '#94A3B8' }); setNewGroupName('') } }}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--primary)' }}>+ Criar</button>
      </div>
    </div>
  )
}

// ── RECEITAS E DESPESAS RECORRENTES ─────────────────────────────────────────
function RecurringSection() {
  const {
    recurringIncomes, recurringExpenses, categories, cards,
    addRecurringIncome, deleteRecurringIncome, updateRecurringIncome,
    addRecurringExpense, deleteRecurringExpense, updateRecurringExpense,
    confirmRecurringIncome, confirmRecurringExpense, isRecurringConfirmed, getPendingRecurring,
  } = useFinanceStore()
  const projects = useProjectStore(s => s.projects)
  const mk = todayKey()
  const pending = getPendingRecurring(mk)

  const [incForm, setIncForm] = useState({ name: '', amount: '', categoryId: 'sal_fim', days: '15,30' })
  const [expForm, setExpForm] = useState({ name: '', amount: '', categoryId: 'moradia', day: 5, cardId: '', projectId: '' })

  const incCats = categories.filter(c => c.type === 'income')
  const expCats = categories.filter(c => c.type === 'expense')

  const saveIncome = () => {
    if (!incForm.name.trim() || !Number(incForm.amount)) { toast.error('Preencha nome e valor'); return }
    const days = incForm.days.split(',').map(d => Number(d.trim())).filter(Boolean)
    addRecurringIncome({ name: incForm.name, amount: Number(incForm.amount), categoryId: incForm.categoryId, daysOfMonth: days })
    setIncForm({ name: '', amount: '', categoryId: 'sal_fim', days: '15,30' })
    toast.success('Receita fixa cadastrada!')
  }

  const saveExpense = () => {
    if (!expForm.name.trim() || !Number(expForm.amount)) { toast.error('Preencha nome e valor'); return }
    addRecurringExpense({ name: expForm.name, amount: Number(expForm.amount), categoryId: expForm.categoryId, dayOfMonth: Number(expForm.day), cardId: expForm.cardId || null, projectId: expForm.projectId || null })
    setExpForm({ name: '', amount: '', categoryId: 'moradia', day: 5, cardId: '', projectId: '' })
    toast.success('Despesa fixa cadastrada!')
  }

  return (
    <div className="space-y-4">
      {/* Pendências do mês */}
      {pending.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#F59E0B11', border: '1px solid #F59E0B33' }}>
          <div className="px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F59E0B' }}>Pendentes de confirmação este mês</p></div>
          <div className="divide-y" style={{ borderColor: '#F59E0B22' }}>
            {pending.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-text-main">{p.name}</p>
                  <p className="text-xs text-text-dim">dia {p.day} · {fmtBRL(p.amount)}</p>
                </div>
                <button
                  onClick={() => {
                    if (p.kind === 'income') confirmRecurringIncome(p.id, p.day, mk)
                    else confirmRecurringExpense(p.id, mk)
                    toast.success('Confirmado!')
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: p.kind === 'income' ? '#10B981' : '#EF4444' }}>
                  ✓ Confirmar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receitas fixas */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#10B98108' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">↑ Receitas fixas (ex: salário dias 15 e 30)</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {recurringIncomes.map(r => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-text-main font-medium">{r.name}</p>
                <p className="text-xs text-text-dim">dias {r.daysOfMonth.join(', ')} · {fmtBRL(r.amount)}/pagamento</p>
              </div>
              <button onClick={() => deleteRecurringIncome(r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs">✕</button>
            </div>
          ))}
          {recurringIncomes.length === 0 && <p className="text-xs text-text-dim px-4 py-3 italic">Nenhuma receita fixa cadastrada</p>}
        </div>
        <div className="p-4 space-y-2" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Ex: Salário" value={incForm.name} onChange={e => setIncForm(f => ({ ...f, name: e.target.value }))} />
            <input type="number" className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Valor por pagamento" value={incForm.amount} onChange={e => setIncForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              value={incForm.categoryId} onChange={e => setIncForm(f => ({ ...f, categoryId: e.target.value }))}>
              {incCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Dias (ex: 15,30)" value={incForm.days} onChange={e => setIncForm(f => ({ ...f, days: e.target.value }))} />
          </div>
          <button onClick={saveIncome} className="w-full py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#10B981' }}>+ Cadastrar receita fixa</button>
        </div>
      </div>

      {/* Despesas fixas */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#EF444408' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">↓ Contas fixas (aluguel, assinaturas...)</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {recurringExpenses.map(r => {
            const project = projects.find(p => p.id === r.projectId)
            return (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-text-main font-medium">{r.name} {project && <span className="text-xs" style={{ color: 'var(--primary)' }}>· {project.nome || project.name}</span>}</p>
                  <p className="text-xs text-text-dim">dia {r.dayOfMonth} · {fmtBRL(r.amount)}</p>
                </div>
                <button onClick={() => deleteRecurringExpense(r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs">✕</button>
              </div>
            )
          })}
          {recurringExpenses.length === 0 && <p className="text-xs text-text-dim px-4 py-3 italic">Nenhuma conta fixa cadastrada</p>}
        </div>
        <div className="p-4 space-y-2" style={{ background: 'var(--bg-surface-2)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Ex: Aluguel" value={expForm.name} onChange={e => setExpForm(f => ({ ...f, name: e.target.value }))} />
            <input type="number" className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Valor" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              value={expForm.categoryId} onChange={e => setExpForm(f => ({ ...f, categoryId: e.target.value }))}>
              {expCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="number" min={1} max={31} className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Dia do mês" value={expForm.day} onChange={e => setExpForm(f => ({ ...f, day: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              value={expForm.cardId} onChange={e => setExpForm(f => ({ ...f, cardId: e.target.value }))}>
              <option value="">Sem cartão (débito/pix)</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="px-3 py-2 rounded-xl text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              value={expForm.projectId} onChange={e => setExpForm(f => ({ ...f, projectId: e.target.value }))}>
              <option value="">Sem vínculo com projeto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.nome || p.name}</option>)}
            </select>
          </div>
          <button onClick={saveExpense} className="w-full py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#EF4444' }}>+ Cadastrar conta fixa</button>
        </div>
      </div>
    </div>
  )
}
