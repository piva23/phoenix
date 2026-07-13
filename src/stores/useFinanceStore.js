import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Helpers ───────────────────────────────────────────────────────────────────
export const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`
export const parseMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}
export const todayKey = () => {
  const d = new Date()
  return monthKey(d.getFullYear(), d.getMonth())
}
export const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fmtMonthLabel = (key) => {
  const { year, month } = parseMonthKey(key)
  return new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}
const todayStr = () => new Date().toISOString().split('T')[0]

// Credita XP sem criar dependência circular forte (mesmo padrão do useSessionStore)
function grantXP({ action, xp, radarAxis = 'financas', personaId = null }) {
  try {
    const { useXPStore } = require('./useXPStore')
    useXPStore.getState().logXP({ action, xp, moduleOrigin: 'finance', personaId, radarAxis })
  } catch (_) {}
  try {
    const { useUserStore } = require('./useUserStore')
    useUserStore.getState().addXP(xp)
  } catch (_) {}
  if (personaId) {
    try {
      const { usePersonaStore } = require('./usePersonaStore')
      usePersonaStore.getState().addPersonaXP(personaId, xp)
    } catch (_) {}
  }
}

// ── Categorias padrão ────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  // RECEITAS
  { id: 'sal_adto',    name: 'Salário Adiantamento', type: 'income',  color: '#10B981', icon: '💰' },
  { id: 'sal_fim',     name: 'Salário Fim de Mês',   type: 'income',  color: '#10B981', icon: '💰' },
  { id: 'vale_alim',   name: 'Vale Alimentação',      type: 'income',  color: '#34D399', icon: '🍽️' },
  { id: 'renda_extra', name: 'Renda Extra',            type: 'income',  color: '#6EE7B7', icon: '⚡' },
  { id: 'outros_rec',  name: 'Outros (Receita)',       type: 'income',  color: '#A7F3D0', icon: '➕' },
  // DESPESAS
  { id: 'moradia',     name: 'Moradia',               type: 'expense', color: '#F97316', icon: '🏠', groupId: 'bg_moradia' },
  { id: 'alim_merc',  name: 'Alimentação / Mercado', type: 'expense', color: '#EF4444', icon: '🛒', groupId: 'bg_estilo_vida' },
  { id: 'alim_trab',  name: 'Alimentação Trabalho',  type: 'expense', color: '#FCA5A5', icon: '🥪', groupId: 'bg_transporte' },
  { id: 'transporte', name: 'Transporte',             type: 'expense', color: '#F59E0B', icon: '🚌', groupId: 'bg_transporte' },
  { id: 'saude',      name: 'Saúde',                  type: 'expense', color: '#EC4899', icon: '🏥', groupId: 'bg_saude' },
  { id: 'filhos',     name: 'Filhos',                 type: 'expense', color: '#8B5CF6', icon: '👶', groupId: 'bg_estilo_vida' },
  { id: 'educacao',   name: 'Educação',               type: 'expense', color: '#6366F1', icon: '📚', groupId: 'bg_estilo_vida' },
  { id: 'servicos',   name: 'Serviços / Assinaturas', type: 'expense', color: '#14B8A6', icon: '📱', groupId: 'bg_moradia' },
  { id: 'vestuario',  name: 'Vestuário',              type: 'expense', color: '#A78BFA', icon: '👟', groupId: 'bg_estilo_vida' },
  { id: 'lazer',      name: 'Lazer / Família',        type: 'expense', color: '#FB923C', icon: '🎉', groupId: 'bg_estilo_vida' },
  { id: 'gatos',      name: 'Gatos / Pets',           type: 'expense', color: '#FCD34D', icon: '🐱', groupId: 'bg_estilo_vida' },
  { id: 'investimento',name: 'Investimento',          type: 'expense', color: '#38BDF8', icon: '📈', groupId: 'bg_estilo_vida' },
  { id: 'presentes',  name: 'Presentes',              type: 'expense', color: '#F472B6', icon: '🎁', groupId: 'bg_estilo_vida' },
  { id: 'fatura',     name: 'Pagamento de Fatura',    type: 'expense', color: '#8A05BE', icon: '💳', groupId: 'bg_estilo_vida' },
  { id: 'outros_desp',name: 'Outros (Despesa)',       type: 'expense', color: '#94A3B8', icon: '💸', groupId: 'bg_estilo_vida' },
]

// ── Grupos de categoria (organização de alto nível - Orçamento Base Zero) ───
export const DEFAULT_BUDGET_GROUPS = [
  { id: 'bg_moradia', name: 'Moradia', icon: '🏠', color: '#F97316', categoryIds: ['moradia', 'servicos'] },
  { id: 'bg_transporte', name: 'Transporte', icon: '🚌', color: '#F59E0B', categoryIds: ['transporte', 'alim_trab'] },
  { id: 'bg_saude', name: 'Saúde (MakeThisLittleHartBeat)', icon: '❤️', color: '#EC4899', categoryIds: ['saude'] },
  { id: 'bg_estilo_vida', name: 'Estilo de Vida', icon: '🎉', color: '#8B5CF6', categoryIds: ['alim_merc', 'filhos', 'educacao', 'servicos', 'vestuario', 'lazer', 'gatos', 'investimento', 'presentes', 'fatura', 'outros_desp'] },
]

export const DEFAULT_CATEGORY_GROUPS = DEFAULT_BUDGET_GROUPS;

// ── Cartões padrão ────────────────────────────────────────────────────────────
const DEFAULT_CARDS = [
  {
    id: 'nubank',
    name: 'Nubank',
    color: '#8A05BE',
    icon: '💳',
    closeDay: 17,
    dueDay: 24,
    limit: 0,
    active: true,
    invoiceStatus: {}, // { 'YYYY-MM': 'open' | 'closed' | 'paid' }
  },
]

// ── Investimento: divisões padrão ─────────────────────────────────────────────
const DEFAULT_INVEST_DIVISIONS = [
  { id: 'inv_cofre',   name: 'Cofre Mestre',       pct: 0.60, color: '#10B981' },
  { id: 'inv_reserva', name: 'Reserva Emergência', pct: 0.18, color: '#38BDF8' },
  { id: 'inv_educ',    name: 'Educação',            pct: 0.05, color: '#6366F1' },
  { id: 'inv_mini',    name: 'Mini Poupança Kids',  pct: 0.02, color: '#A78BFA' },
  { id: 'inv_ferias',  name: 'Fundo Férias',        pct: 0.05, color: '#F97316' },
  { id: 'inv_proj',    name: 'Projetos 2026',       pct: 0.05, color: '#F59E0B' },
  { id: 'inv_compra',  name: 'Compra Planejada',    pct: 0.05, color: '#EC4899' },
]

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      // ── Config ──────────────────────────────────────────────────────────────
      categories: DEFAULT_CATEGORIES,
      categoryGroups: DEFAULT_CATEGORY_GROUPS,
      budgetGroups: DEFAULT_BUDGET_GROUPS,
      cards: DEFAULT_CARDS,

      // ── Transações ──────────────────────────────────────────────────────────
      // { id, date, description, categoryId, amount, type:'income'|'expense',
      //   cardId?, installments?, installmentIndex?, groupId?, personaId?, projectId?, recurringId? }
      transactions: [],

      // ── Orçamento ───────────────────────────────────────────────────────────
      budgets: {}, // { 'YYYY-MM': { categoryId: budgetedAmount } }

      // ── Recorrências ──────────────────────────────────────────────────────
      // Receita recorrente: pode ter múltiplos dias no mês (ex: 15 e 30)
      recurringIncomes: [
        // exemplo real do usuário: salário quinzenal
      ],
      recurringExpenses: [],
      confirmedRecurring: [], // chaves `${id}_${monthKey}_${day}` já confirmadas

      // ── Envelopes (sinking funds de curto prazo) ─────────────────────────────
      // { id, name, icon, color, target, current, deadline, projectId?, personaId?, goalReached, createdAt }
      envelopes: [],

      // ── Investimentos ────────────────────────────────────────────────────────
      invest: {
        currentBalance: 18143.01,
        monthlyFixed: 2000,
        goal: 50000,
        divisions: DEFAULT_INVEST_DIVISIONS,
        history: [], // [{ date, balance, note }]
      },

      // ── CATEGORIES CRUD ──────────────────────────────────────────────────────
      addCategory: (cat) => set(s => ({
        categories: [...s.categories, { ...cat, id: `cat_${Date.now()}` }]
      })),
      updateCategory: (id, data) => set(s => ({
        categories: s.categories.map(c => c.id !== id ? c : { ...c, ...data })
      })),
      deleteCategory: (id) => set(s => ({
        categories: s.categories.filter(c => c.id !== id)
      })),

      // ── CATEGORY GROUPS CRUD ─────────────────────────────────────────────────
      addCategoryGroup: (data) => set(s => ({
        categoryGroups: [...s.categoryGroups, { ...data, id: `grp_${Date.now()}`, categoryIds: data.categoryIds || [] }]
      })),
      updateCategoryGroup: (id, data) => set(s => ({
        categoryGroups: s.categoryGroups.map(g => g.id !== id ? g : { ...g, ...data })
      })),
      deleteCategoryGroup: (id) => set(s => ({
        categoryGroups: s.categoryGroups.filter(g => g.id !== id)
      })),
      // Move uma categoria de um grupo para outro (ou para nenhum, se toGroupId=null)
      moveCategoryToGroup: (categoryId, toGroupId) => set(s => ({
        categoryGroups: s.categoryGroups.map(g => {
          const withoutCat = { ...g, categoryIds: g.categoryIds.filter(id => id !== categoryId) }
          if (g.id === toGroupId) withoutCat.categoryIds = [...withoutCat.categoryIds, categoryId]
          return withoutCat
        })
      })),
      getGroupForCategory: (categoryId) =>
        get().categoryGroups.find(g => g.categoryIds.includes(categoryId)) || null,

      // ── CARDS CRUD ───────────────────────────────────────────────────────────
      addCard: (card) => set(s => ({
        cards: [...s.cards, { ...card, id: `card_${Date.now()}`, active: true, invoiceStatus: {} }]
      })),
      updateCard: (id, data) => set(s => ({
        cards: s.cards.map(c => c.id !== id ? c : { ...c, ...data })
      })),
      deleteCard: (id) => set(s => ({
        cards: s.cards.filter(c => c.id !== id)
      })),

      // ── CICLO DE VIDA DA FATURA ──────────────────────────────────────────────
      getInvoiceStatus: (cardId, mk) => {
        const card = get().cards.find(c => c.id === cardId)
        return card?.invoiceStatus?.[mk] || 'open'
      },
      closeInvoice: (cardId, mk) => set(s => ({
        cards: s.cards.map(c => c.id !== cardId ? c : {
          ...c, invoiceStatus: { ...c.invoiceStatus, [mk]: 'closed' }
        })
      })),
      reopenInvoice: (cardId, mk) => set(s => ({
        cards: s.cards.map(c => c.id !== cardId ? c : {
          ...c, invoiceStatus: { ...c.invoiceStatus, [mk]: 'open' }
        })
      })),
      // Marca fatura como paga e cria a transação de saída equivalente ao total
      payInvoice: (cardId, mk, { categoryId = 'fatura', date = todayStr(), personaId = null } = {}) => {
        const card = get().cards.find(c => c.id === cardId)
        if (!card) return null
        const invoice = get().getCardInvoice(cardId, mk)
        const total = invoice.reduce((a, t) => a + t.amount, 0)
        if (total <= 0) return null

        const tx = {
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          description: `Fatura ${card.name} - ${fmtMonthLabel(mk)}`,
          categoryId,
          amount: total,
          type: 'expense',
          date,
          personaId,
          isInvoicePayment: true,
          invoicePaidMonth: mk,
          invoicePaidCard: cardId,
        }
        set(s => ({
          transactions: [...s.transactions, tx],
          cards: s.cards.map(c => c.id !== cardId ? c : {
            ...c, invoiceStatus: { ...c.invoiceStatus, [mk]: 'paid' }
          }),
        }))
        grantXP({ action: 'Fatura paga em dia', xp: 5, personaId })
        return tx
      },

      // ── TRANSACTIONS ─────────────────────────────────────────────────────────
      addTransaction: (tx) => set(s => ({
        transactions: [
          ...s.transactions,
          { ...tx, id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}` }
        ]
      })),

      addInstallmentPurchase: ({ description, categoryId, totalAmount, installments, cardId, purchaseDate, personaId = null, projectId = null }) => {
        const groupId = `grp_${Date.now()}`
        const card = get().cards.find(c => c.id === cardId)
        if (!card) return

        const txs = []
        const perInstallment = totalAmount / installments
        const purchaseDateObj = new Date(purchaseDate)

        for (let i = 0; i < installments; i++) {
          let baseMonth = new Date(purchaseDateObj)
          const dayOfPurchase = baseMonth.getDate()

          if (dayOfPurchase >= card.closeDay) {
            baseMonth.setMonth(baseMonth.getMonth() + 1)
          }
          baseMonth.setMonth(baseMonth.getMonth() + i)

          const invoiceMonth = monthKey(baseMonth.getFullYear(), baseMonth.getMonth())
          const dueDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), card.dueDay)
            .toISOString().split('T')[0]

          txs.push({
            id: `tx_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`,
            description,
            categoryId,
            amount: Math.round(perInstallment * 100) / 100,
            type: 'expense',
            cardId,
            invoiceMonth,
            dueDate,
            installments,
            installmentIndex: i + 1,
            groupId,
            date: purchaseDate,
            purchaseDate,
            personaId,
            projectId,
          })
        }
        set(s => ({ transactions: [...s.transactions, ...txs] }))
      },

      deleteTransaction: (id) => set(s => ({
        transactions: s.transactions.filter(t => t.id !== id)
      })),

      deleteInstallmentGroup: (groupId) => set(s => ({
        transactions: s.transactions.filter(t => t.groupId !== groupId)
      })),

      updateTransaction: (id, data) => set(s => ({
        transactions: s.transactions.map(t => t.id !== id ? t : { ...t, ...data })
      })),

      // Duplica um lançamento pra hoje - usado pelos templates de lançamento rápido
      duplicateTransaction: (id) => {
        const tx = get().transactions.find(t => t.id === id)
        if (!tx) return null
        const clone = { ...tx, id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`, date: todayStr() }
        delete clone.installments; delete clone.installmentIndex; delete clone.groupId; delete clone.invoiceMonth
        set(s => ({ transactions: [...s.transactions, clone] }))
        return clone
      },

      // ── RECEITAS RECORRENTES (ex: salário dia 15 e 30) ──────────────────────
      addRecurringIncome: (data) => set(s => ({
        recurringIncomes: [...s.recurringIncomes, {
          id: `rin_${Date.now()}`,
          name: data.name || 'Receita fixa',
          amount: Number(data.amount) || 0,
          categoryId: data.categoryId || 'sal_fim',
          daysOfMonth: data.daysOfMonth || [5],
          active: true,
          personaId: data.personaId || null,
        }]
      })),
      updateRecurringIncome: (id, data) => set(s => ({
        recurringIncomes: s.recurringIncomes.map(r => r.id !== id ? r : { ...r, ...data })
      })),
      deleteRecurringIncome: (id) => set(s => ({
        recurringIncomes: s.recurringIncomes.filter(r => r.id !== id)
      })),

      // ── DESPESAS FIXAS RECORRENTES (aluguel, assinaturas...) ────────────────
      addRecurringExpense: (data) => set(s => ({
        recurringExpenses: [...s.recurringExpenses, {
          id: `rex_${Date.now()}`,
          name: data.name || 'Despesa fixa',
          amount: Number(data.amount) || 0,
          categoryId: data.categoryId || 'moradia',
          dayOfMonth: data.dayOfMonth || 5,
          cardId: data.cardId || null,
          active: true,
          projectId: data.projectId || null,
        }]
      })),
      updateRecurringExpense: (id, data) => set(s => ({
        recurringExpenses: s.recurringExpenses.map(r => r.id !== id ? r : { ...r, ...data })
      })),
      deleteRecurringExpense: (id) => set(s => ({
        recurringExpenses: s.recurringExpenses.filter(r => r.id !== id)
      })),

      // Confirma o recebimento de uma parcela de receita recorrente (dia 15 ou 30, por ex.)
      confirmRecurringIncome: (id, day, mk = todayKey(), actualAmount = null) => {
        const rec = get().recurringIncomes.find(r => r.id === id)
        if (!rec) return null
        const key = `${id}_${mk}_${day}`
        if (get().confirmedRecurring.includes(key)) return null

        const dateStr = `${mk}-${String(day).padStart(2, '0')}`
        const tx = {
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          description: rec.name,
          categoryId: rec.categoryId,
          amount: actualAmount ?? rec.amount,
          type: 'income',
          date: dateStr,
          personaId: rec.personaId,
          recurringId: id,
        }
        set(s => ({
          transactions: [...s.transactions, tx],
          confirmedRecurring: [...s.confirmedRecurring, key],
        }))
        grantXP({ action: `Recebimento confirmado: ${rec.name}`, xp: 5, personaId: rec.personaId })
        return tx
      },

      confirmRecurringExpense: (id, mk = todayKey(), actualAmount = null) => {
        const rec = get().recurringExpenses.find(r => r.id === id)
        if (!rec) return null
        const key = `${id}_${mk}`
        if (get().confirmedRecurring.includes(key)) return null

        const dateStr = `${mk}-${String(rec.dayOfMonth).padStart(2, '0')}`
        const tx = {
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          description: rec.name,
          categoryId: rec.categoryId,
          amount: actualAmount ?? rec.amount,
          type: 'expense',
          date: dateStr,
          cardId: rec.cardId,
          projectId: rec.projectId,
          recurringId: id,
        }
        set(s => ({
          transactions: [...s.transactions, tx],
          confirmedRecurring: [...s.confirmedRecurring, key],
        }))
        return tx
      },

      isRecurringConfirmed: (id, mk, day = null) => {
        const key = day ? `${id}_${mk}_${day}` : `${id}_${mk}`
        return get().confirmedRecurring.includes(key)
      },

      // Lista tudo que está pendente de confirmação no mês (receitas e despesas fixas)
      getPendingRecurring: (mk = todayKey()) => {
        const { recurringIncomes, recurringExpenses } = get()
        const todayNum = mk === todayKey() ? new Date().getDate() : 31
        const pendingIncomes = recurringIncomes
          .filter(r => r.active)
          .flatMap(r => r.daysOfMonth
            .filter(day => day <= todayNum && !get().isRecurringConfirmed(r.id, mk, day))
            .map(day => ({ kind: 'income', id: r.id, day, name: r.name, amount: r.amount }))
          )
        const pendingExpenses = recurringExpenses
          .filter(r => r.active && r.dayOfMonth <= todayNum && !get().isRecurringConfirmed(r.id, mk))
          .map(r => ({ kind: 'expense', id: r.id, day: r.dayOfMonth, name: r.name, amount: r.amount }))
        return [...pendingIncomes, ...pendingExpenses].sort((a, b) => a.day - b.day)
      },

      // ── ENVELOPES (sinking funds) ────────────────────────────────────────────
      addEnvelope: (data) => set(s => ({
        envelopes: [...s.envelopes, {
          id: `env_${Date.now()}`,
          name: data.name || 'Nova meta',
          icon: data.icon || '🎯',
          color: data.color || '#38BDF8',
          target: Number(data.target) || 0,
          current: Number(data.current) || 0,
          deadline: data.deadline || null,
          projectId: data.projectId || null,
          personaId: data.personaId || null,
          goalReached: false,
          createdAt: Date.now(),
        }]
      })),
      updateEnvelope: (id, data) => set(s => ({
        envelopes: s.envelopes.map(e => e.id !== id ? e : { ...e, ...data })
      })),
      deleteEnvelope: (id) => set(s => ({
        envelopes: s.envelopes.filter(e => e.id !== id)
      })),
      depositEnvelope: (id, amount) => {
        const env = get().envelopes.find(e => e.id === id)
        if (!env) return
        const newCurrent = env.current + Number(amount)
        const justReached = !env.goalReached && env.target > 0 && newCurrent >= env.target
        set(s => ({
          envelopes: s.envelopes.map(e => e.id !== id ? e : {
            ...e, current: newCurrent, goalReached: e.goalReached || justReached,
          })
        }))
        if (justReached) grantXP({ action: `Meta atingida: ${env.name}`, xp: 30, personaId: env.personaId })
      },
      withdrawEnvelope: (id, amount) => set(s => ({
        envelopes: s.envelopes.map(e => e.id !== id ? e : {
          ...e, current: Math.max(0, e.current - Number(amount))
        })
      })),
      getEnvelopesTotal: () => get().envelopes.reduce((a, e) => a + e.current, 0),
      getEnvelopesByProject: (projectId) => get().envelopes.filter(e => e.projectId === projectId),

      // ── SELETORES ────────────────────────────────────────────────────────────
      getMonthTransactions: (mk) => {
        return get().transactions.filter(t => {
          if (t.invoiceMonth) return t.invoiceMonth === mk
          return t.date?.startsWith(mk)
        })
      },

      getMonthSummary: (mk) => {
        const txs = get().getMonthTransactions(mk)
        const income  = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
        const expense = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
        return { income, expense, balance: income - expense }
      },

      getMonthByCategory: (mk) => {
        const txs = get().getMonthTransactions(mk)
        const map = {}
        txs.filter(t => t.type === 'expense').forEach(t => {
          map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
        })
        return map
      },

      // Gastos agregados por grupo de categoria — para o donut da aba Geral
      getMonthByGroup: (mk) => {
        const byCat = get().getMonthByCategory(mk)
        const { categoryGroups } = get()
        return categoryGroups.map(g => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: g.color,
          value: g.categoryIds.reduce((a, cid) => a + (byCat[cid] || 0), 0),
        })).filter(g => g.value > 0)
      },

      getCardInvoice: (cardId, mk) => {
        return get().transactions.filter(
          t => t.cardId === cardId && t.invoiceMonth === mk && t.type === 'expense'
        )
      },

      // Saldo "livre" (Total de Receitas do Mês - Valor Destinado aos Grupos de Orçamento)
      getFreeBalance: (mk) => {
        const txs = get().getMonthTransactions(mk)
        const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        
        const budget = get().budgets[mk] || {}
        const expenseCategoryIds = get().categories.filter(c => c.type === 'expense').map(c => c.id)
        const totalBudgeted = Object.entries(budget)
          .filter(([cid]) => expenseCategoryIds.includes(cid))
          .reduce((sum, [_, amt]) => sum + Number(amt || 0), 0)

        return totalIncome - totalBudgeted
      },

      // Próximos eventos financeiros (recebimentos e vencimentos) nos próximos N dias
      getUpcoming: (days = 7) => {
        const { recurringIncomes, recurringExpenses, cards } = get()
        const now = new Date()
        const items = []

        recurringIncomes.filter(r => r.active).forEach(r => {
          r.daysOfMonth.forEach(day => {
            const d = new Date(now.getFullYear(), now.getMonth(), day)
            const diff = Math.round((d - now) / 86400000)
            if (diff >= 0 && diff <= days) items.push({ type: 'income', name: r.name, amount: r.amount, date: d, diff })
          })
        })
        recurringExpenses.filter(r => r.active).forEach(r => {
          const d = new Date(now.getFullYear(), now.getMonth(), r.dayOfMonth)
          const diff = Math.round((d - now) / 86400000)
          if (diff >= 0 && diff <= days) items.push({ type: 'expense', name: r.name, amount: r.amount, date: d, diff })
        })
        cards.filter(c => c.active).forEach(c => {
          const d = new Date(now.getFullYear(), now.getMonth(), c.dueDay)
          const diff = Math.round((d - now) / 86400000)
          if (diff >= 0 && diff <= days) {
            const mk = monthKey(now.getFullYear(), now.getMonth())
            const total = get().getCardInvoice(c.id, mk).reduce((a, t) => a + t.amount, 0)
            if (total > 0) items.push({ type: 'invoice', name: `Fatura ${c.name}`, amount: total, date: d, diff })
          }
        })
        return items.sort((a, b) => a.diff - b.diff)
      },

      getMonthByPersona: (mk) => {
        const txs = get().getMonthTransactions(mk).filter(t => t.type === 'expense' && t.personaId)
        const map = {}
        txs.forEach(t => { map[t.personaId] = (map[t.personaId] || 0) + t.amount })
        return map
      },
      getTransactionsByProject: (projectId) => get().transactions.filter(t => t.projectId === projectId),

      // ── BUDGET ───────────────────────────────────────────────────────────────
      setBudget: (mk, categoryId, amount) => set(s => ({
        budgets: {
          ...s.budgets,
          [mk]: { ...(s.budgets[mk] || {}), [categoryId]: amount }
        }
      })),

      copyBudgetFromPrev: (targetMonthKey) => {
        const { year, month } = parseMonthKey(targetMonthKey)
        const prevDate = new Date(year, month - 1, 1)
        const prevKey = monthKey(prevDate.getFullYear(), prevDate.getMonth())
        const prev = get().budgets[prevKey]
        if (!prev) return false
        set(s => ({ budgets: { ...s.budgets, [targetMonthKey]: { ...prev } } }))
        return true
      },

      // Orçamento total planejado (base zero): soma de receitas fixas vs orçado
      getZeroBasedSummary: (mk) => {
        const budget = get().budgets[mk] || {}
        const { categories, recurringIncomes } = get()
        const plannedIncome = recurringIncomes.filter(r => r.active)
          .reduce((a, r) => a + r.amount * r.daysOfMonth.length, 0)
        const plannedExpense = categories.filter(c => c.type === 'expense')
          .reduce((a, c) => a + (budget[c.id] || 0), 0)
        return { plannedIncome, plannedExpense, unassigned: plannedIncome - plannedExpense }
      },

      // ── INVEST ───────────────────────────────────────────────────────────────
      getInvestProjection: (extraMonthly = 0) => {
        const { invest } = get()
        const last3Months = []
        const now = new Date()
        for (let i = 1; i <= 3; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const mk = monthKey(d.getFullYear(), d.getMonth())
          const { balance } = get().getMonthSummary(mk)
          last3Months.push(balance)
        }
        const avgSurplus = last3Months.length
          ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
          : 0

        const monthlyContrib = invest.monthlyFixed + Math.max(0, avgSurplus) + extraMonthly
        const remaining = invest.goal - invest.currentBalance
        const monthsLeft = monthlyContrib > 0 ? Math.ceil(remaining / monthlyContrib) : 999

        const arrivalDate = new Date(now.getFullYear(), now.getMonth() + monthsLeft, 1)
        return {
          monthlyFixed: invest.monthlyFixed,
          avgSurplus: Math.round(avgSurplus),
          monthlyContrib: Math.round(monthlyContrib),
          remaining: Math.round(remaining),
          monthsLeft,
          arrivalDate: arrivalDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          pct: Math.min(100, (invest.currentBalance / invest.goal) * 100),
        }
      },

      updateInvest: (data) => set(s => ({ invest: { ...s.invest, ...data } })),
      updateInvestDivisions: (divisions) => set(s => ({ invest: { ...s.invest, divisions } })),
      addInvestHistory: (entry) => set(s => ({
        invest: {
          ...s.invest,
          currentBalance: entry.balance,
          history: [
            ...s.invest.history,
            { ...entry, id: `inv_${Date.now()}`, date: entry.date || todayStr() }
          ],
        }
      })),
    }),
    { name: 'phoenix-finance', version: 2 }
  )
)
