import { useState } from 'react'
import { useFinanceStore, monthKey, fmtBRL, parseMonthKey } from '../../../stores/useFinanceStore'
import toast from 'react-hot-toast'

function CardFormModal({ card = null, onClose }) {
  const { addCard, updateCard, deleteCard } = useFinanceStore()
  const [form, setForm] = useState({
    name:     card?.name     || '',
    color:    card?.color    || '#8A05BE',
    closeDay: card?.closeDay || 17,
    dueDay:   card?.dueDay   || 24,
    limit:    card?.limit    || 0,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return }
    if (card) updateCard(card.id, form)
    else addCard(form)
    toast.success(card ? 'Cartão atualizado!' : 'Cartão cadastrado!')
    onClose()
  }

  const handleDelete = () => {
    if (!window.confirm('Excluir este cartão? Lançamentos já feitos permanecem.')) return
    deleteCard(card.id)
    onClose()
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-text-main">{card ? 'Editar Cartão' : 'Novo Cartão'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Nome *</label>
            <input className={inp} style={inpSt} placeholder="Ex: Nubank" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Cor</label>
            <div className="flex items-center gap-3">
              <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border-0" style={{ background: 'none' }} value={form.color} onChange={e => set('color', e.target.value)} />
              <span className="text-sm text-text-dim">{form.color}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Fechamento (dia)</label>
              <input type="number" min={1} max={31} className={inp} style={inpSt} value={form.closeDay} onChange={e => set('closeDay', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Vencimento (dia)</label>
              <input type="number" min={1} max={31} className={inp} style={inpSt} value={form.dueDay} onChange={e => set('dueDay', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Limite (R$) — opcional</label>
            <input type="number" min={0} className={inp} style={inpSt} placeholder="0 = sem limite definido" value={form.limit} onChange={e => set('limit', Number(e.target.value))} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          {card && <button onClick={handleDelete} className="py-2.5 px-4 rounded-xl text-sm font-medium text-red-400 border hover:bg-red-500/10" style={{ borderColor: '#EF444433' }}>Excluir</button>}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function EditTxRow({ tx, catMap, card, onDone }) {
  const { updateTransaction } = useFinanceStore()
  const [draft, setDraft] = useState({ description: tx.description, amount: tx.amount, categoryId: tx.categoryId })

  const save = () => {
    if (!draft.description.trim() || !Number(draft.amount)) { toast.error('Verifique os campos'); return }
    updateTransaction(tx.id, { description: draft.description, amount: Number(draft.amount), categoryId: draft.categoryId })
    onDone()
    toast.success('Lançamento atualizado')
  }

  return (
    <div className="px-4 py-3 space-y-2" style={{ background: 'var(--bg-surface-2)' }}>
      <div className="flex gap-2">
        <input className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', color: 'var(--text-main)' }}
          value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} autoFocus />
        <input type="number" className="w-24 px-2 py-1.5 rounded-lg text-sm text-right outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', color: 'var(--text-main)' }}
          value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onDone} className="px-3 py-1.5 rounded-lg text-xs text-text-muted">Cancelar</button>
        <button onClick={save} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: card.color }}>Salvar</button>
      </div>
    </div>
  )
}

export function CardsTab() {
  const { cards, categories, getCardInvoice, deleteInstallmentGroup, deleteTransaction, getInvoiceStatus, closeInvoice, reopenInvoice, payInvoice } = useFinanceStore()
  const [selCard, setSelCard] = useState(cards[0]?.id || null)
  const [curMonth, setCurMonth] = useState(monthKey(new Date().getFullYear(), new Date().getMonth()))
  const [cardModal, setCardModal] = useState(null)
  const [editingTxId, setEditingTxId] = useState(null)
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const card = cards.find(c => c.id === selCard)
  const invoice = card ? getCardInvoice(selCard, curMonth) : []
  const total = invoice.reduce((a, t) => a + t.amount, 0)
  const status = card ? getInvoiceStatus(selCard, curMonth) : 'open'

  const navMonth = (dir) => {
    const { year, month } = parseMonthKey(curMonth)
    const d = new Date(year, month + dir, 1)
    setCurMonth(monthKey(d.getFullYear(), d.getMonth()))
  }

  const { year, month } = parseMonthKey(curMonth)
  const closeDate = card ? new Date(year, month, card.closeDay).toLocaleDateString('pt-BR') : '-'
  const dueDate   = card ? new Date(year, month, card.dueDay).toLocaleDateString('pt-BR')   : '-'
  const today = new Date()
  const isPastClose = card ? today >= new Date(year, month, card.closeDay) : false
  const daysToClose = card ? Math.ceil((new Date(year, month, card.closeDay) - today) / 86400000) : 0

  const handleDeleteTx = (tx) => {
    if (tx.groupId) {
      if (!window.confirm('Excluir todas as parcelas desta compra?')) return
      deleteInstallmentGroup(tx.groupId)
    } else {
      if (!window.confirm('Excluir este lançamento?')) return
      deleteTransaction(tx.id)
    }
  }

  const handlePay = () => {
    if (!window.confirm(`Confirmar pagamento da fatura de ${fmtBRL(total)}? Isso cria uma saída no seu extrato.`)) return
    payInvoice(selCard, curMonth)
    toast.success('Fatura marcada como paga! +5 XP')
  }

  const statusBadge = {
    open:   { label: isPastClose ? 'Aguardando fechamento manual' : `Aberta · fecha em ${Math.max(daysToClose, 0)} dias`, color: '#10B981' },
    closed: { label: `Fechada · vence ${dueDate}`, color: '#F59E0B' },
    paid:   { label: 'Paga ✓', color: '#38BDF8' },
  }[status]

  return (
    <div className="space-y-4">
      {/* Seletor de cartão */}
      <div className="flex gap-2 flex-wrap items-center">
        {cards.map(c => (
          <button key={c.id} onClick={() => setSelCard(c.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border"
            style={{
              borderColor: selCard === c.id ? c.color : 'var(--border)',
              background: selCard === c.id ? c.color + '22' : 'transparent',
              color: selCard === c.id ? c.color : 'var(--text-muted)',
            }}>
            <span>💳</span><span>{c.name}</span>
          </button>
        ))}
        <button onClick={() => setCardModal('new')}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
          + Cartão
        </button>
      </div>

      {card && (
        <>
          {/* Card visual */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${card.color}dd, ${card.color}88)` }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-bold text-lg">{card.name}</span>
                <button onClick={() => setCardModal(card)} className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10">✎ Editar</button>
              </div>
              {card.limit > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-white/80 text-xs mb-1"><span>Limite</span><span>{fmtBRL(card.limit)}</span></div>
                  <div className="h-1.5 rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white transition-all" style={{ width: `${Math.min(100, (total / card.limit) * 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="flex gap-4 text-white/80 text-xs">
                <span>Fecha: dia {card.closeDay}</span>
                <span>Vence: dia {card.dueDay}</span>
              </div>
            </div>
          </div>

          {/* Navegação de mês + status da fatura */}
          <div className="flex items-center justify-between">
            <button onClick={() => navMonth(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/8">◀</button>
            <div className="text-center">
              <div className="font-bold text-text-main capitalize">Fatura {new Date(curMonth + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
              <div className="text-xs" style={{ color: statusBadge.color }}>{statusBadge.label}</div>
            </div>
            <button onClick={() => navMonth(1)} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/8">▶</button>
          </div>

          {/* Total + ações de ciclo de vida */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-surface)', border: `1px solid ${card.color}33` }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Total da fatura</span>
              <span className="text-xl font-bold" style={{ color: card.color }}>{fmtBRL(total)}</span>
            </div>
            <div className="flex gap-2">
              {status === 'open' && (
                <button onClick={() => { closeInvoice(selCard, curMonth); toast.success('Fatura fechada — lançamentos travados') }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{ borderColor: '#F59E0B44', color: '#F59E0B' }}>
                  🔒 Fechar fatura
                </button>
              )}
              {status === 'closed' && (
                <>
                  <button onClick={() => { reopenInvoice(selCard, curMonth); toast('Fatura reaberta') }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    🔓 Reabrir
                  </button>
                  <button onClick={handlePay}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: '#38BDF8' }}>
                    ✓ Marcar como paga
                  </button>
                </>
              )}
              {status === 'paid' && (
                <div className="flex-1 py-2 rounded-xl text-xs font-semibold text-center" style={{ background: '#38BDF822', color: '#38BDF8' }}>
                  Fatura paga — bom trabalho! 🎉
                </div>
              )}
            </div>
          </div>

          {/* Itens da fatura */}
          {invoice.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3 opacity-30">💳</div>
              <p className="font-semibold text-text-muted">Nenhum gasto nesta fatura</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              {invoice
                .sort((a, b) => (b.purchaseDate || b.date || '').localeCompare(a.purchaseDate || a.date || ''))
                .map((tx, i) => {
                  const cat = catMap[tx.categoryId]
                  if (editingTxId === tx.id) {
                    return <EditTxRow key={tx.id} tx={tx} catMap={catMap} card={card} onDone={() => setEditingTxId(null)} />
                  }
                  return (
                    <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 ${i < invoice.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: (cat?.color || card.color) + '22' }}>
                        {cat?.icon || '💳'}
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => status !== 'paid' && setEditingTxId(tx.id)}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-text-main truncate">{tx.description}</span>
                          {tx.installments && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: card.color + '22', color: card.color }}>
                              {tx.installmentIndex}/{tx.installments}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-dim mt-0.5">
                          {cat?.name}
                          {tx.purchaseDate && tx.purchaseDate !== tx.date && (
                            <span className="ml-1">· comprado {new Date(tx.purchaseDate + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                          )}
                        </div>
                      </button>
                      <span className="text-sm font-bold text-text-main flex-shrink-0">{fmtBRL(tx.amount)}</span>
                      {status !== 'paid' && (
                        <>
                          <button onClick={() => setEditingTxId(tx.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-muted hover:bg-white/8 text-xs flex-shrink-0">✎</button>
                          <button onClick={() => handleDeleteTx(tx)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs flex-shrink-0">✕</button>
                        </>
                      )}
                    </div>
                  )
                })}
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                <span className="text-xs font-semibold text-text-muted">{invoice.length} lançamentos</span>
                <span className="text-sm font-bold text-text-main">{fmtBRL(total)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {!card && (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">💳</div>
          <p className="font-semibold text-text-muted mb-4">Nenhum cartão cadastrado</p>
          <button onClick={() => setCardModal('new')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--primary)' }}>+ Adicionar Cartão</button>
        </div>
      )}

      {cardModal && <CardFormModal card={cardModal === 'new' ? null : cardModal} onClose={() => setCardModal(null)} />}
    </div>
  )
}
