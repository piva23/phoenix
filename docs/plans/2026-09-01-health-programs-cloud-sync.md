# Health Programs + Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix broken JSON import, create a "Standard Health Program" system with loadable defaults, and implement automatic cloud sync with configurable interval for cross-device data synchronization.

**Architecture:** 
- Health Programs: A `programs` array in useHealthStore where each program contains a snapshot of all plan data (workouts, meals, habits, meds, water, foodDb). Users can load a program to apply its plans, create new programs from current state, or use the built-in "Standard Health Program" template.
- Cloud Sync: A `useSyncStore` Zustand store that manages automatic periodic sync to Firebase Firestore. Uses `onSnapshot` for real-time listening + periodic full-state writes. Configurable interval (1min, 5min, 15min, 30min, 1hr, manual only).

**Tech Stack:** Zustand + persist, Firebase Firestore, react-hot-toast, lucide-react icons

---

## File Structure

| File | Purpose |
|------|---------|
| `src/stores/useHealthStore.js` | **Modify** — Add missing methods (`importHealthJSON`, `addFoodDbItem`), add programs system |
| `src/shared/constants/healthPrograms.js` | **Create** — Default "Standard Health Program" template data |
| `src/stores/useSyncStore.js` | **Create** — Cloud sync store with auto-sync interval |
| `src/modules/health/components/PlansTab.jsx` | **Modify** — Add Programs section with load/create UI |
| `src/modules/settings/SettingsPage.jsx` | **Modify** — Add sync interval selector in Cloud Sync card |

---

## Task 1: Fix Missing Store Methods

The `importHealthJSON` and `addFoodDbItem` methods are called in PlansTab.jsx but never defined in useHealthStore.js. This is why JSON import is broken.

### Files:
- Modify: `src/stores/useHealthStore.js`

- [ ] **Step 1: Add `importHealthJSON` method**

Add this method inside the Zustand `set` callback, after the existing methods:

```javascript
importHealthJSON: (jsonContent) => {
  try {
    const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    if (!data || typeof data !== 'object') return false;
    
    set((state) => ({
      plans: {
        ...state.plans,
        workout: data.workout || data.workoutPlan || state.plans.workout,
        mealPlan: data.mealPlan || state.plans.mealPlan,
        habits: data.habits || state.plans.habits,
        meds: data.meds || state.plans.meds,
        water: data.water || state.plans.water,
        circuits: data.circuits || state.plans.circuits,
        foodDb: { ...state.plans.foodDb, ...(data.foodDb || {}) },
        goals: data.goals || state.plans.goals,
      }
    }));
    return true;
  } catch (e) {
    console.error('importHealthJSON error:', e);
    return false;
  }
},
```

- [ ] **Step 2: Add `addFoodDbItem` method**

Add this method right after `importHealthJSON`:

```javascript
addFoodDbItem: (foodKey, foodObj) => {
  set((state) => ({
    plans: {
      ...state.plans,
      foodDb: {
        ...state.plans.foodDb,
        [foodKey]: foodObj,
      }
    }
  }));
},
```

- [ ] **Step 3: Build and verify no errors**

Run: `npx react-scripts build`
Expected: Compiled successfully

---

## Task 2: Create Default Health Program Template

### Files:
- Create: `src/shared/constants/healthPrograms.js`

- [ ] **Step 1: Create the template file**

Create `src/shared/constants/healthPrograms.js` with the full Standard Health Program data based on `healthDb.json`:

```javascript
export const STANDARD_HEALTH_PROGRAM = {
  id: 'std_health_v1',
  name: 'Standard Health Program',
  description: 'Programa padrão de saúde com treinos, dieta, hábitos e suplementação pré-configurados.',
  icon: '🏥',
  isDefault: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  plans: {
    goals: {
      waterDailyMl: 3500,
      caloriesDaily: 2500,
      workoutsPerWeek: 5,
    },
    water: {
      dailyGoalMl: 3500,
      buttons: [
        { ml: 150, label: '☕ 150ml' },
        { ml: 250, label: '💧 250ml' },
        { ml: 350, label: '🧴 350ml' },
        { ml: 500, label: '🍶 500ml' },
        { ml: 750, label: '🫗 750ml' },
      ],
    },
    foodDb: {
      ovo: { kcal: 70, prot: 6, carb: 0.5, fat: 5, unit: 'un', portion: 1, icon: '🥚' },
      banana: { kcal: 105, prot: 1.3, carb: 27, fat: 0.4, unit: 'un', portion: 1, icon: '🍌' },
      pao_integral: { kcal: 80, prot: 4, carb: 14, fat: 1, unit: 'fatia', portion: 1, icon: '🍞' },
      carne: { kcal: 250, prot: 26, carb: 0, fat: 15, unit: 'g', portion: 100, icon: '🥩' },
      iogurte: { kcal: 100, prot: 17, carb: 6, fat: 0.7, unit: 'g', portion: 170, icon: '🥛' },
      queijo: { kcal: 110, prot: 7, carb: 1, fat: 9, unit: 'fatia', portion: 1, icon: '🧀' },
      hipercalorico: { kcal: 450, prot: 30, carb: 55, fat: 12, unit: 'scoop', portion: 1, icon: '🥤' },
      arroz: { kcal: 130, prot: 2.5, carb: 28, fat: 0.3, unit: 'g', portion: 100, icon: '🍚' },
      feijao: { kcal: 76, prot: 4.5, carb: 14, fat: 0.5, unit: 'g', portion: 100, icon: '🫘' },
      salada: { kcal: 15, prot: 1.5, carb: 2, fat: 0.2, unit: 'g', portion: 100, icon: '🥗' },
      cappuccino: { kcal: 80, prot: 4, carb: 10, fat: 2.5, unit: 'copo', portion: 1, icon: '☕' },
      fruta: { kcal: 60, prot: 1, carb: 15, fat: 0.3, unit: 'un', portion: 1, icon: '🍎' },
      rucula: { kcal: 5, prot: 0.5, carb: 0.5, fat: 0.1, unit: 'g', portion: 50, icon: '🥬' },
      tomate: { kcal: 18, prot: 0.9, carb: 3.9, fat: 0.2, unit: 'un', portion: 1, icon: '🍅' },
      bombom: { kcal: 70, prot: 0.5, carb: 8, fat: 4, unit: 'un', portion: 1, icon: '🍬' },
    },
    workout: {
      '0': null,
      '1': {
        label: 'Peito + Tríceps',
        exercises: [
          { id: 'ex_1', name: 'Supino Reto', sets: 4, reps: '10', note: 'Peito', carga: '60kg' },
          { id: 'ex_2', name: 'Supino Inclinado', sets: 3, reps: '10', note: 'Peito', carga: '50kg' },
          { id: 'ex_3', name: 'Crucifixo', sets: 3, reps: '12', note: 'Peito', carga: '16kg' },
          { id: 'ex_4', name: 'Tríceps Pulley', sets: 3, reps: '12', note: 'Tríceps', carga: '25kg' },
          { id: 'ex_5', name: 'Tríceps Testa', sets: 3, reps: '10', note: 'Tríceps', carga: '20kg' },
        ],
      },
      '2': {
        label: 'Costas + Bíceps',
        exercises: [
          { id: 'ex_6', name: 'Puxada Frontal', sets: 4, reps: '10', note: 'Costas', carga: '55kg' },
          { id: 'ex_7', name: 'Remada Curvada', sets: 3, reps: '10', note: 'Costas', carga: '50kg' },
          { id: 'ex_8', name: 'Pulldown', sets: 3, reps: '12', note: 'Costas', carga: '40kg' },
          { id: 'ex_9', name: 'Rosca Direta', sets: 3, reps: '12', note: 'Bíceps', carga: '15kg' },
        ],
      },
      '3': {
        label: 'Ombros + Braços',
        exercises: [
          { id: 'ex_10', name: 'Desenvolvimento', sets: 4, reps: '10', note: 'Ombros', carga: '30kg' },
          { id: 'ex_11', name: 'Elevação Lateral', sets: 3, reps: '12', note: 'Ombros', carga: '10kg' },
          { id: 'ex_12', name: 'Rosca Alternada', sets: 3, reps: '10', note: 'Bíceps', carga: '12kg' },
          { id: 'ex_13', name: 'Mergulho', sets: 3, reps: '12', note: 'Tríceps', carga: 'Peso Corporal' },
        ],
      },
      '4': {
        label: 'Peito + Costas',
        exercises: [
          { id: 'ex_14', name: 'Supino Reto', sets: 3, reps: '10', note: 'Peito', carga: '60kg' },
          { id: 'ex_15', name: 'Puxada Frontal', sets: 3, reps: '10', note: 'Costas', carga: '55kg' },
          { id: 'ex_16', name: 'Crucifixo', sets: 3, reps: '12', note: 'Peito', carga: '16kg' },
          { id: 'ex_17', name: 'Remada Unilateral', sets: 3, reps: '10', note: 'Costas', carga: '20kg' },
        ],
      },
      '5': {
        label: 'Braço Pesado',
        exercises: [
          { id: 'ex_18', name: 'Supino Frontal', sets: 4, reps: '8', note: 'Peito', carga: '70kg' },
          { id: 'ex_19', name: 'Barra Fixa', sets: 4, reps: '8', note: 'Costas', carga: 'Peso Corporal' },
          { id: 'ex_20', name: 'Rosca Martelo', sets: 3, reps: '10', note: 'Bíceps', carga: '14kg' },
          { id: 'ex_21', name: 'Tríceps Francês', sets: 3, reps: '10', note: 'Tríceps', carga: '18kg' },
          { id: 'ex_22', name: 'Elevação Frontal', sets: 3, reps: '12', note: 'Ombros', carga: '12kg' },
        ],
      },
      '6': {
        label: 'Pernas + Core',
        exercises: [
          { id: 'ex_23', name: 'Agachamento', sets: 4, reps: '10', note: 'Pernas', carga: '80kg' },
          { id: 'ex_24', name: 'Leg Press', sets: 3, reps: '12', note: 'Pernas', carga: '120kg' },
          { id: 'ex_25', name: 'Cadeira Extensora', sets: 3, reps: '12', note: 'Pernas', carga: '40kg' },
          { id: 'ex_26', name: 'Mesa Flexora', sets: 3, reps: '12', note: 'Pernas', carga: '35kg' },
          { id: 'ex_27', name: 'Abdominal', sets: 3, reps: '20', note: 'Core', carga: 'Peso Corporal' },
        ],
      },
    },
    mealPlan: [
      {
        id: 'm1', time: '07:00', label: 'Café da Manhã', icon: '🌅',
        items: [
          { id: 'mi1', name: 'Ovo', foodKey: 'ovo', kcal: 210, prot: 18, carb: 1.5, fat: 15, qty: 3 },
          { id: 'mi2', name: 'Pão Integral', foodKey: 'pao_integral', kcal: 160, prot: 8, carb: 28, fat: 2, qty: 2 },
          { id: 'mi3', name: 'Cappuccino', foodKey: 'cappuccino', kcal: 80, prot: 4, carb: 10, fat: 2.5, qty: 1 },
        ],
      },
      {
        id: 'm2', time: '10:00', label: 'Lanche Manhã', icon: '🍏',
        items: [
          { id: 'mi4', name: 'Banana', foodKey: 'banana', kcal: 105, prot: 1.3, carb: 27, fat: 0.4, qty: 1 },
          { id: 'mi5', name: 'Hipercalórico', foodKey: 'hipercalorico', kcal: 450, prot: 30, carb: 55, fat: 12, qty: 1 },
        ],
      },
      {
        id: 'm3', time: '12:30', label: 'Almoço', icon: '🍽️',
        items: [
          { id: 'mi6', name: 'Arroz', foodKey: 'arroz', kcal: 260, prot: 5, carb: 56, fat: 0.6, qty: 2 },
          { id: 'mi7', name: 'Feijão', foodKey: 'feijao', kcal: 152, prot: 9, carb: 28, fat: 1, qty: 2 },
          { id: 'mi8', name: 'Carne', foodKey: 'carne', kcal: 250, prot: 26, carb: 0, fat: 15, qty: 1 },
          { id: 'mi9', name: 'Salada', foodKey: 'salada', kcal: 15, prot: 1.5, carb: 2, fat: 0.2, qty: 1 },
        ],
      },
      {
        id: 'm4', time: '15:30', label: 'Lanche Tarde', icon: '🥤',
        items: [
          { id: 'mi10', name: 'Iogurte', foodKey: 'iogurte', kcal: 100, prot: 17, carb: 6, fat: 0.7, qty: 1 },
          { id: 'mi11', name: 'Fruta', foodKey: 'fruta', kcal: 60, prot: 1, carb: 15, fat: 0.3, qty: 1 },
        ],
      },
      {
        id: 'm5', time: '19:00', label: 'Jantar', icon: '🌙',
        items: [
          { id: 'mi12', name: 'Arroz', foodKey: 'arroz', kcal: 130, prot: 2.5, carb: 28, fat: 0.3, qty: 1 },
          { id: 'mi13', name: 'Carne', foodKey: 'carne', kcal: 250, prot: 26, carb: 0, fat: 15, qty: 1 },
          { id: 'mi14', name: 'Salada', foodKey: 'salada', kcal: 15, prot: 1.5, carb: 2, fat: 0.2, qty: 1 },
        ],
      },
    ],
    habits: [
      { id: 'h1', name: 'NoB', type: 'quit', icon: '🚭', trigger: 'Quando sentir vontade de fumar', routine: 'Respirar fundo 10x e beber água', reward: 'Mais 1 dia de liberdade', time: 'Manhã', goalDays: 999, startDate: '2026-06-01' },
      { id: 'h_nolust', name: 'NoLust', type: 'quit', icon: '🛡️', trigger: 'Quando surgir pensamento', routine: 'Meditar 5 min e focar no objetivo', reward: 'Claridade mental', time: 'Manhã', goalDays: 999, startDate: '2026-06-01' },
      { id: 'h_nopm', name: 'NoPM', type: 'quit', icon: '🚫', trigger: 'À noite antes de dormir', routine: 'Rotina noturna: ler, journaling', reward: 'Sono reparador', time: 'Noite', goalDays: 999, startDate: '2026-06-01' },
      { id: 'h2', name: 'Correr 30 Dias', type: 'build', icon: '🏃', trigger: 'Manhã ao acordar', routine: 'Colocar tênis e sair', reward: 'Corpo forte e mente afiada', time: 'Manhã', goalDays: 30, startDate: '2026-06-01' },
    ],
    meds: [
      { id: 'md1', name: 'Vitamina D', time: 'Manhã', icon: '💊' },
      { id: 'md2', name: 'Ômega 3', time: 'Almoço', icon: '🐟' },
    ],
    circuits: [
      {
        id: 'c1', name: 'SOS Casa', icon: '🔥', rounds: 4,
        movements: [
          { name: 'Burpees explosivos', reps: 15 },
          { name: 'Kettlebell Swings', reps: 20 },
          { name: 'Flexões de Braço', reps: 20 },
          { name: 'Abdominais Remador', reps: 25 },
        ],
      },
    ],
  },
};

export const EMPTY_HEALTH_PROGRAM = {
  id: null,
  name: 'Programa em Branco',
  description: 'Comece do zero com todos os campos vazios.',
  icon: '📋',
  isDefault: false,
  createdAt: null,
  plans: {
    goals: { waterDailyMl: 2500, caloriesDaily: 2000, workoutsPerWeek: 3 },
    water: { dailyGoalMl: 2500, buttons: [{ ml: 250, label: '💧 250ml' }] },
    foodDb: {},
    workout: { '0': null, '1': null, '2': null, '3': null, '4': null, '5': null, '6': null },
    mealPlan: [],
    habits: [],
    meds: [],
    circuits: [],
  },
};
```

- [ ] **Step 2: Verify import works**

Add a quick test import in a component or just verify the file parses:
```bash
node -e "require('./src/shared/constants/healthPrograms.js')"
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/constants/healthPrograms.js
git commit -m "feat: add Standard Health Program template + empty program"
```

---

## Task 3: Add Programs System to useHealthStore

### Files:
- Modify: `src/stores/useHealthStore.js`

- [ ] **Step 1: Add programs array to initial state**

In the store's initial state (inside the `create` callback), add:

```javascript
// After existing plans state
programs: [],  // Array of saved health programs
activeProgramId: null,  // Currently loaded program ID
```

- [ ] **Step 2: Add program management methods**

Add these methods to the store:

```javascript
// Save current plans as a new program
saveProgram: (name, description = '') => {
  const { plans } = get();
  const newProgram = {
    id: `prog_${Date.now()}`,
    name,
    description,
    icon: '📋',
    isDefault: false,
    createdAt: new Date().toISOString(),
    plans: JSON.parse(JSON.stringify(plans)),  // Deep clone
  };
  set((state) => ({
    programs: [...state.programs, newProgram],
  }));
  return newProgram.id;
},

// Load a program's plans into the active plans
loadProgram: (programId) => {
  const { programs } = get();
  const program = programs.find(p => p.id === programId);
  if (!program) return false;
  
  set({
    plans: JSON.parse(JSON.stringify(program.plans)),
    activeProgramId: programId,
  });
  return true;
},

// Delete a saved program
deleteProgram: (programId) => {
  set((state) => ({
    programs: state.programs.filter(p => p.id !== programId),
    activeProgramId: state.activeProgramId === programId ? null : state.activeProgramId,
  }));
},

// Update a program's metadata (name, description)
updateProgram: (programId, updates) => {
  set((state) => ({
    programs: state.programs.map(p =>
      p.id === programId ? { ...p, ...updates } : p
    ),
  }));
},

// Load the default Standard Health Program
loadDefaultProgram: () => {
  const { loadProgram } = get();
  // Import the template
  const { STANDARD_HEALTH_PROGRAM } = require('../shared/constants/healthPrograms');
  
  // Check if already saved
  const { programs } = get();
  const existing = programs.find(p => p.id === STANDARD_HEALTH_PROGRAM.id);
  
  if (!existing) {
    // Save it first
    set((state) => ({
      programs: [...state.programs, STANDARD_HEALTH_PROGRAM],
    }));
  }
  
  return loadProgram(STANDARD_HEALTH_PROGRAM.id);
},
```

- [ ] **Step 3: Build and verify**

Run: `npx react-scripts build`
Expected: Compiled successfully

- [ ] **Step 4: Commit**

```bash
git add src/stores/useHealthStore.js
git commit -m "feat: add programs system to health store (CRUD + load default)"
```

---

## Task 4: Add Programs UI in PlansTab

### Files:
- Modify: `src/modules/health/components/PlansTab.jsx`

- [ ] **Step 1: Add programs section at top of PlansTab**

After the header div (line ~451) and before the admin tabs navigation, add a Programs section:

```jsx
{/* PROGRAMS SECTION */}
<div className="bg-[#0C0C10]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
        📦 Programas de Saúde
      </h3>
      <p className="text-xs text-gray-400 mt-1">
        Carregue o programa padrão ou crie seus próprios programas personalizados.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          const name = prompt('Nome do novo programa:');
          if (name) {
            const id = saveProgram(name, `Criado em ${new Date().toLocaleDateString('pt-BR')}`);
            toast.success(`Programa "${name}" salvo com sucesso!`);
          }
        }}
        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-1.5 transition-all"
      >
        <Plus size={14} /> Salvar Atual
      </button>
    </div>
  </div>

  {/* Default Program Card */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => {
        loadDefaultProgram();
        toast.success('Standard Health Program carregado com sucesso! 🏥');
      }}
      className="text-left p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🏥</span>
        <div>
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Standard Health Program</h4>
          <p className="text-[10px] text-gray-400">Programa padrão com tudo pré-configurado</p>
        </div>
      </div>
      <div className="text-[9px] text-emerald-400/60 font-mono mt-2">
        5 treinos • 5 refeições • 4 hábitos • 2 suplementos
      </div>
    </motion.button>

    {/* User Saved Programs */}
    {programs.map((prog) => (
      <motion.div
        key={prog.id}
        whileHover={{ scale: 1.01 }}
        className={`p-4 rounded-2xl border transition-all ${
          activeProgramId === prog.id
            ? 'border-purple-500/50 bg-purple-500/10'
            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{prog.icon || '📋'}</span>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">{prog.name}</h4>
              <p className="text-[10px] text-gray-400">{prog.description || 'Sem descrição'}</p>
            </div>
          </div>
          {activeProgramId === prog.id && (
            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">
              ATIVO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => {
              loadProgram(prog.id);
              toast.success(`Programa "${prog.name}" carregado!`);
            }}
            className="flex-1 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
          >
            Carregar
          </button>
          <button
            onClick={() => {
              if (confirm(`Excluir programa "${prog.name}"?`)) {
                deleteProgram(prog.id);
                toast.error('Programa excluído.');
              }
            }}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </motion.div>
    ))}
  </div>
</div>
```

- [ ] **Step 2: Add required imports and hook calls**

At the top of PlansTab, add to the destructured useHealthStore:

```javascript
const {
  plans = {},
  importHealthJSON,
  addFoodDbItem,
  programs = [],
  activeProgramId,
  saveProgram,
  loadProgram,
  deleteProgram,
  loadDefaultProgram,
  // ... rest of existing methods
} = useHealthStore();
```

Also add the `Plus` import from lucide-react if not already present (it is).

- [ ] **Step 3: Build and verify**

Run: `npx react-scripts build`
Expected: Compiled successfully

- [ ] **Step 4: Commit**

```bash
git add src/modules/health/components/PlansTab.jsx
git commit -m "feat: add Programs UI in PlansTab with load/create/delete"
```

---

## Task 5: Create Cloud Sync Store

### Files:
- Create: `src/stores/useSyncStore.js`

- [ ] **Step 1: Create the sync store**

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth } from '../shared/config/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const SYNC_INTERVALS = {
  manual: 0,
  '1min': 60000,
  '5min': 300000,
  '15min': 900000,
  '30min': 1800000,
  '1hour': 3600000,
};

export const useSyncStore = create(
  persist(
    (set, get) => ({
      // Settings
      syncInterval: '5min',  // 'manual' | '1min' | '5min' | '15min' | '30min' | '1hour'
      lastSyncAt: null,
      syncStatus: 'idle',  // 'idle' | 'syncing' | 'success' | 'error'
      lastSyncError: null,
      autoSyncEnabled: true,
      
      // Listener unsubscribe
      _unsubscribe: null,
      _intervalId: null,

      // Set sync interval
      setSyncInterval: (interval) => {
        set({ syncInterval: interval });
        // Restart auto-sync with new interval
        get().stopAutoSync();
        if (interval !== 'manual') {
          get().startAutoSync();
        }
      },

      // Toggle auto sync
      toggleAutoSync: () => {
        const { autoSyncEnabled } = get();
        set({ autoSyncEnabled: !autoSyncEnabled });
        if (!autoSyncEnabled) {
          get().startAutoSync();
        } else {
          get().stopAutoSync();
        }
      },

      // Collect all phoenix-* localStorage keys
      _collectData: () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('phoenix-')) {
            try {
              data[key] = JSON.parse(localStorage.getItem(key));
            } catch {
              data[key] = localStorage.getItem(key);
            }
          }
        }
        return data;
      },

      // Apply data to localStorage
      _applyData: (data) => {
        if (!data || typeof data !== 'object') return;
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith('phoenix-')) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        });
      },

      // Upload to cloud
      uploadToCloud: async () => {
        const user = auth?.currentUser;
        if (!user) {
          set({ syncStatus: 'error', lastSyncError: 'Não autenticado' });
          return false;
        }
        
        set({ syncStatus: 'syncing', lastSyncError: null });
        
        try {
          const data = get()._collectData();
          const docRef = doc(db, 'users', user.uid, 'sync', 'latest');
          await setDoc(docRef, {
            data,
            updatedAt: new Date().toISOString(),
            email: user.email,
            uid: user.uid,
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
            },
          });
          
          set({ 
            syncStatus: 'success', 
            lastSyncAt: new Date().toISOString(),
            lastSyncError: null,
          });
          return true;
        } catch (error) {
          console.error('Sync upload error:', error);
          set({ syncStatus: 'error', lastSyncError: error.message });
          return false;
        }
      },

      // Download from cloud
      downloadFromCloud: async () => {
        const user = auth?.currentUser;
        if (!user) {
          set({ syncStatus: 'error', lastSyncError: 'Não autenticado' });
          return false;
        }
        
        set({ syncStatus: 'syncing', lastSyncError: null });
        
        try {
          const docRef = doc(db, 'users', user.uid, 'sync', 'latest');
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            set({ syncStatus: 'idle', lastSyncError: 'Nenhum backup encontrado na nuvem' });
            return false;
          }
          
          const { data, updatedAt } = docSnap.data();
          get()._applyData(data);
          
          set({ 
            syncStatus: 'success', 
            lastSyncAt: updatedAt,
            lastSyncError: null,
          });
          
          // Reload to rehydrate all stores
          setTimeout(() => window.location.reload(), 500);
          return true;
        } catch (error) {
          console.error('Sync download error:', error);
          set({ syncStatus: 'error', lastSyncError: error.message });
          return false;
        }
      },

      // Start auto sync
      startAutoSync: () => {
        const { syncInterval, _intervalId } = get();
        if (syncInterval === 'manual') return;
        
        // Clear existing interval
        if (_intervalId) clearInterval(_intervalId);
        
        const ms = SYNC_INTERVALS[syncInterval] || 300000;
        
        const id = setInterval(() => {
          const user = auth?.currentUser;
          if (user) {
            get().uploadToCloud();
          }
        }, ms);
        
        set({ _intervalId: id });
      },

      // Stop auto sync
      stopAutoSync: () => {
        const { _intervalId } = get();
        if (_intervalId) {
          clearInterval(_intervalId);
          set({ _intervalId: null });
        }
      },

      // Start real-time listener (onSnapshot)
      startRealtimeSync: () => {
        const user = auth?.currentUser;
        if (!user) return;
        
        const { _unsubscribe } = get();
        if (_unsubscribe) _unsubscribe(); // Prevent duplicates
        
        const docRef = doc(db, 'users', user.uid, 'sync', 'latest');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const { data, updatedAt } = docSnap.data();
            // Only apply if newer than our last sync
            const current = get().lastSyncAt;
            if (!current || new Date(updatedAt) > new Date(current)) {
              get()._applyData(data);
              set({ lastSyncAt: updatedAt });
            }
          }
        }, (error) => {
          console.error('Realtime sync error:', error);
        });
        
        set({ _unsubscribe: unsubscribe });
      },

      // Stop real-time listener
      stopRealtimeSync: () => {
        const { _unsubscribe } = get();
        if (_unsubscribe) {
          _unsubscribe();
          set({ _unsubscribe: null });
        }
      },

      // Initialize sync on auth
      initSync: () => {
        const user = auth?.currentUser;
        if (user && get().autoSyncEnabled && get().syncInterval !== 'manual') {
          get().startAutoSync();
        }
      },
    }),
    {
      name: 'phoenix-sync',
      partialize: (state) => ({
        syncInterval: state.syncInterval,
        autoSyncEnabled: state.autoSyncEnabled,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

export { SYNC_INTERVALS };
```

- [ ] **Step 2: Build and verify**

Run: `npx react-scripts build`
Expected: Compiled successfully

- [ ] **Step 3: Commit**

```bash
git add src/stores/useSyncStore.js
git commit -m "feat: create useSyncStore with auto cloud sync + configurable interval"
```

---

## Task 6: Add Sync Settings UI in SettingsPage

### Files:
- Modify: `src/modules/settings/SettingsPage.jsx`

- [ ] **Step 1: Add sync store import and hook**

At the top of SettingsPage, add:

```javascript
import { useSyncStore, SYNC_INTERVALS } from '../../stores/useSyncStore';
```

Inside the component, add:

```javascript
const { 
  syncInterval, 
  setSyncInterval, 
  autoSyncEnabled, 
  toggleAutoSync,
  lastSyncAt, 
  syncStatus, 
  lastSyncError,
  uploadToCloud, 
  downloadFromCloud,
  startRealtimeSync,
} = useSyncStore();
```

- [ ] **Step 2: Replace the Cloud Sync card section**

Find the "Sincronização Cloud" card in SettingsPage and replace it with:

```jsx
{/* ── SYNC SETTINGS ────────────────────────────────────── */}
<div className="bg-[#17171E] border border-white/[0.06] rounded-2xl p-5 space-y-4">
  <h3 className="text-sm font-black text-white flex items-center gap-2">
    <span className="text-lg">☁️</span> Sincronização Cloud
  </h3>
  
  {/* Auto Sync Toggle */}
  <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
    <div>
      <p className="text-xs font-bold text-white">Sincronização Automática</p>
      <p className="text-[10px] text-gray-400">Sincroniza automaticamente com a nuvem</p>
    </div>
    <button
      onClick={toggleAutoSync}
      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
        autoSyncEnabled ? 'bg-emerald-500' : 'bg-white/10'
      }`}
    >
      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 ${
        autoSyncEnabled ? 'left-[26px]' : 'left-0.5'
      }`} />
    </button>
  </div>

  {/* Sync Interval Selector */}
  {autoSyncEnabled && (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        Intervalo de Sincronização
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {Object.entries(SYNC_INTERVALS).map(([key, ms]) => (
          <button
            key={key}
            onClick={() => setSyncInterval(key)}
            className={`py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              syncInterval === key
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {key === 'manual' ? 'Manual' : key}
          </button>
        ))}
      </div>
    </div>
  )}

  {/* Sync Status */}
  <div className="flex items-center gap-2 text-[10px]">
    <div className={`w-2 h-2 rounded-full ${
      syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
      syncStatus === 'success' ? 'bg-emerald-400' :
      syncStatus === 'error' ? 'bg-red-400' : 'bg-gray-500'
    }`} />
    <span className="text-gray-400">
      {syncStatus === 'syncing' && 'Sincronizando...'}
      {syncStatus === 'success' && `Última sync: ${lastSyncAt ? new Date(lastSyncAt).toLocaleString('pt-BR') : 'Nunca'}`}
      {syncStatus === 'error' && `Erro: ${lastSyncError}`}
      {syncStatus === 'idle' && 'Pronto para sincronizar'}
    </span>
  </div>

  {/* Manual Sync Buttons */}
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={async () => {
        const ok = await uploadToCloud();
        toast[ok ? 'success' : 'error'](ok ? 'Backup enviado para a nuvem! ☁️' : 'Erro ao enviar backup.');
      }}
      disabled={syncStatus === 'syncing' || !user}
      className="py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ⬆ Enviar para Nuvem
    </button>
    <button
      onClick={async () => {
        const ok = await downloadFromCloud();
        toast[ok ? 'success' : 'error'](ok ? 'Dados restaurados da nuvem! 📥' : 'Erro ao restaurar.');
      }}
      disabled={syncStatus === 'syncing' || !user}
      className="py-3 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ⬇ Baixar da Nuvem
    </button>
  </div>
</div>
```

- [ ] **Step 3: Add sync initialization**

In the useEffect or componentDidMount area of SettingsPage, add:

```javascript
// Initialize sync on mount
useEffect(() => {
  const unsubscribe = auth?.onAuthStateChanged((user) => {
    if (user) {
      useSyncStore.getState().initSync();
    }
  });
  return () => {
    unsubscribe?.();
    useSyncStore.getState().stopAutoSync();
    useSyncStore.getState().stopRealtimeSync();
  };
}, []);
```

- [ ] **Step 4: Build and verify**

Run: `npx react-scripts build`
Expected: Compiled successfully

- [ ] **Step 5: Commit**

```bash
git add src/modules/settings/SettingsPage.jsx
git commit -m "feat: add sync settings UI with interval selector + status indicator"
```

---

## Task 7: Wire Up Sync Init in App

### Files:
- Modify: `src/app/App.jsx`

- [ ] **Step 1: Add sync initialization on auth state**

At the top of App.jsx, add:

```javascript
import { useSyncStore } from '../stores/useSyncStore';
```

Inside the App component, add an effect to initialize sync when user logs in:

```javascript
// Initialize cloud sync on auth
useEffect(() => {
  const unsubscribe = auth?.onAuthStateChanged((user) => {
    if (user) {
      useSyncStore.getState().initSync();
    } else {
      useSyncStore.getState().stopAutoSync();
    }
  });
  return () => {
    unsubscribe?.();
    useSyncStore.getState().stopAutoSync();
  };
}, []);
```

- [ ] **Step 2: Build and verify**

Run: `npx react-scripts build`
Expected: Compiled successfully

- [ ] **Step 3: Commit**

```bash
git add src/app/App.jsx
git commit -m "feat: wire up cloud sync initialization on app start"
```

---

## Task 8: Final Integration Test

- [ ] **Step 1: Run full build**

```bash
npx react-scripts build
```
Expected: Compiled successfully

- [ ] **Step 2: Run all tests**

```bash
$env:CI="true"; npx react-scripts test --watchAll=false
```
Expected: All tests pass

- [ ] **Step 3: Manual verification checklist**

1. **JSON Import**: Go to Health → Administração → JSON Data tab → paste valid JSON → click "Injetar no Estado" → should succeed
2. **Standard Health Program**: Go to Health → Administração → Programs section → click "Standard Health Program" card → all plans should load
3. **Save Custom Program**: Make changes to plans → click "Salvar Atual" → enter name → program saved
4. **Load/Delete Program**: Click "Carregar" on a saved program → plans update. Click trash → program deleted
5. **Cloud Sync**: Go to Settings → toggle auto sync → select interval → click "Enviar para Nuvem" → should show success
6. **Cross-device**: On second device, login → go to Settings → click "Baixar da Nuvem" → data should restore

- [ ] **Step 4: Push final**

```bash
git add -A
git commit -m "feat: complete health programs + cloud sync system"
git push origin main
```
