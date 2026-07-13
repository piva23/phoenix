import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export function MentalModelsPage() {
  const [activeTab, setActiveTab] = useState('eisenhower'); // eisenhower | opportunity

  // ─── ESTADOS DA MATRIZ DE EISENHOWER ──────────────────────────────────────────
  const [eisenhowerTasks, setEisenhowerTasks] = useState(() => {
    const saved = localStorage.getItem('phoenix_eisenhower');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'Concluir módulo de revisão de Direito Administrativo', quadrant: 'urgent_important', done: false },
      { id: '2', text: 'Planejar cronograma de estudos da próxima rodada', quadrant: 'important_not_urgent', done: false },
      { id: '3', text: 'Responder e-mails secundários ou de publicidade', quadrant: 'urgent_not_important', done: false },
      { id: '4', text: 'Assistir a episódios de série de forma descontrolada', quadrant: 'not_urgent_not_important', done: false },
    ];
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [targetQuadrant, setTargetQuadrant] = useState('urgent_important');

  useEffect(() => {
    localStorage.setItem('phoenix_eisenhower', JSON.stringify(eisenhowerTasks));
  }, [eisenhowerTasks]);

  const addEisenhowerTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: `task_${Date.now()}`,
      text: newTaskText.trim(),
      quadrant: targetQuadrant,
      done: false
    };
    setEisenhowerTasks([...eisenhowerTasks, newTask]);
    setNewTaskText('');
    toast.success('Decisão adicionada à matriz!');
  };

  const toggleTaskDone = (id) => {
    setEisenhowerTasks(eisenhowerTasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    setEisenhowerTasks(eisenhowerTasks.filter(t => t.id !== id));
    toast.success('Item removido!');
  };

  const getTasksByQuadrant = (quadrant) => {
    return eisenhowerTasks.filter(t => t.quadrant === quadrant);
  };

  // ─── ESTADOS DO CUSTO DE OPORTUNIDADE ─────────────────────────────────────────
  const [opA, setOpA] = useState({
    name: 'Opção A (Fazer Pós-Graduação)',
    cost: 15000,
    returnVal: 45000,
    hoursPerWeek: 10,
    hourlyValue: 40,
    intangible: 8,
  });

  const [opB, setOpB] = useState({
    name: 'Opção B (Desenvolver Projeto Próprio)',
    cost: 5000,
    returnVal: 65000,
    hoursPerWeek: 15,
    hourlyValue: 40,
    intangible: 9,
  });

  // Cálculos de Custo de Oportunidade
  // Custo de Tempo Anual = horas semanais * valor da hora * 52 semanas
  const timeCostA = opA.hoursPerWeek * opA.hourlyValue * 52;
  const timeCostB = opB.hoursPerWeek * opB.hourlyValue * 52;

  const totalCostA = Number(opA.cost) + timeCostA;
  const totalCostB = Number(opB.cost) + timeCostB;

  const netValueA = Number(opA.returnVal) - totalCostA;
  const netValueB = Number(opB.returnVal) - totalCostB;

  const isABetter = netValueA > netValueB;
  const opportunityCost = Math.abs(netValueA - netValueB);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-main">
            🧠 Modelos Mentais de Decisão
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Utilize frameworks consagrados para clarear suas prioridades e otimizar recursos.
          </p>
        </div>

        {/* Abas */}
        <div className="flex p-1 rounded-xl bg-zinc-900 border border-white/5" style={{ background: 'var(--bg-surface)' }}>
          <button
            onClick={() => setActiveTab('eisenhower')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'eisenhower'
                ? 'bg-[var(--primary)] text-white shadow-md'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            🎯 Matriz de Eisenhower
          </button>
          <button
            onClick={() => setActiveTab('opportunity')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'opportunity'
                ? 'bg-[var(--primary)] text-white shadow-md'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            ⚖️ Custo de Oportunidade
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: MATRIZ DE EISENHOWER */}
      {activeTab === 'eisenhower' && (
        <div className="space-y-6">
          {/* Adicionador Rápido */}
          <form
            onSubmit={addEisenhowerTask}
            className="p-4 rounded-2xl border flex flex-col md:flex-row gap-3 items-end md:items-center"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex-1 w-full space-y-1">
              <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                Nova Decisão / Tarefa:
              </label>
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Ex: Revisar matéria de maior dificuldade no edital..."
                className="w-full px-3 py-2.5 rounded-xl text-xs border outline-none"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
              />
            </div>

            <div className="w-full md:w-56 space-y-1">
              <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                Quadrante de Destino:
              </label>
              <select
                value={targetQuadrant}
                onChange={(e) => setTargetQuadrant(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs border outline-none"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-main)',
                }}
              >
                <option value="urgent_important">🔥 Urgente & Importante (Fazer)</option>
                <option value="important_not_urgent">📅 Importante & Não Urgente (Agendar)</option>
                <option value="urgent_not_important">⚡ Urgente & Não Importante (Delegar)</option>
                <option value="not_urgent_not_important">🗑️ Não Urgente & Não Importante (Eliminar)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              Adicionar
            </button>
          </form>

          {/* Grid de Quadrantes 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Q1: Urgente & Importante */}
            <div className="p-4 rounded-2xl border-2 flex flex-col h-[320px] bg-red-500/3 border-red-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                    🔥 Quadrante 1: Fazer
                  </span>
                </div>
                <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">
                  Urgente & Importante
                </span>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
                {getTasksByQuadrant('urgent_important').length === 0 ? (
                  <p className="text-[11px] text-text-dim italic text-center py-12">Nenhum item adicionado.</p>
                ) : (
                  getTasksByQuadrant('urgent_important').map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/2 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task.id)}
                          className="rounded text-red-500 bg-zinc-800 border-white/10"
                        />
                        <span className={`text-xs truncate ${task.done ? 'line-through opacity-40 text-text-muted' : 'text-text-main'}`}>
                          {task.text}
                        </span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-text-muted hover:text-red-400 text-xs px-1">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Q2: Importante & Não Urgente */}
            <div className="p-4 rounded-2xl border-2 flex flex-col h-[320px] bg-cyan-500/3 border-cyan-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    📅 Quadrante 2: Agendar
                  </span>
                </div>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                  Estratégico & Longo Prazo
                </span>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
                {getTasksByQuadrant('important_not_urgent').length === 0 ? (
                  <p className="text-[11px] text-text-dim italic text-center py-12">Nenhum item adicionado.</p>
                ) : (
                  getTasksByQuadrant('important_not_urgent').map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/2 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task.id)}
                          className="rounded text-cyan-500 bg-zinc-800 border-white/10"
                        />
                        <span className={`text-xs truncate ${task.done ? 'line-through opacity-40 text-text-muted' : 'text-text-main'}`}>
                          {task.text}
                        </span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-text-muted hover:text-cyan-400 text-xs px-1">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Q3: Urgente & Não Importante */}
            <div className="p-4 rounded-2xl border-2 flex flex-col h-[320px] bg-amber-500/3 border-amber-500/20">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    ⚡ Quadrante 3: Delegar
                  </span>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                  Interrupções & Rotinas
                </span>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
                {getTasksByQuadrant('urgent_not_important').length === 0 ? (
                  <p className="text-[11px] text-text-dim italic text-center py-12">Nenhum item adicionado.</p>
                ) : (
                  getTasksByQuadrant('urgent_not_important').map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/2 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task.id)}
                          className="rounded text-amber-500 bg-zinc-800 border-white/10"
                        />
                        <span className={`text-xs truncate ${task.done ? 'line-through opacity-40 text-text-muted' : 'text-text-main'}`}>
                          {task.text}
                        </span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-text-muted hover:text-amber-400 text-xs px-1">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Q4: Não Urgente & Não Importante */}
            <div className="p-4 rounded-2xl border-2 flex flex-col h-[320px] bg-zinc-700/5 border-zinc-700/25">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    🗑️ Quadrante 4: Eliminar
                  </span>
                </div>
                <span className="text-[10px] bg-white/5 text-text-dim px-2 py-0.5 rounded-full font-bold">
                  Distrações / Descarte
                </span>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
                {getTasksByQuadrant('not_urgent_not_important').length === 0 ? (
                  <p className="text-[11px] text-text-dim italic text-center py-12">Nenhum item adicionado.</p>
                ) : (
                  getTasksByQuadrant('not_urgent_not_important').map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/2 border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task.id)}
                          className="rounded text-zinc-500 bg-zinc-800 border-white/10"
                        />
                        <span className={`text-xs truncate ${task.done ? 'line-through opacity-40 text-text-muted' : 'text-text-main'}`}>
                          {task.text}
                        </span>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-text-muted hover:text-zinc-400 text-xs px-1">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: CUSTO DE OPORTUNIDADE */}
      {activeTab === 'opportunity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna da Esquerda - Entrada de Dados das duas Opções */}
          <div className="lg:col-span-7 space-y-6">
            {/* Opção A */}
            <div
              className="p-5 rounded-2xl border space-y-4"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-sm">🅰</span>
                <input
                  type="text"
                  value={opA.name}
                  onChange={(e) => setOpA({ ...opA, name: e.target.value })}
                  className="font-bold text-sm bg-transparent border-none outline-none text-text-main flex-1 focus:border-b focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Custo Financeiro Direto (R$):</label>
                  <input
                    type="number"
                    value={opA.cost}
                    onChange={(e) => setOpA({ ...opA, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Retorno Financeiro Estimado (R$):</label>
                  <input
                    type="number"
                    value={opA.returnVal}
                    onChange={(e) => setOpA({ ...opA, returnVal: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Tempo Gasto (Horas/Semana):</label>
                  <input
                    type="number"
                    value={opA.hoursPerWeek}
                    onChange={(e) => setOpA({ ...opA, hoursPerWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Valor Estimado da Sua Hora (R$/h):</label>
                  <input
                    type="number"
                    value={opA.hourlyValue}
                    onChange={(e) => setOpA({ ...opA, hourlyValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Opção B */}
            <div
              className="p-5 rounded-2xl border space-y-4"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-sm">🅱</span>
                <input
                  type="text"
                  value={opB.name}
                  onChange={(e) => setOpB({ ...opB, name: e.target.value })}
                  className="font-bold text-sm bg-transparent border-none outline-none text-text-main flex-1 focus:border-b focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Custo Financeiro Direto (R$):</label>
                  <input
                    type="number"
                    value={opB.cost}
                    onChange={(e) => setOpB({ ...opB, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Retorno Financeiro Estimado (R$):</label>
                  <input
                    type="number"
                    value={opB.returnVal}
                    onChange={(e) => setOpB({ ...opB, returnVal: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Tempo Gasto (Horas/Semana):</label>
                  <input
                    type="number"
                    value={opB.hoursPerWeek}
                    onChange={(e) => setOpB({ ...opB, hoursPerWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Valor Estimado da Sua Hora (R$/h):</label>
                  <input
                    type="number"
                    value={opB.hourlyValue}
                    onChange={(e) => setOpB({ ...opB, hourlyValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-900 border border-white/10 text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita - Cálculos de Custo de Oportunidade e Gráfico */}
          <div className="lg:col-span-5 space-y-6">
            {/* Bloco Analítico do Custo de Oportunidade */}
            <div
              className="p-5 rounded-2xl border space-y-5 text-center flex flex-col justify-between"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div>
                <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">Análise Final Comparativa</h3>
                <div className="mt-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-left">
                  <p className="text-xs text-text-main font-semibold">
                    🏆 Opção Favorável Financeiramente:
                  </p>
                  <p className="text-sm font-black text-purple-400 mt-1">
                    {isABetter ? opA.name : opB.name}
                  </p>
                  <div className="mt-3 border-t border-white/5 pt-2.5 space-y-1 text-[11px] text-text-muted">
                    <p>O retorno líquido anualizado considera os custos financeiros reais somados ao valor de tempo investido (custo intangível do tempo pessoal).</p>
                  </div>
                </div>

                {/* Cálculo Dinâmico de Custo de Oportunidade */}
                <div className="mt-4 bg-zinc-900/40 border border-white/5 rounded-xl p-4 text-left">
                  <p className="text-xs font-bold text-text-dim uppercase tracking-widest">
                    ⚖️ Custo de Oportunidade Real:
                  </p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    R$ {opportunityCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-text-dim mt-1">
                    Este é o valor financeiro e de produtividade que você abre mão de ganhar/reter ao escolher a opção menos lucrativa.
                  </p>
                </div>
              </div>

              {/* Gráfico de Barras Customizado e Responsivo feito com Tailwind */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider text-left">
                  Visualização do Retorno Líquido Anual (R$):
                </p>

                {/* Opção A Bar */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[200px] font-semibold">{opA.name}</span>
                    <span className={`font-bold ${netValueA >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                      R$ {netValueA.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, Math.min(100, (netValueA / Math.max(1, netValueA, netValueB)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Opção B Bar */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[200px] font-semibold">{opB.name}</span>
                    <span className={`font-bold ${netValueB >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                      R$ {netValueB.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, Math.min(100, (netValueB / Math.max(1, netValueA, netValueB)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
