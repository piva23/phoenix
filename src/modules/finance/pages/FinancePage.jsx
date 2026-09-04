import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Plus,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Layers,
  PlusCircle,
  Coins,
  ArrowLeftRight
} from 'lucide-react';

import { OverviewTab } from '../components/OverviewTab';
import { TransactionsTab } from '../components/TransactionsTab';
import { CreditCardsView } from '../views/CreditCardsView';
import { BudgetTab } from '../components/BudgetTab';
import { InvestTab } from '../components/InvestTab';
import { FinanceAnalyticsView } from '../views/FinanceAnalyticsView';
import { useFinanceStore, todayKey, fmtBRL } from '../../../stores/useFinanceStore';
import { PageHeader } from '../../../components/layout/PageHeader';

const TABS = [
  { id: 'overview',      label: '📊 Geral'        },
  { id: 'analytics',     label: '📈 Analytics'    },
  { id: 'transactions',  label: '💸 Lançamentos'  },
  { id: 'cards',         label: '💳 Cartões'      },
  { id: 'budget',        label: '📋 Orçamento'    },
  { id: 'invest',        label: '🎯 Investimentos' },
];

export function FinancePage() {
  const [tab, setTab] = useState('overview');
  const [searchParams] = useSearchParams();

  const {
    totalIncome,
    unallocatedBalance,
    pots,
    transactions,
    addIncome,
    allocateToPot,
    deallocateFromPot,
    addExpense,
    addNewPot,
    removePot,
    resetFinanceStore,
    getTotalInvested,
    getPendingRecurring
  } = useFinanceStore();

  const pendingRecurring = typeof getPendingRecurring === 'function' ? getPendingRecurring(todayKey()) : [];

  const [activeModal, setActiveModal] = useState(null);
  const [selectedPotId, setSelectedPotId] = useState('');

  const [incomeAmount, setIncomeAmount] = useState('');
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateAction, setAllocateAction] = useState('add');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  const [newPotName, setNewPotName] = useState('');
  const [newPotIcon, setNewPotIcon] = useState('📦');
  const [newPotColor, setNewPotColor] = useState('#8B5CF6');

  const handleOpenAllocate = (potId) => {
    setSelectedPotId(potId);
    setAllocateAmount('');
    setAllocateAction('add');
    setActiveModal('allocate');
  };

  const handleOpenExpense = (potId) => {
    setSelectedPotId(potId);
    setExpenseAmount('');
    setExpenseDesc('');
    setActiveModal('expense');
  };

  const submitIncome = (e) => {
    e.preventDefault();
    const val = parseFloat(incomeAmount);
    if (val > 0) {
      addIncome(val);
      setIncomeAmount('');
      setActiveModal(null);
    }
  };

  const submitAllocate = (e) => {
    e.preventDefault();
    const val = parseFloat(allocateAmount);
    if (val > 0) {
      if (allocateAction === 'add') {
        const balance = Number(unallocatedBalance) || 0;
        if (val <= balance) {
          allocateToPot(selectedPotId, val);
          setAllocateAmount('');
          setActiveModal(null);
        }
      } else {
        const pot = pots.find(p => p.id === selectedPotId);
        const allocated = Number(pot?.allocated) || 0;
        if (val <= allocated) {
          deallocateFromPot(selectedPotId, val);
          setAllocateAmount('');
          setActiveModal(null);
        }
      }
    }
  };

  const submitExpense = (e) => {
    e.preventDefault();
    const val = parseFloat(expenseAmount);
    if (val > 0) {
      addExpense(selectedPotId, val, expenseDesc.trim());
      setExpenseAmount('');
      setExpenseDesc('');
      setActiveModal(null);
    }
  };

  const submitNewPot = (e) => {
    e.preventDefault();
    if (newPotName.trim()) {
      addNewPot(newPotName.trim(), newPotIcon, newPotColor);
      setNewPotName('');
      setActiveModal(null);
    }
  };

  const safePots = Array.isArray(pots) ? pots : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalInvested = typeof getTotalInvested === 'function' ? getTotalInvested() : 0;

  // Open expense modal when arriving via Quick Access (?action=expense)
  React.useEffect(() => {
    if (searchParams.get('action') === 'expense') {
      if (safePots.length > 0) {
        setSelectedPotId(safePots[0].id);
        setExpenseAmount('');
        setExpenseDesc('');
        setActiveModal('expense');
      } else {
        setActiveModal('new-pot');
      }
    }
    // runs once on mount
  }, []);

  return (
    <div className="page-container">

      {/* Header Glassmorphism */}
      <PageHeader
        icon="💰"
        title="Finanças Inteligentes"
        subtitle={`Planejamento do ciclo de ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
      >
        <button
          onClick={resetFinanceStore}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-[10px] font-black text-text-dim hover:text-text-main uppercase tracking-widest cursor-pointer transition-all duration-300"
        >
          <RefreshCw size={12} className="text-primary" /> Resetar Simulação
        </button>
      </PageHeader>

        {/* Alerta de recorrências pendentes */}
        {pendingRecurring.length > 0 && (
          <button
            onClick={() => setTab('budget')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-semibold mb-4 text-left bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/5 transition-all hover:bg-amber-500/15"
          >
            <span className="text-lg">🔔</span>
            <span className="flex-1">
              {pendingRecurring.length === 1
                ? `1 movimentação fixa pendente de confirmação: ${pendingRecurring[0].name}`
                : `${pendingRecurring.length} movimentações fixas pendentes de confirmação`}
            </span>
            <span className="font-bold underline uppercase tracking-wider text-[10px]">Confirmar →</span>
          </button>
        )}

        {/* Tabs - Glassmorphism Pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide p-1.5 card-surface">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap uppercase tracking-wider cursor-pointer ${
                tab === t.id
                  ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 border border-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

      {/* Content */}
      <div className="p-4 space-y-6">

        {/* ABA VISÃO GERAL (ZBB) */}
        {tab === 'overview' && (
          <div className="space-y-6">

            {/* HERO CARD */}
            <div className="card-glass relative overflow-hidden p-6 md:p-8">
              <div className="absolute -top-12 -right-12 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-3">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono block">
                    Disponível sem Destinação
                  </span>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-none font-mono">
                    {fmtBRL(unallocatedBalance)}
                  </h2>
                  {(Number(unallocatedBalance) || 0) > 0 ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle size={12} /> Você possui fundos sem missão. Aloque este dinheiro!
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 size={12} className="animate-bounce" /> Orçamento Base Zero Perfeito 🎯
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <div className="card-surface px-5 py-3.5 min-w-[130px]">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Receita Total</span>
                    <span className="text-sm font-black text-white font-mono">{fmtBRL(totalIncome)}</span>
                  </div>
                  <div className="card-surface px-5 py-3.5 min-w-[130px]">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Total Investido</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">{fmtBRL(totalInvested)}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveModal('income')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-xs font-black text-white uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/25 cursor-pointer"
                    >
                      <Plus size={14} /> Adicionar Receita
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* POTES / ENVELOPES */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-[#9B9AAB] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target size={14} className="text-primary" /> Potes / Envelopes de Capital
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    Defina limites, planeje e aloque para cada categoria
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal('new-pot')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-[10px] font-black text-primary hover:text-purple-300 uppercase tracking-widest cursor-pointer transition-all duration-300"
                >
                  <Plus size={12} /> Criar Pote
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safePots.map((pot) => {
                  const potSpent = Number(pot.spent) || 0;
                  const potAllocated = Number(pot.allocated) || 0;
                  const hasOverspent = potSpent > potAllocated;
                  const progress = potAllocated > 0 ? Math.round((potSpent / potAllocated) * 100) : 0;
                  const progressVisual = Math.min(100, progress);

                  return (
                    <div
                      key={pot.id}
                      className="group relative overflow-hidden card-glass p-5 hover:border-white/10 transition-all duration-300"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-[4px]"
                        style={{ backgroundColor: pot.color || '#8B5CF6' }}
                      />

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-md"
                            style={{
                              backgroundColor: `${pot.color || '#8B5CF6'}15`,
                              border: `1px solid ${pot.color || '#8B5CF6'}30`
                            }}
                          >
                            {pot.icon || '📦'}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wide">{pot.name || 'Pote'}</h4>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Pote #{pot.id}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removePot(pot.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all duration-300 cursor-pointer"
                          title="Excluir Pote"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4 card-surface p-3">
                        <div>
                          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Alocado</span>
                          <span className="text-xs font-black text-white font-mono">{fmtBRL(potAllocated)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block">Gasto</span>
                          <span className={`text-xs font-black font-mono ${hasOverspent ? 'text-rose-500' : 'text-zinc-300'}`}>
                            {fmtBRL(potSpent)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-5">
                        <div className="flex justify-between text-[8px] uppercase tracking-widest font-black font-mono">
                          <span className={hasOverspent ? 'text-rose-400' : 'text-zinc-500'}>
                            {hasOverspent ? 'ESTOURO!' : 'Consumido'}
                          </span>
                           <span className={hasOverspent ? 'text-rose-400' : 'text-primary'}>{progress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/5 relative">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressVisual}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{
                              backgroundColor: hasOverspent ? '#EF4444' : (pot.color || '#8B5CF6'),
                              boxShadow: `0 0 10px ${hasOverspent ? '#EF444460' : `${pot.color || '#8B5CF6'}50`}`
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenAllocate(pot.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer"
                        >
                          <Plus size={12} /> Alocar / Ajustar
                        </button>
                        <button
                          onClick={() => handleOpenExpense(pot.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer"
                        >
                          <ArrowDownRight size={12} className="text-rose-400" /> Despesa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EXTRATO */}
            <div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <ArrowLeftRight size={14} className="text-emerald-400" /> Extrato do Orçamento
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                    Histórico de movimentações e distribuições de potes
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {safeTransactions.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    Nenhuma transação registrada neste ciclo
                  </div>
                ) : (
                  safeTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const potObj = safePots.find(p => p.id === tx.potId);

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3.5 bg-[#17171E]/40 border border-white/5 rounded-2xl hover:bg-[#17171E]/70 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isIncome
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                          }`}>
                            {isIncome ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">{tx.description}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-zinc-500 font-mono">{tx.date}</span>
                              {potObj && (
                                <span
                                  className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${potObj.color || '#8B5CF6'}15`, color: potObj.color || '#8B5CF6', border: `1px solid ${potObj.color || '#8B5CF6'}25` }}
                                >
                                  {potObj.icon || '📦'} {potObj.name || 'Pote'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black font-mono ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isIncome ? '+' : '-'} {fmtBRL(tx.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* OUTRAS ABAS */}
        {tab === 'analytics' && <FinanceAnalyticsView />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'cards' && <CreditCardsView />}
        {tab === 'budget' && <BudgetTab />}
        {tab === 'invest' && <InvestTab />}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-[#0F0E17]/95 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full filter blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-purple-400 animate-pulse" />
                  {activeModal === 'income' && 'Adicionar Receita'}
                  {activeModal === 'allocate' && 'Ajustar Orçamento do Pote'}
                  {activeModal === 'expense' && 'Registrar Despesa do Pote'}
                  {activeModal === 'new-pot' && 'Criar Novo Pote'}
                </h4>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-bold bg-white/5 hover:bg-white/10 p-1.5 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {activeModal === 'income' && (
                <form onSubmit={submitIncome} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Valor (BRL)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-500 font-mono">R$</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0,00"
                        value={incomeAmount}
                        onChange={(e) => setIncomeAmount(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white outline-none font-mono"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-xs font-black text-white uppercase tracking-wider cursor-pointer shadow-lg shadow-purple-500/20 hover:opacity-90 active:scale-98 transition-all"
                  >
                    Confirmar Recebimento
                  </button>
                </form>
              )}

              {activeModal === 'allocate' && (
                <form onSubmit={submitAllocate} className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Pote Selecionado</span>
                    <span className="text-xs font-black text-white flex items-center gap-2">
                      <span className="text-base">{safePots.find(p => p.id === selectedPotId)?.icon}</span>
                      {safePots.find(p => p.id === selectedPotId)?.name}
                    </span>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px]">
                      <div>
                        <span className="text-zinc-500 block text-[8px] uppercase tracking-wider">Não Alocado</span>
                        <span className="font-mono text-purple-400 font-bold">{fmtBRL(unallocatedBalance)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 block text-[8px] uppercase tracking-wider">Alocado no Pote</span>
                        <span className="font-mono text-zinc-300 font-bold">
                          {fmtBRL(safePots.find(p => p.id === selectedPotId)?.allocated)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 p-1 bg-black/30 border border-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAllocateAction('add')}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                        allocateAction === 'add'
                          ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Plus size={10} className="inline mr-1" /> Destinar Fundos
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocateAction('remove')}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                        allocateAction === 'remove'
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <ArrowDownRight size={10} className="inline mr-1" /> Retirar Fundos
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">
                      {allocateAction === 'add' ? 'Valor para Destinar (BRL)' : 'Valor para Retirar (BRL)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-500 font-mono">R$</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0,00"
                        max={allocateAction === 'add' ? unallocatedBalance : (pots.find(p => p.id === selectedPotId)?.allocated || 0)}
                        value={allocateAmount}
                        onChange={(e) => setAllocateAmount(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white outline-none font-mono"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3.5 rounded-xl text-xs font-black text-white uppercase tracking-wider cursor-pointer shadow-lg hover:opacity-90 active:scale-98 transition-all ${
                      allocateAction === 'add'
                        ? 'bg-purple-500 shadow-purple-500/20'
                        : 'bg-rose-500 shadow-rose-500/20'
                    }`}
                  >
                    {allocateAction === 'add' ? 'Confirmar Alocação' : 'Confirmar Retirada'}
                  </button>
                </form>
              )}

              {activeModal === 'expense' && (
                <form onSubmit={submitExpense} className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Pote de Origem</span>
                    <span className="text-xs font-black text-white flex items-center gap-2">
                      <span className="text-base">{safePots.find(p => p.id === selectedPotId)?.icon}</span>
                      {safePots.find(p => p.id === selectedPotId)?.name}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Valor Gasto (BRL)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-500 font-mono">R$</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0,00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white outline-none font-mono"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Assinatura, Mercado, Almoço"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-rose-500 text-xs font-black text-white uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-500/20 hover:opacity-90 active:scale-98 transition-all"
                  >
                    Lançar Despesa
                  </button>
                </form>
              )}

              {activeModal === 'new-pot' && (
                <form onSubmit={submitNewPot} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Nome do Pote</label>
                    <input
                      type="text"
                      placeholder="Ex: Reserva, Viagem, Assinaturas"
                      value={newPotName}
                      onChange={(e) => setNewPotName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Ícone / Emoji</label>
                      <input
                        type="text"
                        placeholder="Ex: 🍔, 🏠, 🎮"
                        value={newPotIcon}
                        onChange={(e) => setNewPotIcon(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-3 text-xs text-center text-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-black block">Cor Hexadecimal</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={newPotColor}
                          onChange={(e) => setNewPotColor(e.target.value)}
                          className="w-10 h-10 bg-transparent border-0 rounded-xl cursor-pointer outline-none flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={newPotColor}
                          onChange={(e) => setNewPotColor(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-xl px-2.5 py-3 text-[10px] text-white outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-xs font-black text-white uppercase tracking-wider cursor-pointer shadow-lg shadow-purple-500/20 hover:opacity-90 active:scale-98 transition-all"
                  >
                    Criar Pote
                  </button>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default FinancePage;
