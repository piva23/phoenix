import { useState, useMemo } from 'react'
import { useFinanceStore, fmtBRL } from '../../../stores/useFinanceStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import toast from 'react-hot-toast'

const todayStr = () => new Date().toISOString().split('T')[0]

// Chips de valor rápido — atalhos comuns
const QUICK_VALUES = [10, 20, 50, 100, 200]

export function QuickAddModal({ onClose }) {
  const { categories, cards, transactions, addTransaction, addInstallmentPurchase } = useFinanceStore()
  const personas = usePersonaStore(s => s.personas)

  const [type, setType] = useState('expense') // income | expense
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [cardId, setCardId] = useState('')
  const [installments, setInstallments] = useState(2)
  const [isInstallment, setIsInstallment] = useState(false)
  const [personaId, setPersonaId] = useState('')

  const cats = categories.filter(c => c.type === type)

  // Categorias mais usadas recentemente — pra virar chip de 1 toque
  const topCategories = useMemo(() => {
    const counts = {}
    transactions.filter(t => t.type === type).forEach(t => {
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1
    })
    return [...cats].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)).slice(0, 6)
  }, [transactions, type])

  const handleSave = () => {
    const val = Number(amount)
    if (!val || val <= 0) { toast.error('Informe um valor válido'); return }
    if (!categoryId) { toast.error('Escolha uma categoria'); return }

    if (isInstallment) {
      if (!cardId) { toast.error('Selecione o cartão'); return }
      addInstallmentPurchase({
        description: description || cats.find(c => c.id === categoryId)?.name || 'Compra',
        categoryId, totalAmount: val, installments: Number(installments),
        cardId, purchaseDate: date, personaId: personaId || null,
      })
      toast.success(`Parcelado em ${installments}x lançado!`)
    } else {
      addTransaction({
        description: description || cats.find(c => c.id === categoryId)?.name || (type === 'income' ? 'Receita' : 'Despesa'),
        categoryId, amount: val, type, date,
        cardId: (type === 'expense' && cardId) ? cardId : null,
        personaId: personaId || null,
      })
      toast.success(type === 'income' ? 'Receita lançada!' : 'Despesa lançada!')
    }
    onClose()
  }

  const accent = type === 'income' ? '#10B981' : '#EF4444'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
        onClick={e => e.stopPropagation()}>

        {/* Toggle receita/despesa */}
        <div className="flex p-1 m-4 mb-0 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
          {[{ id: 'expense', label: '↓ Despesa', color: '#EF4444' }, { id: 'income', label: '↑ Receita', color: '#10B981' }].map(t => (
            <button key={t.id} onClick={() => { setType(t.id); setCategoryId('') }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: type === t.id ? t.color : 'transparent', color: type === t.id ? '#fff' : 'var(--text-muted)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Valor grande */}
        <div className="px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold" style={{ color: accent }}>R$</span>
            <input
              autoFocus
              inputMode="decimal"
              placeholder="0,00"
              className="text-4xl font-bold text-center bg-transparent outline-none w-48"
              style={{ color: 'var(--text-main)' }}
              value={amount}
              onChange={e => setAmount(e.target.value.replace(',', '.'))}
            />
          </div>
          <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
            {QUICK_VALUES.map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {fmtBRL(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Categorias em chips */}
        <div className="px-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Categoria</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {(topCategories.length ? topCategories : cats).map(c => (
              <button key={c.id} onClick={() => setCategoryId(c.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  borderColor: categoryId === c.id ? c.color : 'var(--border)',
                  background: categoryId === c.id ? c.color + '22' : 'transparent',
                  color: categoryId === c.id ? c.color : 'var(--text-muted)',
                }}>
                <span>{c.icon}</span><span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Descrição opcional */}
        <div className="px-4 mt-4">
          <input
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            placeholder="Descrição (opcional)"
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Avançado */}
        <div className="px-4 mt-3">
          <button onClick={() => setAdvanced(a => !a)} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
            {advanced ? '▲ Ocultar opções avançadas' : '▼ Data, cartão, parcelas, persona...'}
          </button>
        </div>

        {advanced && (
          <div className="px-4 mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-dim block mb-1">Data</label>
                <input type="date" className="w-full px-2 py-2 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                  value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-text-dim block mb-1">Persona</label>
                <select className="w-full px-2 py-2 rounded-lg text-xs outline-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                  value={personaId} onChange={e => setPersonaId(e.target.value)}>
                  <option value="">—</option>
                  {personas.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
                </select>
              </div>
            </div>

            {type === 'expense' && (
              <>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isInst" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} />
                  <label htmlFor="isInst" className="text-xs text-text-muted">Compra parcelada no cartão</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-dim block mb-1">Cartão</label>
                    <select className="w-full px-2 py-2 rounded-lg text-xs outline-none"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                      value={cardId} onChange={e => setCardId(e.target.value)}>
                      <option value="">Débito / Pix / Dinheiro</option>
                      {cards.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {isInstallment && (
                    <div>
                      <label className="text-xs text-text-dim block mb-1">Parcelas</label>
                      <select className="w-full px-2 py-2 rounded-lg text-xs outline-none"
                        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                        value={installments} onChange={e => setInstallments(e.target.value)}>
                        {[2,3,4,5,6,8,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 p-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90" style={{ background: accent }}>
            Lançar
          </button>
        </div>
      </div>
    </div>
  )
}
