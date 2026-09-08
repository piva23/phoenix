import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Flame, Utensils, Dumbbell } from 'lucide-react';
import { HidratacaoView } from '../../health/views/HidratacaoView';
import { HabitosView } from '../../health/views/HabitosView';
import { DietaView } from '../../health/views/DietaView';
import { TreinoView } from '../../health/views/TreinoView';

const HEALTH_TABS = [
  { id: 'hidratacao', label: 'Água',       icon: Droplets, color: '#38BDF8' },
  { id: 'habitos',    label: 'Hábitos',    icon: Flame,    color: '#A855F7' },
  { id: 'dieta',      label: 'Dieta',      icon: Utensils, color: '#10B981' },
  { id: 'treino',     label: 'Treino',     icon: Dumbbell, color: '#F59E0B' },
];

export function HealthQuickModal({ isOpen, onClose, initialTab = 'hidratacao' }) {
  const [tab, setTab] = useState(initialTab);

  // Reset tab when modal opens with a new tab
  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0C0C10]/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[85vh] bg-[#0F0E17]/95 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Health OS</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1.5 px-4 py-2.5 border-b border-white/5 overflow-x-auto scrollbar-hide">
            {HEALTH_TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Icon size={12} style={{ color: isActive ? t.color : undefined }} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {tab === 'hidratacao' && <HidratacaoView />}
            {tab === 'habitos' && <HabitosView />}
            {tab === 'dieta' && <DietaView />}
            {tab === 'treino' && <TreinoView />}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default HealthQuickModal;
