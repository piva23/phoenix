import { useHealthStore } from '../../../stores/useHealthStore';
import { useGameStore } from '../../../stores/useGameStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Droplets } from 'lucide-react';

const XP = { WATER: 10 };

function mlToL(ml) {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

export function HidratacaoView() {
  const {
    plans = {},
    getTodayWaterMl,
    addWater,
    recalcStreaks,
    canClaimXP,
    markXPClaimed,
  } = useHealthStore();

  const dispatchXP = useGameStore(s => s.dispatchXP);

  const waterGoal = plans.water?.dailyGoalMl || plans.goals?.waterDailyMl || 2500;
  const currentWater = getTodayWaterMl();
  const waterPct = Math.min(100, Math.round((currentWater / waterGoal) * 100));
  const waterButtons = plans.water?.buttons || [
    { ml: 250, label: '💧 Copo (250ml)' },
    { ml: 500, label: '🧴 Garrafa (500ml)' },
    { ml: 1000, label: '🪣 Jarra (1L)' },
  ];

  const handleQuickAddWater = (ml) => {
    addWater(ml);
    recalcStreaks();
    const xpKey = `water_${Date.now()}`;
    if (canClaimXP(xpKey)) {
      markXPClaimed(xpKey);
      dispatchXP('health', XP.WATER, 'forca');
    }
    toast.success(`+${ml}ml de água registrados! 💧 (+${XP.WATER} XP)`, {
      style: { background: '#071828', color: '#38BDF8', border: '1px solid #38BDF833' },
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="card-glass p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="p-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                <Droplets size={16} />
              </span>
              Hidratação Inteligente
            </h3>
            <span className="text-[10px] font-black text-sky-400 font-mono bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-xl">
              {currentWater} / {waterGoal} ml
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-2">
              <span>Progresso Diário</span>
              <span className="text-sky-300 font-mono font-black">{waterPct}%</span>
            </div>
            <div className="w-full h-3.5 bg-black/40 rounded-full overflow-hidden border border-white/10 relative p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${waterPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Quick buttons */}
          <div className="space-y-2 mb-4">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">
              Registro Rápido em 1-Clique:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {waterButtons.map((b, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAddWater(b.ml)}
                  className="py-3 px-3 rounded-2xl bg-black/40 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-white hover:text-sky-300 text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  {b.label || `💧 +${b.ml}ml`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          <span>Status: {waterPct >= 100 ? '✅ Meta Batida!' : '💧 Em andamento'}</span>
          <span>Meta: {mlToL(waterGoal)}</span>
        </div>
      </div>
    </div>
  );
}

export default HidratacaoView;