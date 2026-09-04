import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, HeartPulse, PlusCircle, BookOpen, CheckCircle2 } from 'lucide-react';

const ITEMS = [
  { label: 'Hábitos',     icon: CheckCircle2, color: '#10B981', path: '/health' },
  { label: 'Água',        icon: Droplets,     color: '#38BDF8', path: '/health?tab=agua' },
  { label: 'Saúde',       icon: HeartPulse,   color: '#EF4444', path: '/health' },
  { label: '+ Despesa',   icon: PlusCircle,   color: '#EC4899', path: '/finance?action=expense' },
  { label: 'Estudo',      icon: BookOpen,     color: '#8B5CF6', path: '/study/today' },
];

export function QuickAccess() {
  const navigate = useNavigate();

  return (
    <div className="select-none">
      <h3 className="text-[11px] font-bold text-text-dim uppercase tracking-widest px-1 mb-3">
        Acesso Rápido
      </h3>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.94 }}
              className="flex flex-col items-center justify-center gap-2 min-w-[86px] px-4 py-4 rounded-2xl card-surface hover:bg-white/[0.04] hover:border-white/15 transition-all cursor-pointer flex-shrink-0"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                  color: item.color,
                }}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold text-text-main leading-none">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickAccess;