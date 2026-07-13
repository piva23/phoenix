import { useState } from 'react'
import { OverviewTab }     from '../components/OverviewTab'
import { TransactionsTab } from '../components/TransactionsTab'
import { CreditCardsView } from '../views/CreditCardsView'
import { BudgetTab }       from '../components/BudgetTab'
import { InvestTab }       from '../components/InvestTab'
import { FinanceAnalyticsView } from '../views/FinanceAnalyticsView'
import { QuickExpenseModal }   from '../components/QuickExpenseModal'
import { useFinanceStore, todayKey } from '../../../stores/useFinanceStore'

const TABS = [
  { id: 'overview',      label: '📊 Geral'        },
  { id: 'analytics',     label: '📈 Analytics'    },
  { id: 'transactions',  label: '💸 Lançamentos'  },
  { id: 'cards',         label: '💳 Cartões'      },
  { id: 'budget',        label: '📋 Orçamento'    },
  { id: 'invest',        label: '🎯 Investimentos' },
]

export function FinancePage() {
  const [tab, setTab] = useState('overview')
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const pendingRecurring = useFinanceStore(s => s.getPendingRecurring(todayKey()))

  return (
    <div className="flex flex-col min-h-full relative" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Finanças</h1>
            <p className="text-xs text-text-dim mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-3xl">💰</div>
        </div>

        {/* Alerta de recorrências pendentes (recebimento/conta fixa do dia) */}
        {pendingRecurring.length > 0 && (
          <button onClick={() => setTab('budget')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold mb-3 text-left"
            style={{ background: '#F59E0B15', border: '1px solid #F59E0B33', color: '#F59E0B' }}>
            <span>🔔</span>
            <span className="flex-1">
              {pendingRecurring.length === 1
                ? `1 movimentação fixa pendente de confirmação: ${pendingRecurring[0].name}`
                : `${pendingRecurring.length} movimentações fixas pendentes de confirmação`}
            </span>
            <span>Confirmar →</span>
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: tab === t.id ? 'var(--primary)' : 'var(--bg-surface)',
                color:      tab === t.id ? '#fff' : 'var(--text-muted)',
                border:     `1px solid ${tab === t.id ? 'transparent' : 'var(--border)'}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-24 space-y-4">
        {tab === 'overview'     && <OverviewTab     onQuickAdd={() => setQuickAddOpen(true)} />}
        {tab === 'analytics'    && <FinanceAnalyticsView />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'cards'        && <CreditCardsView />}
        {tab === 'budget'       && <BudgetTab       />}
        {tab === 'invest'       && <InvestTab       />}
      </div>

      {/* FAB de lançamento rápido — acessível em qualquer aba */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-24 lg:bottom-8 right-5 z-30 w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white shadow-lg hover:scale-105 transition-transform"
        style={{ background: 'var(--primary)', boxShadow: '0 8px 24px var(--glow)' }}
        aria-label="Novo lançamento">
        +
      </button>

      {quickAddOpen && <QuickExpenseModal onClose={() => setQuickAddOpen(false)} />}
    </div>
  )
}
