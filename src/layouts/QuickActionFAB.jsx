import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInboxStore } from '../stores/useInboxStore';
import { useSessionModalStore } from '../stores/useSessionModalStore';
import { toast } from 'react-hot-toast';

export function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [ideaContent, setIdeaContent] = useState('');
  
  const addItem = useInboxStore(s => s.addItem);
  const openStudyModal = useSessionModalStore(s => s.openModal);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleStudySession = () => {
    openStudyModal();
    setIsOpen(false);
  };

  const handleOpenInbox = () => {
    setShowInboxModal(true);
    setIsOpen(false);
  };

  const handleSaveIdea = (e) => {
    e.preventDefault();
    if (!ideaContent.trim()) return;
    
    addItem(ideaContent.trim());
    toast.success('Ideia capturada no Brain Dump!', {
      icon: '💡',
    });
    setIdeaContent('');
    setShowInboxModal(false);
  };

  return (
    <>
      {/* Backdrop when FAB menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-35"
          />
        )}
      </AnimatePresence>

      <div className="fixed right-4 bottom-20 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end gap-3">
        {/* Sub-buttons */}
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-2.5 mb-1">
              {/* Option: Nova Sessão Estudo */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                onClick={handleStudySession}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-white/10 hover:border-primary/40 text-text-main shadow-lg hover:bg-white/5 transition-all text-xs font-medium"
              >
                <span>⏱️ Nova Sessão (Estudo)</span>
              </motion.button>

              {/* Option: Nova Ideia Inbox */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onClick={handleOpenInbox}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-white/10 hover:border-primary/40 text-text-main shadow-lg hover:bg-white/5 transition-all text-xs font-medium"
              >
                <span>💡 Nova Ideia (Inbox)</span>
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        {/* Main Trigger Button */}
        <motion.button
          onClick={toggleMenu}
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            boxShadow: '0 4px 20px var(--glow)'
          }}
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          +
        </motion.button>
      </div>

      {/* Popover / Modal for entering new idea */}
      <AnimatePresence>
        {showInboxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInboxModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-surface border border-white/10 p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <span>💡</span> Capturar Nova Ideia
                </h3>
                <button
                  onClick={() => setShowInboxModal(false)}
                  className="text-text-dim hover:text-text-main text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveIdea} className="space-y-4">
                <textarea
                  value={ideaContent}
                  onChange={(e) => setIdeaContent(e.target.value)}
                  placeholder="Escreva livremente o seu pensamento para esvaziar a mente..."
                  className="w-full min-h-[100px] bg-background border border-white/5 rounded-xl p-3 text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary/50 resize-none"
                  autoFocus
                />
                
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowInboxModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-text-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md transition-all"
                  >
                    Capturar Ideia
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
