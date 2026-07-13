import { useState } from 'react';
import { useHealthStore, FOOD_DB } from '../../../stores/useHealthStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import toast from 'react-hot-toast';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const ACCENT = '#7C3AED';

// ── COMPONENTE: TAG DE PROJETO ────────────────────────────────────────────────
function ProjectTag({ projectId }) {
  const getProjectById = useProjectStore(s => s.getProjectById);
  if (!projectId) return null;

  const project = getProjectById(projectId);
  if (!project) return null;

  return (
    <span
      className="ml-auto text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
      style={{
        color: project.cor || 'var(--text-dim)',
        borderColor: `${project.cor || '#888'}33`,
        background: `${project.cor || '#888'}11`,
      }}
    >
      {project.icone} {project.nome}
    </span>
  );
}

// ── COMPONENTE: CONTAINER ACORDEÃO ────────────────────────────────────────────
function PlanSection({ title, icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all mb-4 shadow-sm"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xl">{icon}</span>
        <span className="flex-1 font-black uppercase tracking-widest text-xs text-text-main">
          {title}
        </span>
        <span className="text-text-dim text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          className="px-4 pb-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Plano Água ────────────────────────────────────────────────────────────────
function WaterPlan() {
  const { plans, updateWaterPlan } = useHealthStore();
  const currentGoal =
    plans.water?.dailyGoalMl || plans.goals?.waterDailyMl || 3500;
  const [goal, setGoal] = useState(currentGoal);
  const [buttons, setButtons] = useState([
    ...(plans.water?.buttons || plans.waterButtons || []),
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [newMl, setNewMl] = useState('');

  const save = () => {
    updateWaterPlan({ dailyGoalMl: Number(goal), buttons });
    toast.success('Plano de hidratação salvo!');
  };

  const addBtn = () => {
    if (!newMl || Number(newMl) < 50) return;
    const lbl = newLabel.trim() || `💧 ${newMl}ml`;
    setButtons(b => [...b, { ml: Number(newMl), label: lbl }]);
    setNewLabel('');
    setNewMl('');
  };

  const removeBtn = i => setButtons(b => b.filter((_, idx) => idx !== i));

  const inp = 'px-3 py-2 rounded-xl text-sm outline-none font-medium';
  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div className="pt-4 space-y-4">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
          Meta diária (ml)
        </label>
        <input
          type="number"
          className={`${inp} w-full`}
          style={inpStyle}
          value={goal}
          onChange={e => setGoal(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
          Botões rápidos
        </label>
        <div className="space-y-2 mb-3">
          {buttons.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="flex-1 text-sm text-text-main px-3 py-2 rounded-xl"
                style={{ background: 'var(--bg-surface-2)' }}
              >
                {b.label}
              </span>
              <span className="text-xs font-bold text-gray-400">{b.ml}ml</span>
              <button
                onClick={() => removeBtn(i)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-2 rounded-xl border border-dashed border-gray-700 bg-black/20">
          <input
            className={`${inp} flex-1 bg-gray-900 border-gray-800`}
            placeholder="Emoji + Nome"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
          />
          <input
            type="number"
            className={`${inp} w-20 bg-gray-900 border-gray-800`}
            placeholder="ml"
            value={newMl}
            onChange={e => setNewMl(e.target.value)}
          />
          <button
            onClick={addBtn}
            className="px-4 py-2 rounded-xl text-sm font-black text-white transition-transform active:scale-95 bg-sky-600 hover:bg-sky-500"
          >
            ADD
          </button>
        </div>
      </div>
      <button
        onClick={save}
        className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black text-white transition-transform active:scale-95 shadow-md"
        style={{ background: ACCENT }}
      >
        Salvar Plano de Água
      </button>
    </div>
  );
}

// ── Plano Treino ──────────────────────────────────────────────────────────────
function WorkoutPlan() {
  const { plans, updateWorkoutDay } = useHealthStore();
  const [selDay, setSelDay] = useState(1);
  const dayPlan = plans.workout ? plans.workout[selDay] : null;
  const [label, setLabel] = useState(dayPlan?.label || '');
  const [exercises, setExercises] = useState(dayPlan?.exercises || []);
  const [isRest, setIsRest] = useState(!dayPlan);

  const switchDay = d => {
    setSelDay(d);
    const p = plans.workout[d];
    setIsRest(!p);
    setLabel(p?.label || '');
    setExercises(p?.exercises || []);
  };

  const addEx = () =>
    setExercises(e => [
      ...e,
      { id: `ex_${Date.now()}`, name: '', sets: 3, reps: '10-12', note: '' },
    ]);
  const updateEx = (i, field, val) =>
    setExercises(e =>
      e.map((ex, idx) =>
        idx === i
          ? { ...ex, [field]: field === 'sets' ? Number(val) : val }
          : ex
      )
    );
  const removeEx = i => setExercises(e => e.filter((_, idx) => idx !== i));

  const save = () => {
    updateWorkoutDay(selDay, isRest ? null : { label, exercises });
    toast.success(`Treino de ${DAYS[selDay]} salvo!`);
  };

  const inp = 'px-3 py-2 rounded-lg text-sm outline-none font-medium';
  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="flex gap-1 bg-black/30 p-1.5 rounded-2xl overflow-x-auto border border-gray-800">
        {DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => switchDay(i)}
            className="flex-1 min-w-[36px] py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            style={{
              background: selDay === i ? ACCENT : 'transparent',
              color: selDay === i ? '#fff' : 'var(--text-muted)',
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <div
        className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors"
        style={{
          borderColor: isRest ? '#F9731655' : 'var(--border)',
          background: isRest ? '#F9731615' : 'var(--bg-surface-2)',
        }}
        onClick={() => setIsRest(r => !r)}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            background: isRest ? '#F97316' : 'var(--bg-surface-2)',
            border: `1px solid ${isRest ? '#F97316' : 'var(--border)'}`,
          }}
        >
          {isRest && <span className="text-white text-xs font-black">✓</span>}
        </div>
        <span className="text-sm font-bold text-text-main">
          Definir como Dia de Descanso
        </span>
      </div>

      {!isRest && (
        <>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Título do Grupo Muscular
            </label>
            <input
              className={`${inp} w-full`}
              style={inpStyle}
              placeholder="Ex: Peito + Tríceps"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <div
                key={ex.id}
                className="rounded-2xl p-3 space-y-2 border border-gray-800 bg-gray-900/50"
              >
                <div className="flex gap-2">
                  <input
                    className={`${inp} flex-1`}
                    style={inpStyle}
                    placeholder="Nome do exercício"
                    value={ex.name}
                    onChange={e => updateEx(i, 'name', e.target.value)}
                  />
                  <button
                    onClick={() => removeEx(i)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 text-xs flex-shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                      Séries
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className={`${inp} w-full`}
                      style={inpStyle}
                      value={ex.sets}
                      onChange={e => updateEx(i, 'sets', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                      Reps
                    </label>
                    <input
                      className={`${inp} w-full`}
                      style={inpStyle}
                      placeholder="10-12"
                      value={ex.reps}
                      onChange={e => updateEx(i, 'reps', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addEx}
              className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all hover:opacity-80 active:scale-95"
              style={{
                borderColor: `${ACCENT}44`,
                color: ACCENT,
                background: `${ACCENT}0f`,
              }}
            >
              + Adicionar Exercício
            </button>
          </div>
        </>
      )}

      <button
        onClick={save}
        className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black text-white transition-transform active:scale-95 shadow-md"
        style={{ background: ACCENT }}
      >
        Salvar Treino ({DAYS[selDay]})
      </button>
    </div>
  );
}

// ── EDITOR DE HÁBITOS (CRUD) ──────────────────────────────────────────────────
function HabitsEditor() {
  const { plans = {}, addHabit, removeHabit } = useHealthStore();
  const projects = useProjectStore(s => s.projects) || [];

  const [name, setName] = useState('');
  const [type, setType] = useState('build');
  const [icon, setIcon] = useState('🔥');
  const [goalDays, setGoalDays] = useState(30);
  const [projectId, setProjectId] = useState('');

  const handleAdd = () => {
    if (!name) return toast.error('Nome obrigatório');
    addHabit({
      name,
      type,
      icon,
      projectId,
      goalDays: type === 'build' ? Number(goalDays) : 999,
    });
    setName('');
    toast.success('Hábito criado com sucesso!');
  };

  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="space-y-3">
        {plans.habits?.map(h => (
          <div
            key={h.id}
            className="flex justify-between items-center p-4 rounded-2xl border bg-gray-900/50"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <div className="text-base font-black text-white flex items-center gap-2 mb-1">
                <span>{h.icon}</span> {h.name}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                {h.type === 'quit'
                  ? '⛔ Mural da Sobriedade'
                  : `🏁 Desafio de ${h.goalDays} dias`}
              </div>
              <ProjectTag projectId={h.projectId} />
            </div>
            <button
              onClick={() => removeHabit(h.id)}
              className="text-red-400 px-3 py-2 text-xs font-black bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl border border-dashed border-gray-700 space-y-3 bg-black/20">
        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
          Criar Novo Desafio / Vício
        </h4>
        <div className="flex gap-2">
          <input
            className="w-14 px-2 py-2 rounded-xl text-center text-lg outline-none"
            style={inpStyle}
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="Emoji"
          />
          <input
            className="flex-1 px-3 py-2 rounded-xl text-sm font-bold outline-none"
            style={inpStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Ler 10 pgs / Sem Fumar"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="flex-1 px-2 py-2 rounded-xl text-xs font-bold outline-none"
            style={inpStyle}
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="build">✨ Virtude (Construir)</option>
            <option value="quit">⛔ Vício (Destruir)</option>
          </select>
          {type === 'build' && (
            <input
              type="number"
              className="w-24 px-3 py-2 rounded-xl text-xs font-bold outline-none"
              style={inpStyle}
              value={goalDays}
              onChange={e => setGoalDays(e.target.value)}
              placeholder="Dias"
              title="Dias do Desafio"
            />
          )}
        </div>
        <select
          className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none"
          style={inpStyle}
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          <option value="">Vincular a um Projeto? (Opcional)</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.icone} {p.nome}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black bg-purple-600 text-white hover:bg-purple-500 active:scale-95 transition-all mt-2"
        >
          Adicionar à Rotina
        </button>
      </div>
    </div>
  );
}

// ── EDITOR DE REMÉDIOS E SUPLEMENTOS (CRUD) ───────────────────────────────────
function MedsEditor() {
  const { plans = {}, addMed, removeMed } = useHealthStore();
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [icon, setIcon] = useState('💊');

  const handleAdd = () => {
    if (!name) return toast.error('Nome obrigatório');
    addMed({ name, time: time || 'Ao acordar', icon });
    setName('');
    setTime('');
    toast.success('Adicionado à Rotina!');
  };

  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {plans.meds?.map(m => (
          <div
            key={m.id}
            className="p-4 rounded-2xl border bg-gray-900/50 flex flex-col items-center relative"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-3xl mb-2">{m.icon}</span>
            <span className="text-sm font-black text-white text-center leading-tight">
              {m.name}
            </span>
            <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
              {m.time}
            </span>
            <button
              onClick={() => removeMed(m.id)}
              className="absolute top-2 right-2 text-red-400 text-xs bg-red-500/10 w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-all"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl border border-dashed border-gray-700 space-y-3 bg-black/20">
        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
          Novo Remédio / Sup.
        </h4>
        <div className="flex gap-2">
          <input
            className="w-14 px-2 py-2 rounded-xl text-center text-lg outline-none"
            style={inpStyle}
            value={icon}
            onChange={e => setIcon(e.target.value)}
            placeholder="Emoji"
          />
          <input
            className="flex-1 px-3 py-2 rounded-xl text-sm font-bold outline-none"
            style={inpStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Ômega 3"
          />
        </div>
        <input
          className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none"
          style={inpStyle}
          value={time}
          onChange={e => setTime(e.target.value)}
          placeholder="Horário (Ex: Após o almoço)"
        />
        <button
          onClick={handleAdd}
          className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition-all"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

// ── EDITOR DE CIRCUITOS (CRUD COMPLETO) ───────────────────────────────────────
function CircuitEditor() {
  const {
    plans = {},
    addCircuit,
    removeCircuit,
    updateCircuitMovements,
  } = useHealthStore();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [moves, setMoves] = useState([]);

  const handleAdd = () => {
    if (!name) return toast.error('Nome obrigatório');
    addCircuit({
      name,
      icon: '⏱️',
      rounds: 3,
      movements: [{ name: 'Polichinelos', reps: 20 }],
    });
    setName('');
    toast.success('Circuito Criado!');
  };

  const startEdit = c => {
    if (editingId === c.id) {
      setEditingId(null);
    } else {
      setEditingId(c.id);
      setMoves(JSON.parse(JSON.stringify(c.movements || [])));
    }
  };

  const saveMoves = id => {
    updateCircuitMovements(id, moves);
    setEditingId(null);
    toast.success('Exercícios do circuito salvos!');
  };

  const addMove = () => setMoves(m => [...m, { name: '', reps: 10 }]);
  const updateMove = (idx, field, val) =>
    setMoves(m => m.map((x, i) => (i === idx ? { ...x, [field]: val } : x)));
  const removeMove = idx => setMoves(m => m.filter((_, i) => i !== idx));

  const inp = 'px-3 py-2 rounded-lg text-sm outline-none font-medium';
  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div className="pt-4 space-y-4">
      {plans.circuits?.map(c => (
        <div
          key={c.id}
          className="p-4 rounded-2xl border bg-gray-900/50 flex flex-col gap-3 transition-all"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1 cursor-pointer" onClick={() => startEdit(c)}>
              <div className="text-base font-black text-white flex items-center gap-2">
                <span>{c.icon}</span> {c.name}
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                {c.movements?.length || 0} exercícios • {c.rounds} rounds
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(c)}
                className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => removeCircuit(c.id)}
                className="text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {editingId === c.id && (
            <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
              {moves.map((m, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-center bg-black/20 p-2 rounded-xl border border-gray-800"
                >
                  <input
                    className={`${inp} flex-1`}
                    style={inpStyle}
                    placeholder="Exercício"
                    value={m.name}
                    onChange={e => updateMove(i, 'name', e.target.value)}
                  />
                  <input
                    className={`${inp} w-20`}
                    style={inpStyle}
                    placeholder="Reps/s"
                    value={m.reps || m.timeSec || ''}
                    onChange={e => updateMove(i, 'reps', e.target.value)}
                  />
                  <button
                    onClick={() => removeMove(i)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 font-bold flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addMove}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border text-blue-400 border-blue-500/30 bg-blue-500/10"
                >
                  + Movimento
                </button>
                <button
                  onClick={() => saveMoves(c.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-black text-white bg-blue-600"
                >
                  Salvar Circuito
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2 p-3 rounded-2xl border border-dashed border-gray-700 bg-black/20">
        <input
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold outline-none bg-gray-800 text-white border border-gray-700"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do Novo Circuito"
        />
        <button
          onClick={handleAdd}
          className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all shadow-md"
        >
          Criar
        </button>
      </div>
    </div>
  );
}

// ── Plano Dieta ───────────────────────────────────────────────────────────────
function MealPlan() {
  const { plans, updateMealPlan } = useHealthStore();
  const sourceMeals = plans.mealPlan || plans.meals || [];
  const [meals, setMeals] = useState(JSON.parse(JSON.stringify(sourceMeals)));
  const [selMeal, setSelMeal] = useState(null);

  const updateItem = (mealIdx, itemIdx, field, val) => {
    setMeals(m => {
      const copy = JSON.parse(JSON.stringify(m));
      copy[mealIdx].items[itemIdx][field] = field === 'qty' ? Number(val) : val;
      return copy;
    });
  };

  const addItem = mealIdx => {
    setMeals(m => {
      const copy = JSON.parse(JSON.stringify(m));
      copy[mealIdx].items.push({
        id: `mi_${Date.now()}`,
        name: '',
        foodKey: 'ovo',
        qty: 1,
        optional: false,
      });
      return copy;
    });
  };

  const removeItem = (mealIdx, itemIdx) => {
    setMeals(m => {
      const copy = JSON.parse(JSON.stringify(m));
      copy[mealIdx].items = copy[mealIdx].items.filter((_, i) => i !== itemIdx);
      return copy;
    });
  };

  const addMeal = () => {
    setMeals(m => [
      ...m,
      {
        id: `meal_${Date.now()}`,
        time: '10:00',
        label: 'Nova Refeição',
        icon: '🍴',
        items: [],
      },
    ]);
  };

  const removeMeal = mealIdx => {
    setMeals(m => m.filter((_, i) => i !== mealIdx));
    if (selMeal === mealIdx) setSelMeal(null);
  };

  const save = () => {
    updateMealPlan(meals);
    toast.success('Plano alimentar salvo!');
  };

  const inp = 'px-3 py-2 rounded-xl text-sm font-medium outline-none';
  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div className="pt-4 space-y-4">
      {meals.map((meal, mi) => (
        <div
          key={meal.id}
          className="rounded-2xl overflow-hidden border"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
            style={{ background: 'var(--bg-surface-2)' }}
            onClick={() => setSelMeal(selMeal === mi ? null : mi)}
          >
            <span className="text-2xl">{meal.icon}</span>
            <span className="text-xs font-black text-green-500 w-12">
              {meal.time}
            </span>
            <span className="flex-1 text-base font-black text-text-main uppercase tracking-tight">
              {meal.label}
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/30 px-2 py-1 rounded-md">
              {meal.items.length} itens
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                removeMeal(mi);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 text-xs transition-colors ml-2"
            >
              ✕
            </button>
          </button>

          {selMeal === mi && (
            <div
              className="p-4 space-y-3 border-t bg-black/10"
              style={{ borderColor: 'var(--border)' }}
            >
              {/* Editar cabeçalho */}
              <div className="flex gap-2 mb-4">
                <input
                  className={`${inp} w-14 text-center text-lg`}
                  style={inpStyle}
                  placeholder="⏰"
                  value={meal.icon}
                  onChange={e =>
                    setMeals(m => {
                      const c = [...m];
                      c[mi] = { ...c[mi], icon: e.target.value };
                      return c;
                    })
                  }
                />
                <input
                  className={`${inp} w-24`}
                  style={inpStyle}
                  placeholder="09:00"
                  value={meal.time}
                  onChange={e =>
                    setMeals(m => {
                      const c = [...m];
                      c[mi] = { ...c[mi], time: e.target.value };
                      return c;
                    })
                  }
                />
                <input
                  className={`${inp} flex-1`}
                  style={inpStyle}
                  placeholder="Nome da refeição"
                  value={meal.label}
                  onChange={e =>
                    setMeals(m => {
                      const c = [...m];
                      c[mi] = { ...c[mi], label: e.target.value };
                      return c;
                    })
                  }
                />
              </div>

              {/* Itens */}
              <div className="space-y-2">
                {meal.items.map((item, ii) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 flex-wrap bg-gray-900/80 p-3 rounded-xl border border-gray-800"
                  >
                    <input
                      className={`${inp} flex-1 min-w-[120px]`}
                      style={inpStyle}
                      placeholder="Nome exibido"
                      value={item.name}
                      onChange={e => updateItem(mi, ii, 'name', e.target.value)}
                    />
                    <select
                      className={`${inp} text-xs`}
                      style={inpStyle}
                      value={item.foodKey}
                      onChange={e =>
                        updateItem(mi, ii, 'foodKey', e.target.value)
                      }
                    >
                      {Object.keys(FOOD_DB).map(k => (
                        <option key={k} value={k}>
                          {FOOD_DB[k]?.icon || ''} {k}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className={`${inp} w-16`}
                      style={inpStyle}
                      min={0.1}
                      step={0.5}
                      placeholder="qtd"
                      value={item.qty}
                      onChange={e => updateItem(mi, ii, 'qty', e.target.value)}
                    />
                    <button
                      onClick={() =>
                        updateItem(mi, ii, 'optional', !item.optional)
                      }
                      className="text-[10px] px-3 py-2 rounded-lg border whitespace-nowrap transition-colors uppercase tracking-widest font-black"
                      style={{
                        borderColor: item.optional
                          ? 'var(--border)'
                          : '#22C55E44',
                        color: item.optional ? 'var(--text-dim)' : '#22C55E',
                        background: item.optional ? 'transparent' : '#22C55E11',
                      }}
                    >
                      {item.optional ? 'Opcional' : 'Fixo'}
                    </button>
                    <button
                      onClick={() => removeItem(mi, ii)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addItem(mi)}
                className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black border mt-2 transition-colors hover:opacity-80 text-green-500 border-green-500/30 bg-green-500/10"
              >
                + Adicionar Alimento
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addMeal}
        className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black border transition-colors hover:opacity-80"
        style={{
          borderColor: `${ACCENT}44`,
          color: ACCENT,
          background: `${ACCENT}0f`,
        }}
      >
        + Adicionar Nova Refeição
      </button>
      <button
        onClick={save}
        className="w-full py-3.5 rounded-xl text-xs uppercase tracking-widest font-black text-white transition-transform active:scale-95 shadow-md mt-4"
        style={{ background: ACCENT }}
      >
        Salvar Plano Alimentar
      </button>
    </div>
  );
}

// ── TAB PLANOS (MAIN) ─────────────────────────────────────────────────────────
export function PlansTab() {
  return (
    <div className="space-y-4 pb-24">
      <PlanSection title="Rotina (Hábitos)" icon="🔥">
        <HabitsEditor />
      </PlanSection>
      <PlanSection title="Rotina (Remédios)" icon="💊">
        <MedsEditor />
      </PlanSection>
      <PlanSection title="Plano Alimentar" icon="🍽️">
        <MealPlan />
      </PlanSection>
      <PlanSection title="Treino Musculação" icon="💪">
        <WorkoutPlan />
      </PlanSection>
      <PlanSection title="Circuitos (WOD)" icon="⏱️">
        <CircuitEditor />
      </PlanSection>
      <PlanSection title="Hidratação" icon="💧">
        <WaterPlan />
      </PlanSection>
    </div>
  );
}
