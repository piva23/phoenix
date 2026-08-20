import { useState, useRef } from 'react';
import { useHealthStore, FOOD_DB } from '../../../stores/useHealthStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Dumbbell, 
  Timer, 
  Plus, 
  Flame, 
  Sparkles, 
  Trash2, 
  Pencil, 
  Droplets, 
  Pill, 
  Utensils, 
  Layers, 
  Upload
} from 'lucide-react';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DEFAULT_CIRCUIT_MOVEMENTS = [
  { name: 'Burpees explosivos', reps: 15 },
  { name: 'Kettlebell Swings', reps: 20 },
  { name: 'Flexões de Braço', reps: 20 },
  { name: 'Abdominais Remador', reps: 25 },
];

function ProjectTag({ projectId }) {
  const getProjectById = () => null;
  if (!projectId) return null;
  const project = getProjectById(projectId);
  if (!project) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border"
      style={{
        color: project.cor || '#A855F7',
        borderColor: `${project.cor || '#A855F7'}44`,
        background: `${project.cor || '#A855F7'}15`,
      }}
    >
      {project.icone} {project.nome}
    </span>
  );
}

export function PlansTab() {
  const {
    plans = {},
    importHealthJSON,
    updateWorkoutDay,
    updateWaterPlan,
    updateMealPlan,
    addFoodDbItem,
    addHabit,
    removeHabit,
    addMed,
    removeMed,
    addCircuit,
    removeCircuit,
    updateCircuitMovements
  } = useHealthStore();

  const projects = useProjectStore(s => s.projects || []);

  const themeColor = '#8B5CF6';

  // Modal / Inline Form de cadastrar alimento no foodDb
  const [showAddFoodDbModal, setShowAddFoodDbModal] = useState(false);
  const [newFoodDbName, setNewFoodDbName] = useState('');
  const [newFoodDbKcal, setNewFoodDbKcal] = useState('');
  const [newFoodDbProt, setNewFoodDbProt] = useState('');
  const [newFoodDbCarb, setNewFoodDbCarb] = useState('');
  const [newFoodDbFat, setNewFoodDbFat] = useState('');

  const handleRegisterFoodDb = () => {
    if (!newFoodDbName.trim()) {
      toast.error('Informe o nome do alimento!');
      return;
    }
    const foodKey = newFoodDbName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const foodObj = {
      name: newFoodDbName.trim(),
      kcal: Number(newFoodDbKcal) || 0,
      prot: Number(newFoodDbProt) || 0,
      carb: Number(newFoodDbCarb) || 0,
      fat: Number(newFoodDbFat) || 0,
    };

    if (addFoodDbItem) {
      addFoodDbItem(foodKey, foodObj);
    }
    toast.success(`Alimento "${newFoodDbName}" cadastrado no Banco de Alimentos! 🥗`);
    setShowAddFoodDbModal(false);
    setNewFoodDbName('');
    setNewFoodDbKcal('');
    setNewFoodDbProt('');
    setNewFoodDbCarb('');
    setNewFoodDbFat('');
  };

  // Subaba administrativa selecionada: 'workout' | 'meals' | 'habits' | 'meds' | 'water'
  const [adminTab, setAdminTab] = useState('workout');

  const fileInputRef = useRef(null);

  // Manipulador de importação de arquivo JSON
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const ok = importHealthJSON(content);
        if (ok) {
          toast.success('Planos e rotinas importados com sucesso! 📥', { icon: '✨' });
        } else {
          toast.error('Formato de JSON inválido.');
        }
      } catch (err) {
        toast.error('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const todayDow = new Date().getDay();
  const [selectedDow, setSelectedDow] = useState(todayDow);
  const [activeMode, setActiveMode] = useState('classic'); // 'classic' | 'circuit'

  // ── ESTADOS DO CIRCUITO / WOD ──────────────────────────────────────────────
  const circuitsList = Array.isArray(plans.circuits) && plans.circuits.length > 0
    ? plans.circuits
    : [{ id: 'c1', name: 'WOD - Workout Of The Day', rounds: 4, movements: DEFAULT_CIRCUIT_MOVEMENTS }];

  const [selectedCircuitIndex, setSelectedCircuitIndex] = useState(0);

  // Estados de edição de circuito
  const [editingCircuitId, setEditingCircuitId] = useState(null);
  const [circuitMovesDraft, setCircuitMovesDraft] = useState([]);
  const [newCircuitName, setNewCircuitName] = useState('');

  // Edição de movimentos do circuito
  const startEditCircuit = (c) => {
    if (editingCircuitId === c.id) {
      setEditingCircuitId(null);
    } else {
      setEditingCircuitId(c.id);
      setCircuitMovesDraft(JSON.parse(JSON.stringify(c.movements || [])));
    }
  };

  const saveCircuitMoves = (cId) => {
    updateCircuitMovements(cId, circuitMovesDraft);
    setEditingCircuitId(null);
    toast.success('Exercícios do circuito atualizados com sucesso!');
  };

  const addCircuitMove = () => {
    setCircuitMovesDraft(m => [...m, { name: 'Novo Exercício', reps: 15 }]);
  };

  const updateCircuitMoveField = (idx, field, val) => {
    setCircuitMovesDraft(m => m.map((x, i) => i === idx ? { ...x, [field]: val } : x));
  };

  const removeCircuitMove = (idx) => {
    setCircuitMovesDraft(m => m.filter((_, i) => i !== idx));
  };

  const handleCreateCircuit = () => {
    if (!newCircuitName.trim()) return toast.error('Digite o nome do circuito');
    addCircuit({
      name: newCircuitName.trim(),
      icon: '⏱️',
      rounds: 3,
      movements: [{ name: 'Flexões de Braço', reps: 15 }, { name: 'Agachamentos', reps: 20 }]
    });
    setNewCircuitName('');
    toast.success('Novo Circuito criado com sucesso!');
  };

  // ── BANCO DE DADOS ALIMENTAR ATIVO (RELACIONAL) ────────────────────────────
  const activeFoodDb = { ...(FOOD_DB || {}), ...(plans.foodDb || {}) };

  // ── GERENCIAMENTO DE TREINO CLÁSSICO ────────────────────────────────────────
  const dayPlan = (plans.workout?.[selectedDow] || plans.workout?.[String(selectedDow)] || plans.workoutPlan?.[selectedDow] || plans.workoutPlan?.[String(selectedDow)]) || { label: `Treino de ${DAYS[selectedDow]}`, exercises: [] };

  const handleAddExercise = () => {
    const newEx = {
      id: `ex_${Date.now()}`,
      name: 'Novo Exercício',
      sets: 3,
      reps: '10',
      note: '',
      carga: '40kg',
      extraSets: []
    };
    const updatedExercises = [...(dayPlan.exercises || []), newEx];
    updateWorkoutDay(selectedDow, { ...dayPlan, exercises: updatedExercises });
    toast.success('Novo exercício adicionado ao plano! 🏋️‍♂️');
  };

  const handleRemoveExercise = (exId) => {
    const updatedExercises = (dayPlan.exercises || []).filter(ex => ex.id !== exId);
    updateWorkoutDay(selectedDow, { ...dayPlan, exercises: updatedExercises });
    toast.error('Exercício removido do plano.');
  };

  const handleEditExerciseField = (exId, field, value) => {
    const updatedExercises = (dayPlan.exercises || []).map(ex => {
      if (ex.id === exId) {
        const processed = ['sets'].includes(field) ? Number(value) || 0 : value;
        return { ...ex, [field]: processed };
      }
      return ex;
    });
    updateWorkoutDay(selectedDow, { ...dayPlan, exercises: updatedExercises });
  };

  // ── MEAL PLAN CRUD (DIETA) ──────────────────────────────────────────────────
  const handleAddMeal = () => {
    const newMeal = {
      id: `m_${Date.now()}`,
      time: "12:00",
      label: "Nova Refeição",
      icon: "🍽️",
      items: [
        {
          id: `mi_${Date.now()}`,
          name: "Arroz Branco Cozido",
          foodKey: "arroz",
          kcal: 130,
          prot: 2.5,
          carb: 28,
          fat: 0.3,
          qty: 1
        }
      ]
    };
    const updatedMeals = [...(plans.mealPlan || []), newMeal];
    updateMealPlan(updatedMeals);
    toast.success('Nova refeição adicionada ao plano de dieta! 🍳');
  };

  const handleRemoveMeal = (mealId) => {
    const updatedMeals = (plans.mealPlan || []).filter(m => m.id !== mealId);
    updateMealPlan(updatedMeals);
    toast.error('Refeição excluída do plano.');
  };

  const handleEditMealField = (mealId, field, value) => {
    const updatedMeals = (plans.mealPlan || []).map(m => {
      if (m.id === mealId) {
        return { ...m, [field]: value };
      }
      return m;
    });
    updateMealPlan(updatedMeals);
  };

  const handleAddMealItem = (mealId) => {
    const updatedMeals = (plans.mealPlan || []).map(m => {
      if (m.id === mealId) {
        return {
          ...m,
          items: [
            ...(m.items || []),
            {
              id: `mi_${Date.now()}`,
              name: "Novo Alimento",
              foodKey: "",
              kcal: 100,
              prot: 5,
              carb: 10,
              fat: 2,
              qty: 1
            }
          ]
        };
      }
      return m;
    });
    updateMealPlan(updatedMeals);
    toast.success('Novo alimento adicionado à refeição!');
  };

  const handleRemoveMealItem = (mealId, itemId) => {
    const updatedMeals = (plans.mealPlan || []).map(m => {
      if (m.id === mealId) {
        return {
          ...m,
          items: (m.items || []).filter(item => item.id !== itemId)
        };
      }
      return m;
    });
    updateMealPlan(updatedMeals);
    toast.error('Alimento removido.');
  };

  const handleEditMealItemField = (mealId, itemId, field, value) => {
    const updatedMeals = (plans.mealPlan || []).map(m => {
      if (m.id === mealId) {
        const updatedItems = (m.items || []).map(item => {
          if (item.id === itemId) {
            if (field === 'foodKey') {
              const dbFood = activeFoodDb[value];
              if (dbFood) {
                const currentQty = item.qty !== undefined ? Number(item.qty) || 1 : 1;
                return {
                  ...item,
                  foodKey: value,
                  name: dbFood.name || value,
                  kcal: Math.round((dbFood.kcal || 0) * currentQty),
                  prot: Math.round((dbFood.prot || 0) * currentQty),
                  carb: Math.round((dbFood.carb || 0) * currentQty),
                  fat: Math.round((dbFood.fat || 0) * currentQty)
                };
              }
              return { ...item, foodKey: value };
            }

            if (field === 'qty') {
              const newQty = Number(value) || 0;
              const dbFood = item.foodKey ? activeFoodDb[item.foodKey] : null;
              if (dbFood) {
                return {
                  ...item,
                  qty: newQty,
                  kcal: Math.round((dbFood.kcal || 0) * newQty),
                  prot: Math.round((dbFood.prot || 0) * newQty),
                  carb: Math.round((dbFood.carb || 0) * newQty),
                  fat: Math.round((dbFood.fat || 0) * newQty)
                };
              }
              return { ...item, qty: newQty };
            }

            const isNumeric = ['kcal', 'prot', 'carb', 'fat'].includes(field);
            const processedValue = isNumeric ? Number(value) || 0 : value;
            return { ...item, [field]: processedValue };
          }
          return item;
        });
        return { ...m, items: updatedItems };
      }
      return m;
    });
    updateMealPlan(updatedMeals);
  };

  // ── ESTADOS DOS ADMIN FORMULÁRIOS ──────────────────────────────────────────
  // HÁBITOS FORM
  const [habitName, setHabitName] = useState('');
  const [habitType, setHabitType] = useState('build');
  const [habitIcon, setHabitIcon] = useState('🔥');
  const [habitGoalDays, setHabitGoalDays] = useState(30);
  const [habitProjectId, setHabitProjectId] = useState('');

  const handleAddHabitSubmit = () => {
    if (!habitName.trim()) return toast.error('Nome do hábito obrigatório');
    addHabit({
      name: habitName.trim(),
      routine: habitName.trim(),
      type: habitType,
      icon: habitIcon,
      projectId: habitProjectId || null,
      goalDays: habitType === 'build' ? Number(habitGoalDays) : 999,
    });
    setHabitName('');
    toast.success('Hábito criado com sucesso!');
  };

  // MEDS FORM
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('');
  const [medIcon, setMedIcon] = useState('💊');

  const handleAddMedSubmit = () => {
    if (!medName.trim()) return toast.error('Nome do remédio/suplemento obrigatório');
    addMed({
      name: medName.trim(),
      time: medTime.trim() || '08:00',
      icon: medIcon
    });
    setMedName('');
    setMedTime('');
    toast.success('Suplemento/Remédio adicionado à rotina!');
  };

  // WATER PLAN FORM
  const currentWaterGoal = plans.water?.dailyGoalMl || plans.goals?.waterDailyMl || 2500;
  const [waterGoal, setWaterGoal] = useState(currentWaterGoal);
  const [waterButtons, setWaterButtons] = useState(plans.water?.buttons || [{ ml: 250, label: '💧 250ml' }, { ml: 500, label: '💧 500ml' }]);
  const [newWaterLabel, setNewWaterLabel] = useState('');
  const [newWaterMl, setNewWaterMl] = useState('');

  const handleSaveWaterPlan = () => {
    updateWaterPlan({ dailyGoalMl: Number(waterGoal), buttons: waterButtons });
    toast.success('Plano de hidratação salvo!');
  };

  const handleAddWaterButton = () => {
    if (!newWaterMl || Number(newWaterMl) < 50) return toast.error('Informe um valor em ml válido');
    const lbl = newWaterLabel.trim() || `💧 ${newWaterMl}ml`;
    setWaterButtons(b => [...b, { ml: Number(newWaterMl), label: lbl }]);
    setNewWaterLabel('');
    setNewWaterMl('');
  };

  const handleRemoveWaterButton = (idx) => {
    setWaterButtons(b => b.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* HEADER DE ADMINISTRAÇÃO & BOTÃO DE IMPORTAR JSON */}
      <div className="bg-[#0C0C10]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            ⚙️ Painel de Administração & Setup
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Configure seus planos de treino, dietas, rotinas e importe estruturas via JSON.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-900/30 border border-purple-500/40 flex items-center gap-2 cursor-pointer"
          >
            <Upload size={14} /> Importar JSON 📥
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SUBABAS ADMINISTRATIVAS DA SAÚDE */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none p-1.5 bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-2xl">
        <button
          onClick={() => setAdminTab('workout')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            adminTab === 'workout'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Dumbbell size={14} /> Meus Treinos
        </button>

        <button
          onClick={() => setAdminTab('meals')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            adminTab === 'meals'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Utensils size={14} /> Minha Dieta
        </button>

        <button
          onClick={() => setAdminTab('habits')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            adminTab === 'habits'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame size={14} /> Meus Hábitos
        </button>

        <button
          onClick={() => setAdminTab('meds')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            adminTab === 'meds'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Pill size={14} /> Remédios
        </button>

        <button
          onClick={() => setAdminTab('water')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            adminTab === 'water'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Droplets size={14} /> Hidratação
        </button>

        <button
          onClick={() => setAdminTab('json')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
            adminTab === 'json'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Upload size={14} /> JSON Data
        </button>
      </div>

      {/* ── CONTEÚDO DA SUBABA SELECIONADA ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        
        {/* SUBABA 1: MEUS TREINOS */}
        {adminTab === 'workout' && (
          <motion.div
            key="admin-workout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* SELETOR DE MODO SLIDER */}
            <div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex relative z-10">
              <button
                onClick={() => setActiveMode('classic')}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 relative ${
                  activeMode === 'classic' ? 'text-black z-10' : 'text-gray-400 hover:text-white'
                }`}
              >
                {activeMode === 'classic' && (
                  <motion.div
                    layoutId="activeModeIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-xl"
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  />
                )}
                <span className="relative z-20 flex items-center gap-2">
                  <Dumbbell size={15} /> Editor de Treino Clássico
                </span>
              </button>

              <button
                onClick={() => setActiveMode('circuit')}
                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 relative ${
                  activeMode === 'circuit' ? 'text-black z-10' : 'text-gray-400 hover:text-white'
                }`}
              >
                {activeMode === 'circuit' && (
                  <motion.div
                    layoutId="activeModeIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 rounded-xl"
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                  />
                )}
                <span className="relative z-20 flex items-center gap-2">
                  <Timer size={15} /> Editor de Circuitos (WOD)
                </span>
              </button>
            </div>

            {activeMode === 'classic' ? (
              /* TREINO CLÁSSICO - EDITOR */
              <div className="space-y-6">
                {/* SELECTOR DE DIAS DO TREINO */}
                <div className="flex gap-1 bg-black/30 p-1.5 rounded-2xl overflow-x-auto border border-white/5 scrollbar-none">
                  {DAYS.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDow(i)}
                      className="flex-1 min-w-[42px] py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative overflow-hidden cursor-pointer"
                      style={{
                        background: selectedDow === i ? themeColor : 'transparent',
                        color: selectedDow === i ? '#fff' : 'var(--text-dim)',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {/* HERO STATS PANEL */}
                <div className="bg-[#0C0C10]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                          <Flame size={18} />
                        </span>
                        <input
                          type="text"
                          value={dayPlan.label || ''}
                          onChange={e => updateWorkoutDay(selectedDow, { ...dayPlan, label: e.target.value })}
                          placeholder="Nome do Treino (ex: Peito + Tríceps)"
                          className="text-lg font-black text-white uppercase tracking-wider bg-transparent border-b border-white/10 focus:border-purple-500 outline-none w-full max-w-sm px-2 py-1"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Configure os exercícios, cargas e séries para {DAYS[selectedDow]}.
                      </p>
                    </div>

                    <button
                      onClick={handleAddExercise}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-purple-900/30 border border-purple-500/40 cursor-pointer"
                    >
                      <Plus size={14} strokeWidth={3} />
                      Adicionar Exercício
                    </button>
                  </div>
                </div>

                {/* LISTA DE EXERCÍCIOS PARA EDIÇÃO LIMPA */}
                {(dayPlan.exercises || []).length === 0 ? (
                  <div className="text-center py-16 bg-[#0C0C10]/60 border border-dashed border-white/10 rounded-3xl">
                    <div className="text-4xl mb-3">🏋️‍♂️</div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Nenhum Exercício Planejado</h4>
                    <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                      Adicione novos exercícios para criar um plano de força de alta performance.
                    </p>
                    <button
                      onClick={handleAddExercise}
                      className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                    >
                      + Adicionar Primeiro Exercício
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(dayPlan.exercises || []).map((ex) => (
                      <div
                        key={ex.id}
                        className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between relative group"
                      >
                        <button
                          onClick={() => handleRemoveExercise(ex.id)}
                          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                          title="Excluir Exercício"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div>
                          <div className="border-b border-white/5 pb-3 mb-4 pr-8">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                              Nome do Exercício
                            </label>
                            <input
                              type="text"
                              value={ex.name}
                              onChange={e => handleEditExerciseField(ex.id, 'name', e.target.value)}
                              placeholder="Nome do Exercício"
                              className="text-sm font-black text-white uppercase tracking-wide bg-black/40 border border-white/10 focus:border-purple-500 rounded-xl px-3 py-1.5 outline-none w-full font-sans"
                            />
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Foco/Grupo:</span>
                              <input
                                type="text"
                                value={ex.note || ''}
                                onChange={e => handleEditExerciseField(ex.id, 'note', e.target.value)}
                                placeholder="Peito, Pernas, Bíceps..."
                                className="text-[10px] text-sky-400 font-bold uppercase tracking-wider bg-black/30 border border-white/10 focus:border-sky-500 rounded-lg px-2 py-1 outline-none w-40"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5 mb-2">
                            <div className="bg-black/30 border border-white/5 rounded-2xl p-2 text-center">
                              <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block mb-1">Carga Base</span>
                              <input
                                type="text"
                                value={ex.carga || ''}
                                onChange={e => handleEditExerciseField(ex.id, 'carga', e.target.value)}
                                placeholder="80kg"
                                className="bg-black/40 border border-white/5 focus:border-purple-500 rounded-lg px-2 py-1 w-full text-center text-xs text-white font-mono outline-none font-black"
                              />
                            </div>

                            <div className="bg-black/30 border border-white/5 rounded-2xl p-2 text-center">
                              <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block mb-1">Séries</span>
                              <input
                                type="number"
                                value={ex.sets || 0}
                                onChange={e => handleEditExerciseField(ex.id, 'sets', e.target.value)}
                                placeholder="3"
                                className="bg-black/40 border border-white/5 focus:border-purple-500 rounded-lg px-2 py-1 w-full text-center text-xs text-white font-mono outline-none font-black"
                              />
                            </div>

                            <div className="bg-black/30 border border-white/5 rounded-2xl p-2 text-center">
                              <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider block mb-1">Reps</span>
                              <input
                                type="text"
                                value={ex.reps || ''}
                                onChange={e => handleEditExerciseField(ex.id, 'reps', e.target.value)}
                                placeholder="10"
                                className="bg-black/40 border border-white/5 focus:border-purple-500 rounded-lg px-2 py-1 w-full text-center text-xs text-white font-mono outline-none font-black"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* EDITOR DE CIRCUITOS / WOD */
              <div className="space-y-6">
                <div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Layers size={16} className="text-amber-500" /> Gerenciar Circuitos (WODs)
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Edite os movimentos, número de repetições e crie novos circuitos.
                      </p>
                    </div>
                  </div>

                  {/* Lista de Circuitos Existentes */}
                  <div className="space-y-4">
                    {circuitsList.map((c, cIdx) => (
                      <div key={c.id || cIdx} className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div
                            className="cursor-pointer flex items-center gap-3"
                            onClick={() => setSelectedCircuitIndex(cIdx)}
                          >
                            <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                              {c.icon || '⏱️'}
                            </span>
                            <div>
                              <h5 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                                {c.name}
                              </h5>
                              <p className="text-[10px] text-gray-500 font-mono">
                                {c.movements?.length || 0} exercícios • {c.rounds || 3} rounds
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditCircuit(c)}
                              className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider hover:bg-blue-500/20 transition-all cursor-pointer"
                            >
                              <Pencil size={12} className="inline mr-1" />
                              {editingCircuitId === c.id ? 'Fechar' : 'Editar Movimentos'}
                            </button>
                            {circuitsList.length > 1 && (
                              <button
                                onClick={() => removeCircuit(c.id)}
                                className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Editor de Movimentos Inline para o Circuito */}
                        {editingCircuitId === c.id && (
                          <div className="pt-3 border-t border-white/5 space-y-3 bg-black/40 p-3 rounded-xl">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                              Movimentos do Circuito:
                            </span>

                            {circuitMovesDraft.map((m, mIdx) => (
                              <div key={mIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={e => updateCircuitMoveField(mIdx, 'name', e.target.value)}
                                  placeholder="Nome do movimento"
                                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                                />
                                <input
                                  type="text"
                                  value={m.reps || m.timeSec || ''}
                                  onChange={e => updateCircuitMoveField(mIdx, 'reps', e.target.value)}
                                  placeholder="Reps / s"
                                  className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                                />
                                <button
                                  onClick={() => removeCircuitMove(mIdx)}
                                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={addCircuitMove}
                                className="flex-1 py-2 rounded-xl text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 uppercase tracking-wider cursor-pointer"
                              >
                                + Movimento
                              </button>
                              <button
                                onClick={() => saveCircuitMoves(c.id)}
                                className="flex-1 py-2 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-500 uppercase tracking-wider cursor-pointer"
                              >
                                Salvar Movimentos
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Criar Novo Circuito */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Nome do Novo Circuito (ex: WOD Funcional Cardio)"
                      value={newCircuitName}
                      onChange={e => setNewCircuitName(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleCreateCircuit}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Criar Circuito
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SUBABA: JSON DATA IMPORT/EXPORT */}
        {adminTab === 'json' && (
          <motion.div
            key="admin-json"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
          >
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">Editor Avançado JSON</h3>
              <p className="text-xs text-gray-400">
                Cole o seu JSON com a estrutura esperada e clique em injetar.
                Abaixo está a estrutura exigida pelo Módulo de Saúde.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">Estrutura Esperada</span>
                <pre className="bg-black/50 border border-white/5 p-4 rounded-xl text-[10px] text-green-400 overflow-x-auto max-h-[400px] font-mono shadow-inner custom-scrollbar">
                  <code>{`{
  "workout": {
    "1": {
      "label": "Treino de Seg",
      "exercises": [
        { "id": "ex_1", "name": "Supino", "sets": 3, "reps": "10", "carga": "40kg" }
      ]
    }
  },
  "mealPlan": [
    {
      "id": "m_1", "time": "12:00", "label": "Almoço", "icon": "🍽️",
      "items": [
        { "id": "mi_1", "name": "Arroz", "foodKey": "arroz", "kcal": 130, "prot": 2.5, "carb": 28, "fat": 0.3, "qty": 1 }
      ]
    }
  ],
  "habits": [
    { "id": "h_1", "name": "Ler 10 pág", "type": "build", "icon": "📚" }
  ],
  "meds": [
    { "id": "med_1", "name": "Vitamina C", "time": "08:00", "icon": "💊" }
  ],
  "water": {
    "dailyGoalMl": 2500,
    "buttons": [{ "ml": 250, "label": "💧 250ml" }]
  }
}`}</code>
                </pre>
              </div>

              <div className="space-y-3 flex flex-col">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">Injetar Novo JSON</span>
                <textarea 
                  id="json-import-textarea"
                  className="flex-1 min-h-[300px] w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-white placeholder-gray-600 outline-none focus:border-purple-500 custom-scrollbar resize-none"
                  placeholder='Cole seu objeto JSON aqui...'
                />
                <button
                  onClick={() => {
                    const txt = document.getElementById('json-import-textarea')?.value;
                    if (!txt) return toast.error('Cole o JSON primeiro');
                    const ok = importHealthJSON(txt);
                    if (ok) {
                      toast.success('JSON Injetado com sucesso! 🚀');
                      document.getElementById('json-import-textarea').value = '';
                    } else {
                      toast.error('O JSON contém erros de formato.');
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/30 border border-purple-500/40 active:scale-95"
                >
                  Injetar no Estado
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBABA 2: MINHA DIETA (MEAL PLAN CRUD & CONFIGURAÇÃO) */}
        {adminTab === 'meals' && (
          <motion.div
            key="admin-meals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Utensils size={16} className="text-emerald-400" />
                    Gerenciador de Plano Alimentar & Dietas
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Crie refeições, adicione alimentos, defina quantidades e macros ideais.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowAddFoodDbModal(!showAddFoodDbModal)}
                    className="px-3.5 py-2 bg-black/40 hover:bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Plus size={14} /> + Novo Alimento no Banco
                  </button>
                  <button
                    onClick={handleAddMeal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/40"
                  >
                    <Plus size={14} /> + Refeição
                  </button>
                </div>
              </div>

              {/* CARD FORM DE CADASTRAR NOVO ALIMENTO NO BANCO (foodDb) */}
              <AnimatePresence>
                {showAddFoodDbModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-950/20 space-y-4 my-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                          <Plus size={14} /> Cadastrar Novo Alimento no Banco Relacional (foodDb)
                        </h4>
                        <button
                          onClick={() => setShowAddFoodDbModal(false)}
                          className="text-gray-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕ Fechar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-1">
                          <label className="text-[9px] font-black text-emerald-400 uppercase block mb-1">
                            Nome do Alimento
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Frango Grelhado"
                            value={newFoodDbName}
                            onChange={e => setNewFoodDbName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">
                            Kcal (por porção)
                          </label>
                          <input
                            type="number"
                            placeholder="165"
                            value={newFoodDbKcal}
                            onChange={e => setNewFoodDbKcal(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono outline-none focus:border-emerald-500 text-center font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-emerald-400 uppercase block mb-1">
                            Proteína (g)
                          </label>
                          <input
                            type="number"
                            placeholder="31"
                            value={newFoodDbProt}
                            onChange={e => setNewFoodDbProt(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-emerald-400 font-mono outline-none focus:border-emerald-500 text-center font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-sky-400 uppercase block mb-1">
                            Carboidrato (g)
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={newFoodDbCarb}
                            onChange={e => setNewFoodDbCarb(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-sky-400 font-mono outline-none focus:border-emerald-500 text-center font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-amber-500 uppercase block mb-1">
                            Gordura (g)
                          </label>
                          <input
                            type="number"
                            placeholder="3.6"
                            value={newFoodDbFat}
                            onChange={e => setNewFoodDbFat(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-amber-500 font-mono outline-none focus:border-emerald-500 text-center font-bold"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleRegisterFoodDb}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg"
                      >
                        Salvar Alimento no Banco
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lista de Refeições no Plano */}
              <div className="space-y-4">
                {(plans.mealPlan || []).length === 0 ? (
                  <div className="text-center py-12 bg-black/30 border-2 border-dashed border-emerald-500/30 rounded-3xl space-y-4 my-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Nenhuma Refeição Configurada
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                        Monte o seu plano nutricional do zero adicionando refeições e alimentos.
                      </p>
                    </div>
                    <button
                      onClick={handleAddMeal}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg border border-emerald-500/40 cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus size={16} strokeWidth={3} />
                      + Criar Primeira Refeição
                    </button>
                  </div>
                ) : (
                  (plans.mealPlan || []).map(meal => (
                  <div
                    key={meal.id}
                    className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-4 relative group"
                  >
                    <button
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      title="Excluir Refeição do Plano"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
                      <div className="flex items-center gap-2.5 flex-1">
                        <input
                          type="text"
                          value={meal.icon || '🍽️'}
                          onChange={e => handleEditMealField(meal.id, 'icon', e.target.value)}
                          className="w-9 h-9 bg-black/40 border border-white/10 text-center text-lg rounded-xl outline-none"
                        />
                        <input
                          type="text"
                          value={meal.label || ''}
                          onChange={e => handleEditMealField(meal.id, 'label', e.target.value)}
                          placeholder="Nome da Refeição"
                          className="text-sm font-black text-white uppercase tracking-wide bg-black/40 border border-white/10 focus:border-emerald-500 rounded-xl px-3 py-1.5 outline-none font-sans flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Hora:</span>
                        <input
                          type="text"
                          value={meal.time || ''}
                          onChange={e => handleEditMealField(meal.id, 'time', e.target.value)}
                          placeholder="08:00"
                          className="text-xs font-mono font-black text-emerald-400 bg-black/40 border border-white/10 rounded-xl px-2 py-1 w-20 text-center outline-none"
                        />
                      </div>
                    </div>

                    {/* Alimentos Dentro da Refeição */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        Alimentos Componentes:
                      </span>

                      {(meal.items || []).map((item, itemIdx) => {
                        const dbFood = item.foodKey ? activeFoodDb[item.foodKey] : null;
                        const qty = item.qty !== undefined ? Number(item.qty) || 1 : 1;

                        const foodKcal = item.kcal !== undefined ? item.kcal : Math.round((dbFood?.kcal || 0) * qty);
                        const foodProt = item.prot !== undefined ? item.prot : Math.round((dbFood?.prot || 0) * qty);
                        const foodCarb = item.carb !== undefined ? item.carb : Math.round((dbFood?.carb || 0) * qty);
                        const foodFat = item.fat !== undefined ? item.fat : Math.round((dbFood?.fat || 0) * qty);

                        return (
                          <div key={item.id || itemIdx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs">
                            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              {/* DROPDOWN DE SELEÇÃO DO FOOD_DB */}
                              <select
                                value={item.foodKey || ''}
                                onChange={e => handleEditMealItemField(meal.id, item.id, 'foodKey', e.target.value)}
                                className="bg-black/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold rounded-lg px-2 py-1.5 outline-none focus:border-emerald-400 cursor-pointer"
                              >
                                <option value="">-- Puxar da Tabela (foodDb) --</option>
                                {Object.entries(activeFoodDb).map(([fKey, fData]) => (
                                  <option key={fKey} value={fKey}>
                                    {fData.name || fKey} (~{fData.kcal} kcal)
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={e => handleEditMealItemField(meal.id, item.id, 'name', e.target.value)}
                                placeholder="Nome do alimento"
                                className="bg-transparent text-white font-bold outline-none border-b border-transparent focus:border-emerald-500 flex-1 px-1 py-0.5"
                              />
                            </div>

                            <div className="flex items-center flex-wrap gap-2 text-[10px]">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">Qtd:</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={item.qty !== undefined ? item.qty : 1}
                                  onChange={e => handleEditMealItemField(meal.id, item.id, 'qty', e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono font-bold w-12 text-center outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Kcal:</span>
                                <input
                                  type="number"
                                  value={foodKcal}
                                  onChange={e => handleEditMealItemField(meal.id, item.id, 'kcal', e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono font-bold w-12 text-center outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-400">P:</span>
                                <input
                                  type="number"
                                  value={foodProt}
                                  onChange={e => handleEditMealItemField(meal.id, item.id, 'prot', e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-emerald-400 font-mono font-bold w-10 text-center outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sky-400">C:</span>
                                <input
                                  type="number"
                                  value={foodCarb}
                                  onChange={e => handleEditMealItemField(meal.id, item.id, 'carb', e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-sky-400 font-mono font-bold w-10 text-center outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-amber-500">G:</span>
                                <input
                                  type="number"
                                  value={foodFat}
                                  onChange={e => handleEditMealItemField(meal.id, item.id, 'fat', e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-amber-500 font-mono font-bold w-10 text-center outline-none"
                                />
                              </div>

                              <button
                                onClick={() => handleRemoveMealItem(meal.id, item.id)}
                                className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer ml-1"
                                title="Remover item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        onClick={() => handleAddMealItem(meal.id)}
                        className="w-full py-2.5 mt-2 rounded-xl border border-dashed border-white/10 hover:border-white/20 bg-white/5 text-gray-300 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        + Adicionar Alimento
                      </button>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBABA 3: HÁBITOS & VÍCIOS */}
        {adminTab === 'habits' && (
          <motion.div
            key="admin-habits"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Flame size={16} className="text-purple-400" />
                  Gerenciador de Hábitos Atômicos & Vícios
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Configure hábitos diários (virtudes) ou abstenções de vícios para fortalecer seu autocontrole.
                </p>
              </div>

              {/* Lista de Hábitos Existentes */}
              <div className="space-y-3">
                {(plans.habits || []).map(h => (
                  <div
                    key={h.id}
                    className="flex justify-between items-center p-4 rounded-2xl border bg-black/30 border-white/5"
                  >
                    <div>
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>{h.icon || '🔥'}</span> {h.name || h.routine}
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                        {h.type === 'quit' ? '⛔ Mural da Sobriedade (Destruir Vício)' : `🏁 Desafio de ${h.goalDays || 30} dias`}
                      </div>
                      {h.projectId && <div className="mt-1"><ProjectTag projectId={h.projectId} /></div>}
                    </div>

                    <button
                      onClick={() => removeHabit(h.id)}
                      className="text-rose-400 hover:text-rose-300 p-2 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form de Criação */}
              <div className="p-4 rounded-2xl border border-dashed border-purple-500/30 bg-purple-950/10 space-y-3">
                <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider">
                  + Criar Novo Hábito / Vício
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={habitIcon}
                    onChange={e => setHabitIcon(e.target.value)}
                    placeholder="Emoji"
                    className="w-14 px-2 py-2.5 rounded-xl bg-black/40 border border-white/10 text-center text-lg outline-none"
                  />
                  <input
                    type="text"
                    value={habitName}
                    onChange={e => setHabitName(e.target.value)}
                    placeholder="Ex: Ler 10 páginas / Sem Fumar"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={habitType}
                    onChange={e => setHabitType(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white outline-none"
                  >
                    <option value="build">✨ Virtude (Construir)</option>
                    <option value="quit">⛔ Vício (Destruir)</option>
                  </select>

                  {habitType === 'build' && (
                    <input
                      type="number"
                      value={habitGoalDays}
                      onChange={e => setHabitGoalDays(e.target.value)}
                      placeholder="Dias"
                      className="w-24 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white outline-none text-center"
                    />
                  )}
                </div>

                <select
                  value={habitProjectId}
                  onChange={e => setHabitProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white outline-none"
                >
                  <option value="">Vincular a um Projeto? (Opcional)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.icone} {p.nome}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAddHabitSubmit}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-black uppercase tracking-wider text-white shadow-lg cursor-pointer hover:opacity-90 transition-all"
                >
                  Adicionar à Rotina
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBABA 4: REMÉDIOS E SUPLEMENTOS */}
        {adminTab === 'meds' && (
          <motion.div
            key="admin-meds"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Pill size={16} className="text-sky-400" />
                  Gerenciador de Remédios & Suplementos
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Mantenha a suplementação em dia definindo horários específicos para cada item.
                </p>
              </div>

              {/* Grid de Remédios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(plans.meds || []).map(m => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border bg-black/30 border-white/5 flex flex-col items-center relative text-center"
                  >
                    <span className="text-3xl mb-2">{m.icon || '💊'}</span>
                    <span className="text-xs font-black text-white leading-tight">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-bold text-sky-400 mt-1 uppercase tracking-wider font-mono">
                      ⏰ {m.time}
                    </span>
                    <button
                      onClick={() => removeMed(m.id)}
                      className="absolute top-2 right-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 p-1.5 rounded-lg text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Form para adicionar novo remédio */}
              <div className="p-4 rounded-2xl border border-dashed border-sky-500/30 bg-sky-950/10 space-y-3">
                <h4 className="text-xs font-black text-sky-300 uppercase tracking-wider">
                  + Adicionar Suplemento / Medicamento
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medIcon}
                    onChange={e => setMedIcon(e.target.value)}
                    placeholder="Emoji"
                    className="w-14 px-2 py-2.5 rounded-xl bg-black/40 border border-white/10 text-center text-lg outline-none"
                  />
                  <input
                    type="text"
                    value={medName}
                    onChange={e => setMedName(e.target.value)}
                    placeholder="Ex: Ômega 3 / Creatina"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white outline-none focus:border-sky-500"
                  />
                </div>
                <input
                  type="text"
                  value={medTime}
                  onChange={e => setMedTime(e.target.value)}
                  placeholder="Horário (ex: 08:00 ou Após o Almoço)"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white outline-none"
                />
                <button
                  onClick={handleAddMedSubmit}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-xs font-black uppercase tracking-wider text-white shadow-lg cursor-pointer hover:opacity-90 transition-all"
                >
                  Adicionar ao Plano
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBABA 5: HIDRATAÇÃO */}
        {adminTab === 'water' && (
          <motion.div
            key="admin-water"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Droplets size={16} className="text-sky-400" />
                  Plano de Hidratação & Metas
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Defina a meta diária e configure botões de registro rápido.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                    Meta Diária de Água (ml)
                  </label>
                  <input
                    type="number"
                    value={waterGoal}
                    onChange={e => setWaterGoal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono font-black text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                    Botões de Registro Rápido
                  </label>
                  <div className="space-y-2 mb-3">
                    {waterButtons.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <span className="flex-1 text-xs font-bold text-white px-2">{b.label}</span>
                        <span className="text-xs font-mono font-bold text-sky-400">{b.ml}ml</span>
                        <button
                          onClick={() => handleRemoveWaterButton(i)}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 p-3 rounded-xl border border-dashed border-sky-500/30 bg-sky-950/10">
                    <input
                      type="text"
                      placeholder="Label (ex: 💧 Garrafa)"
                      value={newWaterLabel}
                      onChange={e => setNewWaterLabel(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none"
                    />
                    <input
                      type="number"
                      placeholder="ml"
                      value={newWaterMl}
                      onChange={e => setNewWaterMl(e.target.value)}
                      className="w-20 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-center text-white outline-none font-mono"
                    />
                    <button
                      onClick={handleAddWaterButton}
                      className="px-4 py-2 rounded-xl bg-sky-500 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      + ADD
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveWaterPlan}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-xs font-black uppercase tracking-wider text-white shadow-lg cursor-pointer hover:opacity-90 transition-all"
                >
                  Salvar Plano de Hidratação
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default PlansTab;
