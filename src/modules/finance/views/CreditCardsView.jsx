import { useState } from 'react'
import { useFinanceStore, monthKey, fmtBRL, parseMonthKey } from '../../../stores/useFinanceStore'
import toast from 'react-hot-toast'

export function CreditCardsView() {
  const {
    cards,
    categories,
    getCardInvoice,
    deleteInstallmentGroup,
    deleteTransaction,
    updateTransaction,
    getInvoiceStatus,
    closeInvoice,
    reopenInvoice,
    payInvoice,
    addCard
  } = useFinanceStore()

  const [selCard, setSelCard] = useState(cards[0]?.id || null)
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState(null) // Para o modal da fatura aberta
  const [editingTxId, setEditingTxId] = useState(null)
  const [editForm, setEditForm] = useState({ description: '', amount: '', categoryId: '' })
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCardForm, setNewCardForm] = useState({ name: '', color: '#8A05BE', closeDay: 10, dueDay: 17, limit: 1500 })

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const card = cards.find(c => c.id === selCard)

  // Gerar os últimos 3 meses e os próximos 3 meses para listagem de faturas
  const invoiceMonths = (() => {
    const months = []
    const today = new Date()
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
      months.push(monthKey(d.getFullYear(), d.getMonth()))
    }
    return months
  })()

  const handleSaveTxEdit = (txId) => {
    if (!editForm.description.trim() || !Number(editForm.amount)) {
      toast.error('Preencha os campos corretamente')
      return
    }
    updateTransaction(txId, {
      description: editForm.description,
      amount: Number(editForm.amount),
      categoryId: editForm.categoryId
    })
    setEditingTxId(null)
    toast.success('Compra atualizada com sucesso!')
  }

  const handleDeleteTx = (tx) => {
    if (tx.groupId) {
      if (!window.confirm('Esta é uma compra parcelada. Deseja excluir TODAS as parcelas vinculadas a ela?')) return
      deleteInstallmentGroup(tx.groupId)
      toast.success('Todas as parcelas foram removidas')
    } else {
      if (!window.confirm('Deseja excluir esta compra da fatura?')) return
      deleteTransaction(tx.id)
      toast.success('Compra removida')
    }
  }

  const handleCreateCard = () => {
    if (!newCardForm.name.trim()) {
      toast.error('O nome do cartão é obrigatório')
      return
    }
    addCard(newCardForm)
    setSelCard(`card_${Date.now()}`) // Provável ID gerado
    setShowAddCard(false)
    setNewCardForm({ name: '', color: '#8A05BE', closeDay: 10, dueDay: 17, limit: 1500 })
    toast.success('Novo cartão criado com sucesso!')
  }

  // Estatísticas e Informações para o modal selecionado
  const activeInvoiceTxs = card && selectedInvoiceMonth ? getCardInvoice(card.id, selectedInvoiceMonth) : []
  const activeInvoiceTotal = activeInvoiceTxs.reduce((sum, t) => sum + t.amount, 0)
  const activeInvoiceStatus = card && selectedInvoiceMonth ? getInvoiceStatus(card.id, selectedInvoiceMonth) : 'open'

  const activeInvoiceDates = () => {
    if (!card || !selectedInvoiceMonth) return { close: '-', due: '-' }
    const { year, month } = parseMonthKey(selectedInvoiceMonth)
    const close = new Date(year, month, card.closeDay).toLocaleDateString('pt-BR')
    const due = new Date(year, month, card.dueDay).toLocaleDateString('pt-BR')
    return { close, due }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="credit-cards-view">
      {/* Seletor de Cartões */}
      <div className="flex flex-wrap items-center gap-2.5">
        {cards.map(c => (
          <button
            key={c.id}
            id={`btn-card-select-${c.id}`}
            onClick={() => setSelCard(c.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border"
            style={{
              borderColor: selCard === c.id ? c.color : 'var(--border)',
              background: selCard === c.id ? `${c.color}15` : 'var(--bg-surface)',
              color: selCard === c.id ? c.color : 'var(--text-muted)',
            }}
          >
            <span>💳</span>
            <span>{c.name}</span>
          </button>
        ))}
        <button
          id="btn-add-card-toggle"
          onClick={() => setShowAddCard(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold border border-dashed text-text-dim hover:text-text-main hover:border-text-dim transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          + Adicionar Cartão
        </button>
      </div>

      {/* Modal / Formulário de Adicionar Cartão */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" id="add-card-modal">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-text-main text-sm">Criar Novo Cartão de Crédito</h3>
              <button onClick={() => setShowAddCard(false)} className="text-text-dim hover:text-text-main">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">Nome do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Inter, Apple Card"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:ring-1 text-text-main"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                  value={newCardForm.name}
                  onChange={e => setNewCardForm({ ...newCardForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">Dia de Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
                    style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                    value={newCardForm.closeDay}
                    onChange={e => setNewCardForm({ ...newCardForm, closeDay: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
                    style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                    value={newCardForm.dueDay}
                    onChange={e => setNewCardForm({ ...newCardForm, dueDay: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">Limite de Crédito (R$)</label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                  value={newCardForm.limit}
                  onChange={e => setNewCardForm({ ...newCardForm, limit: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">Cor Temática</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                    value={newCardForm.color}
                    onChange={e => setNewCardForm({ ...newCardForm, color: e.target.value })}
                  />
                  <span className="text-xs font-mono text-text-muted">{newCardForm.color}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setShowAddCard(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
              <button onClick={handleCreateCard} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {card && (
        <div className="space-y-6">
          {/* Card Visual Inspirado no Nubank / Apple Card */}
          <div
            className="rounded-3xl p-6 relative overflow-hidden text-white shadow-xl transition-all hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}bb 100%)`,
              boxShadow: `0 12px 30px ${card.color}25`
            }}
            id={`visual-card-${card.id}`}
          >
            <div className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-10 bg-white" style={{ transform: 'translate(20%, -20%)' }} />
            <div className="relative z-10 flex flex-col justify-between h-40">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Cartão de Crédito</span>
                  <h2 className="text-xl font-black tracking-tight mt-1">{card.name}</h2>
                </div>
                <div className="text-2xl font-black">💳</div>
              </div>

              <div>
                {card.limit > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-semibold opacity-90 mb-1">
                      <span>Limite Disponível</span>
                      <span>{fmtBRL(card.limit)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (getCardInvoice(card.id, monthKey(new Date().getFullYear(), new Date().getMonth())).reduce((s, t) => s + t.amount, 0) / card.limit) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-5 text-[11px] font-bold opacity-80 uppercase tracking-wider">
                  <span>Fechamento: Dia {card.closeDay}</span>
                  <span>Vencimento: Dia {card.dueDay}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico e Próximas Faturas */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">Faturas do Cartão</h3>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {invoiceMonths.map((mk) => {
                const txs = getCardInvoice(card.id, mk)
                const total = txs.reduce((sum, t) => sum + t.amount, 0)
                const status = getInvoiceStatus(card.id, mk)
                const { year, month } = parseMonthKey(mk)
                const label = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                
                const statusInfo = {
                  open: { label: 'Aberta', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  closed: { label: 'Fechada', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  paid: { label: 'Paga ✓', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                }[status] || { label: 'Aberta', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }

                return (
                  <button
                    key={mk}
                    onClick={() => setSelectedInvoiceMonth(mk)}
                    className="flex flex-col justify-between p-4 rounded-2xl border text-left bg-surface hover:border-primary transition-all duration-200"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                    id={`invoice-card-${mk}`}
                  >
                    <div className="w-full flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-text-main capitalize">{label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-text-dim">Total da Fatura</span>
                      <p className="text-lg font-extrabold mt-0.5 text-text-main">{fmtBRL(total)}</p>
                    </div>
                    <span className="text-[10px] font-bold text-text-dim mt-2 hover:text-text-main transition-colors block">
                      Ver lançamentos →
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhado da Fatura */}
      {selectedInvoiceMonth && card && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" id="invoice-detail-modal">
          <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}>
            
            {/* Header do Modal */}
            <div className="p-6 border-b flex items-start justify-between" style={{ borderColor: 'var(--border)', background: `${card.color}0a` }}>
              <div>
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-1">Detalhamento da Fatura</span>
                <h3 className="text-lg font-black text-text-main capitalize">
                  {new Date(parseMonthKey(selectedInvoiceMonth).year, parseMonthKey(selectedInvoiceMonth).month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-text-dim mt-1">
                  Fechamento em <span className="font-semibold text-text-main">{activeInvoiceDates().close}</span> · Vencimento em <span className="font-semibold text-text-main">{activeInvoiceDates().due}</span>
                </p>
              </div>
              <button
                onClick={() => { setSelectedInvoiceMonth(null); setEditingTxId(null) }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-dim hover:text-text-main bg-white/5 hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Resumo Financeiro & Ciclo de Vida da Fatura */}
            <div className="p-6 bg-surface-2 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <div>
                <span className="text-xs text-text-dim font-medium">Valor Total Acumulado</span>
                <h4 className="text-2xl font-black mt-0.5" style={{ color: card.color }}>{fmtBRL(activeInvoiceTotal)}</h4>
              </div>
              
              <div className="flex gap-2">
                {activeInvoiceStatus === 'open' && (
                  <button
                    onClick={() => { closeInvoice(card.id, selectedInvoiceMonth); toast.success('Fatura fechada — lançamentos travados') }}
                    className="px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1 text-amber-500 border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                  >
                    🔒 Fechar Fatura
                  </button>
                )}
                {activeInvoiceStatus === 'closed' && (
                  <>
                    <button
                      onClick={() => { reopenInvoice(card.id, selectedInvoiceMonth); toast('Fatura reaberta') }}
                      className="px-4 py-2 rounded-xl text-xs font-bold border text-text-muted border-border hover:bg-white/5 transition-colors"
                    >
                      🔓 Reabrir
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`Deseja marcar esta fatura de ${fmtBRL(activeInvoiceTotal)} como paga? Isso debitará o valor no seu extrato.`)) return
                        payInvoice(card.id, selectedInvoiceMonth)
                        toast.success('Fatura marcada como paga! +5 XP')
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-95 transition-all"
                      style={{ background: 'var(--primary)' }}
                    >
                      ✓ Marcar como Paga
                    </button>
                  </>
                )}
                {activeInvoiceStatus === 'paid' && (
                  <span className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Fatura Paga com Sucesso 🎉
                  </span>
                )}
              </div>
            </div>

            {/* Lista de Compras */}
            <div className="max-h-[350px] overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
              {activeInvoiceTxs.length === 0 ? (
                <div className="p-8 text-center text-text-dim text-xs">
                  Não existem lançamentos vinculados a esta fatura.
                </div>
              ) : (
                activeInvoiceTxs
                  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                  .map((tx) => {
                    const isEditing = editingTxId === tx.id
                    const cat = catMap[tx.categoryId]

                    return (
                      <div key={tx.id} className="p-4 flex flex-col gap-3 hover:bg-white/[0.01] transition-colors" id={`tx-item-${tx.id}`}>
                        {isEditing ? (
                          /* Modo Edição Form */
                          <div className="space-y-3 bg-surface-2 p-3.5 rounded-2xl border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Descrição</label>
                                <input
                                  type="text"
                                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none text-text-main border"
                                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                                  value={editForm.description}
                                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Valor (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none text-text-main border"
                                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                                  value={editForm.amount}
                                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-text-dim block mb-1">Categoria</label>
                              <select
                                className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none text-text-main border"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                                value={editForm.categoryId}
                                onChange={e => setEditForm({ ...editForm, categoryId: e.target.value })}
                              >
                                {categories.filter(c => c.type === 'expense').map(c => (
                                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingTxId(null)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-text-dim hover:text-text-main"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveTxEdit(tx.id)}
                                className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:opacity-90"
                                style={{ background: card.color }}
                              >
                                Salvar Alterações
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Modo Visualização normal */
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                                style={{ background: `${cat?.color || card.color}20`, color: cat?.color || card.color }}
                              >
                                {cat?.icon || '💳'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-text-main truncate">{tx.description}</span>
                                  {tx.installments && (
                                    <span
                                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                      style={{ background: `${card.color}15`, color: card.color }}
                                    >
                                      {tx.installmentIndex}/{tx.installments}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-text-dim block capitalize">
                                  {cat?.name || 'Gasto no Cartão'} · {tx.date ? new Date(tx.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-text-main">{fmtBRL(tx.amount)}</span>
                              {activeInvoiceStatus !== 'paid' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingTxId(tx.id)
                                      setEditForm({ description: tx.description, amount: String(tx.amount), categoryId: tx.categoryId })
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-white/5 text-xs transition-colors"
                                    title="Editar compra"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTx(tx)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                                    title="Excluir compra"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-5 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => { setSelectedInvoiceMonth(null); setEditingTxId(null) }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-text-muted border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                Fechar Detalhes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
