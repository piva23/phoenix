import { useState, useMemo } from 'react'
import { useFinanceStore, fmtBRL } from '../../../stores/useFinanceStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import toast from 'react-hot-toast'

const todayStr = () => new Date().toISOString().split('T')[0]
const QUICK_VALUES = [10, 25, 50, 100, 150]

export function parseNubankNotification(text) {
  if (!text) return null

  // 1. Regex de valor: pega R$ seguido de números, pontos e vírgulas (ex: R$ 50,00 ou R$ 1.250,90)
  const amountMatch = text.match(/R\$\s*([0-9.,]+)/i)
  let amount = 0
  if (amountMatch) {
    const rawVal = amountMatch[1]
      .replace(/\./g, '') // remove pontos de milhar
      .replace(',', '.') // substitui vírgula decimal por ponto
    amount = parseFloat(rawVal) || 0
  }

  // 2. Regex de Estabelecimento / Nome da compra
  // Procura por termos comuns como "em", "no", "no estabelecimento", "compra de"
  let merchant = ''
  
  // Lista de tentativas de matching para extrair o estabelecimento
  const patterns = [
    /no estabelecimento\s+([^.,\n]+)/i,
    /compra aprovada no seu cartão Nubank valor R\$\s*[0-9.,]+\s+em\s+([^.,\n]+)/i,
    /compra aprovada no seu cartão Nubank\s+em\s+([^.,\n]+)/i,
    /compra aprovada de R\$\s*[0-9.,]+\s+no\s+([^.,\n]+)/i,
    /Você gastou R\$\s*[0-9.,]+\s+no\s+([^.,\n]+)/i,
    /em\s+([^.,\n]+)/i,
    /no\s+([^.,\n]+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      merchant = match[1].trim()
      break
    }
  }

  // Limpeza de sujeiras pós-parseamento
  if (merchant) {
    merchant = merchant
      .replace(/seu cartão.*/i, '')
      .replace(/cartão de crédito.*/i, '')
      .replace(/seu Nubank.*/i, '')
      .replace(/\.$/, '') // remove ponto final se houver
      .trim()
  }

  return { amount, merchant }
}

export function QuickExpenseModal({ onClose }) {
  const { categories, cards, transactions, addTransaction, addInstallmentPurchase } = useFinanceStore()
  const { personas } = usePersonaStore()

  const [type, setType] = useState('expense') // expense | income
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayStr())
  const [cardId, setCardId] = useState('')
  const [isInstallment, setIsInstallment] = useState(false)
  const [installments, setInstallments] = useState(2)
  const [personaId, setPersonaId] = useState('')
  const [showNubankInput, setShowNubankInput] = useState(false)
  const [nubankText, setNubankText] = useState('')

  const cats = categories.filter(c => c.type === type)

  // Categorias mais usadas para acesso instantâneo
  const topCategories = useMemo(() => {
    const counts = {}
    transactions.filter(t => t.type === type).forEach(t => {
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1
    })
    return [...cats].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)).slice(0, 6)
  }, [transactions, type])

  const handleApplyNubank = () => {
    const parsed = parseNubankNotification(nubankText)
    if (parsed) {
      if (parsed.amount > 0) {
        setAmount(String(parsed.amount))
      }
      if (parsed.merchant) {
        setDescription(parsed.merchant)
      }
      
      // Tenta sugerir categoria baseando-se no nome do estabelecimento
      const lowerMerchant = parsed.merchant.toLowerCase()
      let suggestedCat = ''
      if (lowerMerchant.includes('ifood') || lowerMerchant.includes('uber') || lowerMerchant.includes('99taxi')) {
        suggestedCat = lowerMerchant.includes('ifood') ? 'alim_merc' : 'transporte'
      } else if (lowerMerchant.includes('mercado') || lowerMerchant.includes('pão de açúcar') || lowerMerchant.includes('carrefour')) {
        suggestedCat = 'alim_merc'
      } else if (lowerMerchant.includes('farmacia') || lowerMerchant.includes('drogaria') || lowerMerchant.includes('saude')) {
        suggestedCat = 'saude'
      } else if (lowerMerchant.includes('netflix') || lowerMerchant.includes('spotify') || lowerMerchant.includes('amazon')) {
        suggestedCat = 'servicos'
      }
      
      if (suggestedCat) {
        setCategoryId(suggestedCat)
      }
      
      // Auto selecionar Nubank como cartão de crédito
      const nubankCard = cards.find(c => c.name.toLowerCase().includes('nubank'))
      if (nubankCard) {
        setCardId(nubankCard.id)
      }

      toast.success('Dados extraídos do Nubank com sucesso!')
      setShowNubankInput(false)
      setNubankText('')
    } else {
      toast.error('Não foi possível identificar dados nesse formato')
    }
  }

  const handleSave = () => {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Informe um valor de lançamento válido')
      return
    }
    if (!categoryId) {
      toast.error('Por favor, selecione uma categoria')
      return
    }

    if (isInstallment && type === 'expense') {
      if (!cardId) {
        toast.error('Selecione um cartão para parcelamento')
        return
      }
      addInstallmentPurchase({
        description: description || cats.find(c => c.id === categoryId)?.name || 'Compra',
        categoryId,
        totalAmount: numericAmount,
        installments: Number(installments),
        cardId,
        purchaseDate: date,
        personaId: personaId || null,
      })
      toast.success(`Compra de ${installments}x de ${fmtBRL(numericAmount / installments)} lançada!`)
    } else {
      addTransaction({
        description: description || cats.find(c => c.id === categoryId)?.name || (type === 'income' ? 'Receita' : 'Despesa'),
        categoryId,
        amount: numericAmount,
        type,
        date,
        cardId: (type === 'expense' && cardId) ? cardId : null,
        personaId: personaId || null,
      })
      toast.success(type === 'income' ? 'Receita lançada!' : 'Despesa lançada!')
    }
    onClose()
  }

  const activeColor = type === 'income' ? '#10B981' : '#EF4444'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md" id="quick-expense-modal" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border shadow-2xl transition-all"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Toggle Receita / Despesa */}
        <div className="flex p-1 m-4 mb-2 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
          <button
            onClick={() => { setType('expense'); setCategoryId('') }}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: type === 'expense' ? '#EF4444' : 'transparent',
              color: type === 'expense' ? '#fff' : 'var(--text-muted)'
            }}
          >
            ↓ Despesa
          </button>
          <button
            onClick={() => { setType('income'); setCategoryId('') }}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: type === 'income' ? '#10B981' : 'transparent',
              color: type === 'income' ? '#fff' : 'var(--text-muted)'
            }}
          >
            ↑ Receita
          </button>
        </div>

        {/* Bloco de Valor */}
        <div className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl font-bold opacity-80" style={{ color: activeColor }}>R$</span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              className="text-4xl font-extrabold text-center bg-transparent outline-none w-52 text-text-main"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          
          {/* Chips de valores rápidos */}
          <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
            {QUICK_VALUES.map(v => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="px-3 py-1 rounded-full text-[10px] font-bold border transition-colors hover:border-primary text-text-muted hover:text-text-main"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}
              >
                {fmtBRL(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Nubank Parser */}
        <div className="px-5 mb-4">
          {!showNubankInput ? (
            <button
              onClick={() => setShowNubankInput(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-white shadow-sm"
              style={{ background: '#8A05BE' }}
            >
              <span>💳</span> Colar Notificação Nubank
            </button>
          ) : (
            <div className="p-3 rounded-2xl border space-y-2" style={{ background: '#8A05BE10', borderColor: '#8A05BE33' }}>
              <span className="text-[10px] font-bold text-[#8A05BE] uppercase block">Notificação do Celular</span>
              <textarea
                placeholder="Cole o texto aqui (Ex: Compra aprovada no seu cartão Nubank valor R$ 50,00 em IFood)"
                className="w-full h-16 px-2.5 py-1.5 rounded-lg text-xs outline-none bg-surface text-text-main border focus:border-purple-500"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                value={nubankText}
                onChange={e => setNubankText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowNubankInput(false); setNubankText('') }}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-text-dim border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyNubank}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-white"
                  style={{ background: '#8A05BE' }}
                >
                  Processar Notificação
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Categorias (Grade Inteligente de Chips) */}
        <div className="px-5 space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Categoria</label>
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
            {(topCategories.length ? topCategories : cats).map(c => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  borderColor: categoryId === c.id ? c.color : 'var(--border)',
                  background: categoryId === c.id ? `${c.color}15` : 'transparent',
                  color: categoryId === c.id ? c.color : 'var(--text-muted)'
                }}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs de Descrição e Data */}
        <div className="px-5 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Almoço de domingo"
              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Data</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Opções de Cartão / Parcelamento */}
        {type === 'expense' && (
          <div className="px-5 mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quick-modal-is-inst"
                className="rounded text-primary border-border focus:ring-transparent h-3.5 w-3.5"
                checked={isInstallment}
                onChange={e => setIsInstallment(e.target.checked)}
              />
              <label htmlFor="quick-modal-is-inst" className="text-xs text-text-muted font-semibold cursor-pointer">
                Lançamento parcelado no cartão
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Método / Cartão</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                  value={cardId}
                  onChange={e => setCardId(e.target.value)}
                >
                  <option value="">Débito / Pix / Dinheiro</option>
                  {cards.filter(c => c.active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {isInstallment && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Parcelas</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
                    style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
                    value={installments}
                    onChange={e => setInstallments(Number(e.target.value))}
                  >
                    {[2,3,4,5,6,8,10,12,18,24].map(n => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personas do sistema */}
        {personas && personas.length > 0 && (
          <div className="px-5 mt-4">
            <label className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1">Vincular à Persona</label>
            <select
              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border text-text-main"
              style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
              value={personaId}
              onChange={e => setPersonaId(e.target.value)}
            >
              <option value="">Nenhuma</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Botões de Ações */}
        <div className="flex gap-3 p-5 mt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-xs font-semibold text-text-muted border hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl text-xs font-black text-white hover:opacity-90 transition-opacity"
            style={{ background: activeColor }}
          >
            Registrar Lançamento
          </button>
        </div>

      </div>
    </div>
  )
}
