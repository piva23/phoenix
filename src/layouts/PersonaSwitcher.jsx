import React, { useState, useRef, useEffect } from 'react';
import { usePersonaStore } from '../stores/usePersonaStore';
import { motion, AnimatePresence } from 'framer-motion';

export function PersonaSwitcher() {
  const { personas, activePersonaId, setActivePersona } = usePersonaStore();
  const getActivePersona = usePersonaStore(s => s.getActivePersona);
  const persona = getActivePersona();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão de Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 hover:border-primary/40 bg-white/[0.02] hover:bg-white/5 transition-all text-left outline-none"
      >
        <div className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }} />
        <span className="text-xs font-semibold text-text-main">{persona?.name}</span>
        <span className="text-base flex-shrink-0">{persona?.icon}</span>
        <span className="text-[10px] text-text-dim ml-1">▼</span>
      </button>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-2 border border-white/10 p-2 shadow-2xl z-50 overflow-hidden"
          >
            <div className="text-[10px] font-bold text-text-dim uppercase tracking-wider px-3 py-1.5 border-b border-white/5 mb-1.5 select-none">
              Trocar Lente / Persona
            </div>
            
            <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
              {personas.map((p) => {
                const isActive = p.id === activePersonaId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePersona(p.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-2 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-white/10 text-text-main font-semibold'
                        : 'text-text-muted hover:text-text-main hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{
                        background: isActive ? p.colorPrimary + '22' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? p.colorPrimary : 'rgba(255,255,255,0.05)'}`,
                      }}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate text-text-main">{p.name}</div>
                      <div className="text-[10px] text-text-dim truncate">{p.title}</div>
                    </div>
                    {isActive && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: p.colorPrimary + '22', color: p.colorPrimary }}
                      >
                        ATIVA
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
