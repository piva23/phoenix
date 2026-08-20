import { useState, useMemo } from 'react'
import { useFinanceStore, monthKey, fmtBRL, parseMonthKey } from '../../../stores/useFinanceStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import { QuickAddModal } from './QuickAddModal'
import toast from 'react-hot-toast'

export function TransactionsTab() {
  const { transactions, categories, cards, deleteTransaction, deleteInstallmentGroup, updateTransaction } = useFinanceStore()
  const personas = usePersonaStore(s => s.personas)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState(monthKey(new Date().getFullYear(), new Date().getMonth()))
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})

  const catMap  = Object.fromEntries(categories.map(c => [c.id, c]))
  const cardMap = Object.fromEntries(cards.map(c => [c.id, c]))
  const personaMap = Object.fromEntries(personas.map(p => [p.id, p]))

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const txMonth = tx.invoiceMonth || tx.date?.slice(0, 7)
      const monthOk = txMonth === filterMonth
      const catOk   = !filterCat || tx.categoryId === filterCat
      return monthOk && catOk
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [transactions, filterMonth, filterCat])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(tx => {
      const d = tx.date || tx.invoiceMonth || ''
      if (!map[d]) map[d] = []
      map[d].push(tx)
    })
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const navMonth = (dir) => {
    const { year, month } = parseMonthKey(filterMonth)
    const d = new Date(year, month + dir, 1)
    setFilterMonth(monthKey(d.getFullYear(), d.getMonth()))
  }

  const handleDelete = (tx) => {
    if (tx.groupId) {
      if (!window.confirm('Excluir todas as parcelas desta compra?')) return
      deleteInstallmentGroup(tx.groupId)
      toast.success('Compra parcelada removida')
    } else {
      if (!window.confirm('Excluir lançamento?')) return
      deleteTransaction(tx.id)
    }
  }

  const startEdit = (tx) => {
    setEditingId(tx.id)
    setEditDraft({ description: tx.description, amount: tx.amount, categoryId: tx.categoryId, date: tx.date })
  }

  const saveEdit = (tx) => {
    if (!editDraft.description?.trim() || !Number(editDraft.amount) || Number(editDraft.amount) <= 0) {
      toast.error('Verifique a descrição e o valor'); return
    }
    updateTransaction(tx.id, {
      description: editDraft.description,
      amount: Number(editDraft.amount),
      categoryId: editDraft.categoryId,
      date: editDraft.date,
    })
    setEditingId(null)
    toast.success('Lançamento atualizado')
  }

  return (
    <div className="space-y-4">
      {/* Header + botão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/8">◀</button>
          <span className="text-sm font-semibold text-text-main capitalize">
            {new Date(filterMonth + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => navMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/8">▶</button>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>
          + Lançar
        </button>
      </div>

      {/* Filtro categoria */}
      <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
        value={filterCat} onChange={e => setFilterCat(e.target.value)}>
        <option value="">Todas as categorias</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
      </select>

      {/* Lista */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">💸</div>
          <p className="font-semibold text-text-muted mb-1">Nenhum lançamento</p>
          <p className="text-sm text-text-dim">Clique em + Lançar para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-2">
                {date.length === 10
                  ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
                  : date}
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                {txs.map((tx, i) => {
                  const cat  = catMap[tx.categoryId]
                  const card = tx.cardId ? cardMap[tx.cardId] : null
                  const persona = tx.personaId ? personaMap[tx.personaId] : null
                  const isIncome = tx.type === 'income'
                  const isEditing = editingId === tx.id

                  if (isEditing) {
                    return (
                      <div key={tx.id} className={`px-4 py-3 space-y-2 ${i < txs.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                        <div className="flex gap-2">
                          <input className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', color: 'var(--text-main)' }}
                            value={editDraft.description} onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))} autoFocus />
                          <input type="number" className="w-24 px-2 py-1.5 rounded-lg text-sm text-right outline-none"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', color: 'var(--text-main)' }}
                            value={editDraft.amount} onChange={e => setEditDraft(d => ({ ...d, amount: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                          <select className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                            value={editDraft.categoryId} onChange={e => setEditDraft(d => ({ ...d, categoryId: e.target.value }))}>
                            {categories.filter(c => c.type === tx.type).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                          </select>
                          <input type="date" className="px-2 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                            value={editDraft.date} onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs text-text-muted">Cancelar</button>
                          <button onClick={() => saveEdit(tx)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={tx.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i < txs.length - 1 ? 'border-b' : ''}`}
                      style={{ borderColor: 'var(--border)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: (cat?.color || 'var(--primary)') + '22' }}>
                        {cat?.icon || '💸'}
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => startEdit(tx)}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-text-main truncate">{tx.description}</span>
                          {tx.installments && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#8A05BE22', color: '#8A05BE' }}>
                              {tx.installmentIndex}/{tx.installments}
                            </span>
                          )}
                          {persona && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'var(--primary)22', color: 'var(--primary)' }}>
                              {persona.icon} {persona.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {cat && <span className="text-xs text-text-dim">{cat.name}</span>}
                          {card && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: card.color + '22', color: card.color }}>
                              {card.name}
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold" style={{ color: isIncome ? '#10B981' : 'var(--text-main)' }}>
                          {isIncome ? '+' : '-'}{fmtBRL(tx.amount)}
                        </div>
                      </div>
                      <button onClick={() => startEdit(tx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-muted hover:bg-white/8 text-xs flex-shrink-0">✎</button>
                      <button onClick={() => handleDelete(tx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs flex-shrink-0">✕</button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <QuickAddModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}
