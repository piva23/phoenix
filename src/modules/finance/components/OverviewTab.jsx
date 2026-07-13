import { useState, useMemo } from 'react'
import { useFinanceStore, monthKey, fmtBRL, fmtMonthLabel, parseMonthKey } from '../../../stores/useFinanceStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export function OverviewTab({ onQuickAdd }) {
  const [curKey, setCurKey] = useState(monthKey(new Date().getFullYear(), new Date().getMonth()))
  const {
    getMonthSummary, getMonthTransactions, getMonthByCategory, getMonthByGroup,
    categories, budgets, getFreeBalance, getEnvelopesTotal, envelopes, getUpcoming,
  } = useFinanceStore()

  const summary  = getMonthSummary(curKey)
  const byCat    = getMonthByCategory(curKey)
  const byGroup  = getMonthByGroup(curKey)
  const budget   = budgets[curKey] || {}
  const txs      = getMonthTransactions(curKey)
  const freeBalance = getFreeBalance(curKey)
  const envelopesTotal = getEnvelopesTotal()
  const upcoming = getUpcoming(7)

  const prevMonth = () => {
    const { year, month } = parseMonthKey(curKey)
    const d = new Date(year, month - 1, 1)
    setCurKey(monthKey(d.getFullYear(), d.getMonth()))
  }
  const nextMonth = () => {
    const { year, month } = parseMonthKey(curKey)
    const d = new Date(year, month + 1, 1)
    setCurKey(monthKey(d.getFullYear(), d.getMonth()))
  }
  const isCurrentMonth = curKey === monthKey(new Date().getFullYear(), new Date().getMonth())

  const last6 = useMemo(() => {
    const arr = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
      const mk = monthKey(d.getFullYear(), d.getMonth())
      const s  = getMonthSummary(mk)
      arr.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        receita: Math.round(s.income),
        gasto:   Math.round(s.expense),
        saldo:   Math.round(s.balance),
      })
    }
    return arr
  }, [curKey])

  // Média dos últimos 3 meses (excluindo o atual) para comparação
  const avg3 = useMemo(() => {
    let total = 0
    for (let i = 1; i <= 3; i++) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
      const mk = monthKey(d.getFullYear(), d.getMonth())
      total += getMonthSummary(mk).expense
    }
    return total / 3
  }, [curKey])

  const expCats = categories
    .filter(c => c.type === 'expense' && (byCat[c.id] || budget[c.id]))
    .sort((a, b) => (byCat[b.id] || 0) - (byCat[a.id] || 0))

  const incCats = categories.filter(c => c.type === 'income' && byCat[c.id])
  const balanceColor = summary.balance >= 0 ? '#10B981' : '#EF4444'
  const vsAvgPct = avg3 > 0 ? Math.round(((summary.expense - avg3) / avg3) * 100) : 0

  return (
    <div className="space-y-4">

      {/* Navegação de mês */}
      <div className="flex items-center justify-between px-1">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-white/8 transition-all">◀</button>
        <div className="text-center">
          <div className="font-bold text-text-main capitalize">{fmtMonthLabel(curKey)}</div>
          {isCurrentMonth && <div className="text-xs text-text-dim">mês atual</div>}
        </div>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-white/8 transition-all">▶</button>
      </div>

      {/* Saldo consolidado: livre vs comprometido em envelopes */}
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, var(--primary)22, transparent)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Saldo consolidado</p>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold" style={{ color: freeBalance >= 0 ? '#10B981' : '#EF4444' }}>{fmtBRL(freeBalance)}</span>
            <p className="text-xs text-text-dim mt-0.5">livre pra usar</p>
          </div>
          {envelopesTotal > 0 && (
            <div className="text-right">
              <span className="text-sm font-bold" style={{ color: '#38BDF8' }}>{fmtBRL(envelopesTotal)}</span>
              <p className="text-xs text-text-dim mt-0.5">reservado em {envelopes.length} meta{envelopes.length > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas',  value: summary.income,   color: '#10B981', icon: '↑' },
          { label: 'Gastos',    value: summary.expense,  color: '#EF4444', icon: '↓' },
          { label: 'Saldo',     value: summary.balance,  color: balanceColor, icon: summary.balance >= 0 ? '✓' : '!' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: `1px solid ${k.color}22` }}>
            <div className="text-lg mb-1" style={{ color: k.color }}>{k.icon}</div>
            <div className="font-bold text-sm" style={{ color: k.color }}>{fmtBRL(k.value)}</div>
            <div className="text-xs text-text-dim mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Comparativo com média */}
      {avg3 > 0 && (
        <div className="rounded-2xl p-3 flex items-center justify-between" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <span className="text-xs text-text-muted">Gasto vs média dos últimos 3 meses ({fmtBRL(avg3)})</span>
          <span className="text-xs font-bold" style={{ color: vsAvgPct > 0 ? '#EF4444' : '#10B981' }}>
            {vsAvgPct > 0 ? '▲' : '▼'} {Math.abs(vsAvgPct)}%
          </span>
        </div>
      )}

      {/* Próximos 7 dias */}
      {upcoming.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Próximos 7 dias</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {upcoming.map((u, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span>{u.type === 'income' ? '↑' : u.type === 'invoice' ? '💳' : '↓'}</span>
                  <div>
                    <p className="text-sm text-text-main">{u.name}</p>
                    <p className="text-xs text-text-dim">{u.diff === 0 ? 'hoje' : `em ${u.diff} dia${u.diff > 1 ? 's' : ''}`}</p>
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: u.type === 'income' ? '#10B981' : 'var(--text-main)' }}>
                  {u.type === 'income' ? '+' : '-'}{fmtBRL(u.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donut por grupo de categoria */}
      {byGroup.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Gastos por grupo</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={byGroup} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} paddingAngle={2}>
                  {byGroup.map((g, i) => <Cell key={i} fill={g.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtBRL(v)} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {byGroup.map(g => (
                <div key={g.id} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-text-muted"><span style={{ color: g.color }}>●</span>{g.icon} {g.name}</span>
                  <span className="font-semibold text-text-main">{fmtBRL(g.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico 6 meses */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Últimos 6 meses</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={last6} barSize={8} barGap={2}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v, n) => [fmtBRL(v), n === 'receita' ? 'Receita' : 'Gasto']}
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="receita" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="gasto"   fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={last6}>
              <Line type="monotone" dataKey="saldo" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 3 }} />
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip formatter={(v) => [fmtBRL(v), 'Saldo']} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-text-dim text-center mt-1">Saldo mensal</p>
        </div>
      </div>

      {/* Por categoria (despesas) */}
      {expCats.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Despesas por categoria</p>
          </div>
          <div className="p-4 space-y-3">
            {expCats.map(cat => {
              const spent    = byCat[cat.id] || 0
              const budgeted = budget[cat.id] || 0
              const hasBudget = budgeted > 0
              const pct    = hasBudget ? Math.min(100, (spent / budgeted) * 100) : 0
              const over   = hasBudget && spent > budgeted
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-sm font-medium text-text-main">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold" style={{ color: over ? '#EF4444' : 'var(--text-main)' }}>{fmtBRL(spent)}</span>
                      {hasBudget && <span className="text-xs text-text-dim ml-1">/ {fmtBRL(budgeted)}</span>}
                    </div>
                  </div>
                  {hasBudget && (
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-2)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#EF4444' : cat.color }} />
                    </div>
                  )}
                  {over && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>⚠ Estourou {fmtBRL(spent - budgeted)}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Por categoria (receitas) */}
      {incCats.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Receitas do mês</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {incCats.map(cat => (
              <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2"><span>{cat.icon}</span><span className="text-sm text-text-main">{cat.name}</span></div>
                <span className="text-sm font-bold" style={{ color: '#10B981' }}>{fmtBRL(byCat[cat.id] || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {txs.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">💸</div>
          <p className="font-semibold text-text-muted mb-1">Nenhum lançamento</p>
          <p className="text-sm text-text-dim mb-4">Toque no botão + para registrar sua primeira movimentação.</p>
          {onQuickAdd && (
            <button onClick={onQuickAdd} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--primary)' }}>
              + Lançar agora
            </button>
          )}
        </div>
      )}
    </div>
  )
}
