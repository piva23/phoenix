import { useState, useMemo } from 'react'
import { useFinanceStore, monthKey, fmtBRL, fmtMonthLabel, parseMonthKey } from '../../../stores/useFinanceStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

export function FinanceAnalyticsView() {
  const [curMonth, setCurMonth] = useState(monthKey(new Date().getFullYear(), new Date().getMonth()))
  
  const {
    getMonthSummary,
    getMonthTransactions,
    getMonthByCategory,
    categories,
    budgets,
    budgetGroups
  } = useFinanceStore()

  const summary = getMonthSummary(curMonth)
  const byCat = getMonthByCategory(curMonth)

  const navMonth = (dir) => {
    const { year, month } = parseMonthKey(curMonth)
    const d = new Date(year, month + dir, 1)
    setCurMonth(monthKey(d.getFullYear(), d.getMonth()))
  }

  // 1. Gráfico de Barras: Receitas vs Despesas dos últimos 6 meses
  const barChartData = useMemo(() => {
    const data = []
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const mk = monthKey(d.getFullYear(), d.getMonth())
      const s = getMonthSummary(mk)
      data.push({
        name: d.toLocaleDateString('pt-BR', { month: 'short' }),
        Receitas: Math.round(s.income),
        Despesas: Math.round(s.expense),
      })
    }
    return data
  }, [curMonth])

  // 2. Gráfico de Donut: Gastos do mês atual agrupados por budgetGroups
  const donutChartData = useMemo(() => {
    if (!budgetGroups) return []
    return budgetGroups
      .map(group => {
        // Soma dos gastos reais de todas as categorias do grupo
        const totalSpent = group.categoryIds.reduce((sum, cid) => sum + (byCat[cid] || 0), 0)
        return {
          name: group.name,
          value: Math.round(totalSpent),
          color: group.color,
          icon: group.icon
        }
      })
      .filter(g => g.value > 0)
  }, [curMonth, byCat, budgetGroups])

  // 3. Card de Insights: Comparativo de Orçamento do Grupo vs Gasto Real
  const insights = useMemo(() => {
    if (!budgetGroups) return []
    const alerts = []
    let totalSpent = 0
    let totalBudgeted = 0

    budgetGroups.forEach(group => {
      const groupSpent = group.categoryIds.reduce((sum, cid) => sum + (byCat[cid] || 0), 0)
      const groupBudget = group.categoryIds.reduce((sum, cid) => {
        const b = budgets[curMonth] || {}
        return sum + Number(b[cid] || 0)
      }, 0)

      totalSpent += groupSpent
      totalBudgeted += groupBudget

      if (groupBudget > 0 && groupSpent > groupBudget) {
        alerts.push({
          type: 'danger',
          groupName: group.name,
          icon: group.icon,
          spent: groupSpent,
          budget: groupBudget,
          diff: groupSpent - groupBudget,
          message: `Você ultrapassou o limite do grupo ${group.name} em ${fmtBRL(groupSpent - groupBudget)}.`
        })
      } else if (groupBudget > 0 && groupSpent > groupBudget * 0.85) {
        alerts.push({
          type: 'warning',
          groupName: group.name,
          icon: group.icon,
          spent: groupSpent,
          budget: groupBudget,
          diff: groupBudget - groupSpent,
          message: `Atenção! Você já atingiu 85% do orçamento planejado para o grupo ${group.name}.`
        })
      }
    })

    return {
      alerts,
      totalSpent,
      totalBudgeted,
      hasLimits: totalBudgeted > 0
    }
  }, [curMonth, byCat, budgets, budgetGroups])

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="finance-analytics-view">
      
      {/* Seletor de Mês */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => navMonth(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/5 transition-colors">◀</button>
        <div className="text-center">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Período de Análise</span>
          <h2 className="text-base font-black text-text-main capitalize mt-0.5">{fmtMonthLabel(curMonth)}</h2>
        </div>
        <button onClick={() => navMonth(1)} className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-white/5 transition-colors">▶</button>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border bg-surface" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] uppercase font-bold text-text-dim block">Faturamento (Receitas)</span>
          <p className="text-lg font-black text-emerald-400 mt-1">{fmtBRL(summary.income)}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-surface" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] uppercase font-bold text-text-dim block">Despesas Reais</span>
          <p className="text-lg font-black text-rose-400 mt-1">{fmtBRL(summary.expense)}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-surface" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] uppercase font-bold text-text-dim block">Orçamento Planejado</span>
          <p className="text-lg font-black text-text-main mt-1">{fmtBRL(insights.totalBudgeted)}</p>
        </div>
        <div className="p-4 rounded-2xl border bg-surface" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <span className="text-[10px] uppercase font-bold text-text-dim block">Taxa de Poupança</span>
          <p className="text-lg font-black text-sky-400 mt-1">
            {summary.income > 0 ? `${Math.max(0, Math.round(((summary.income - summary.expense) / summary.income) * 100))}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Visão 1: Gráfico de Barras (Receitas vs Despesas dos últimos 6 meses) */}
      <div className="p-5 rounded-3xl border bg-surface space-y-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }} id="bar-chart-card">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-text-muted">Evolução Semestral</h3>
          <p className="text-xs text-text-dim mt-0.5">Visão consolidada de entradas vs saídas dos últimos seis meses</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} barSize={10} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$ ${v}`} />
              <Tooltip
                formatter={(value) => [fmtBRL(value)]}
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11, color: 'var(--text-main)' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
              <Bar dataKey="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Visão 2: Donut Chart dos Gastos do Mês Atual por Grupos de Categoria */}
      <div className="grid md:grid-cols-5 gap-6">
        <div className="p-5 rounded-3xl border bg-surface md:col-span-3 flex flex-col justify-between space-y-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }} id="donut-chart-card">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted font-bold">Distribuição por Grupo</h3>
            <p className="text-xs text-text-dim mt-0.5">Divisão inteligente dos gastos reais agrupados por grupos de orçamento</p>
          </div>
          
          {donutChartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-dim text-xs">
              <span className="text-3xl mb-2">🍽️</span>
              Sem despesas registradas no período selecionado.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {donutChartData.map((g, index) => (
                        <Cell key={`cell-${index}`} fill={g.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmtBRL(v)}
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-text-muted">Total Gastos</span>
                  <span className="text-xs font-black text-text-main mt-0.5">{fmtBRL(summary.expense)}</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                {donutChartData.map((g, idx) => {
                  const pct = Math.round((g.value / summary.expense) * 100) || 0
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{g.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-text-main">{g.name}</span>
                          <span className="text-[9px] text-text-dim">{pct}% do total de gastos</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-text-main">{fmtBRL(g.value)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Visão 3: Insights Financeiros */}
        <div className="p-5 rounded-3xl border bg-surface md:col-span-2 flex flex-col justify-between space-y-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }} id="insights-card">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted font-bold">Insights do Orçamento</h3>
            <p className="text-xs text-text-dim mt-0.5">Diagnósticos baseados no orçamento base zero definidos para o mês</p>
          </div>

          <div className="flex-1 space-y-3.5 my-2">
            {!insights.hasLimits ? (
              <div className="text-center p-6 bg-surface-2 rounded-2xl border text-xs text-text-dim flex flex-col items-center justify-center" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                <span className="text-2xl mb-2">📋</span>
                Nenhum orçamento definido para este mês. Vá para a aba "Orçamento" para planejar.
              </div>
            ) : insights.alerts.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span>❇️</span>
                  <span>Saúde Financeira Forte</span>
                </div>
                <p className="text-text-dim">Parabéns! Todos os seus grupos de categoria estão operando abaixo do teto planejado para este mês.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {insights.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      alert.type === 'danger'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <span>{alert.icon}</span>
                      <span>{alert.groupName}</span>
                    </div>
                    <p className="text-text-dim text-[11px] leading-relaxed">{alert.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-text-muted mt-1 font-semibold pt-1 border-t border-white/5">
                      <span>Orçado: {fmtBRL(alert.budget)}</span>
                      <span>Gasto: {fmtBRL(alert.spent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-surface-2 border rounded-2xl text-[11px] text-text-dim flex items-center gap-2" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
            <span>💡</span>
            <span>O Orçamento Base Zero ideal garante que o Saldo Livre seja zero no início do mês.</span>
          </div>
        </div>
      </div>

    </div>
  )
}
