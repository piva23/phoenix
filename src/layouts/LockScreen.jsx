import React, { useState, useEffect } from 'react';
import { useSecurityStore } from '../stores/useSecurityStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export function LockScreen() {
  const { pin, isLocked, unlock } = useSecurityStore();
  const [inputPin, setInputPin] = useState('');
  const [isError, setIsError] = useState(false);

  // Se não houver PIN configurado ou não estiver travado, não renderiza nada
  if (!pin || !isLocked) return null;

  const handleKeyPress = (num) => {
    if (inputPin.length < 4) {
      const newVal = inputPin + num;
      setInputPin(newVal);
      
      // Auto-validate once 4 digits are entered
      if (newVal.length === 4) {
        if (newVal === pin) {
          setTimeout(() => {
            unlock();
            setInputPin('');
            toast.success('Acesso concedido. Bem-vindo de volta!', { icon: '🔓' });
          }, 200);
        } else {
          setTimeout(() => {
            setIsError(true);
            setInputPin('');
            toast.error('Código PIN incorreto.');
            setTimeout(() => setIsError(false), 500);
          }, 200);
        }
      }
    }
  };

  const handleBackspace = () => {
    setInputPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputPin('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#0C0C10]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 select-none"
      >
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-secondary/15 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col items-center space-y-8 relative z-10">
          {/* Logo / Title */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl shadow-2xl mx-auto border border-white/10 glow"
            >
              🜁
            </motion.div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-text-main">Phoenix OS</h1>
              <p className="text-xs text-text-dim">Dispositivo Protegido por PIN</p>
            </div>
          </div>

          {/* Dots Indicator */}
          <motion.div
            animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-4 py-4"
          >
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border ${
                  index < inputPin.length
                    ? 'bg-primary border-primary scale-110 shadow-[0_0_8px_var(--primary)]'
                    : 'bg-white/5 border-white/10'
                }`}
              />
            ))}
          </motion.div>

          {/* Keyboard Grid */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="w-16 h-16 rounded-full bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.15] border border-white/5 hover:border-white/10 text-xl font-semibold text-text-main flex items-center justify-center transition-all outline-none"
              >
                {num}
              </button>
            ))}

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="w-16 h-16 rounded-full text-xs font-semibold text-text-dim hover:text-text-main flex items-center justify-center transition-colors outline-none"
            >
              LIMPAR
            </button>

            {/* 0 Button */}
            <button
              onClick={() => handleKeyPress(0)}
              className="w-16 h-16 rounded-full bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.15] border border-white/5 hover:border-white/10 text-xl font-semibold text-text-main flex items-center justify-center transition-all outline-none"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              onClick={handleBackspace}
              className="w-16 h-16 rounded-full text-xs font-semibold text-text-dim hover:text-text-main flex items-center justify-center transition-colors outline-none"
            >
              APAGAR
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
