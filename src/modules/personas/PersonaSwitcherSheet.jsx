import { useUIStore } from '../../stores/useUIStore'
import { usePersonaStore } from '../../stores/usePersonaStore'
import { motion, AnimatePresence } from 'framer-motion'

export function PersonaSwitcherSheet() {
  const { personaSwitcherOpen, closePersonaSwitcher } = useUIStore()
  const { personas, activePersonaId, setActivePersona } = usePersonaStore()

  return (
    <AnimatePresence>
      {personaSwitcherOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePersonaSwitcher} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-strong rounded-t-3xl p-6 pb-8"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-sm font-semibold text-text-muted mb-4 text-center tracking-widest uppercase">Trocar Persona</h2>
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              {personas.map(p => {
                const isActive = p.id === activePersonaId
                return (
                  <button key={p.id}
                    onClick={() => { setActivePersona(p.id); closePersonaSwitcher() }}
                    className="flex items-center gap-4 p-4 rounded-2xl border transition-all text-left"
                    style={{ borderColor: isActive ? p.colorPrimary : 'var(--border)', background: isActive ? p.colorPrimary + '18' : 'var(--bg-surface-2)' }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: p.colorPrimary + '22', border: `1px solid ${p.colorPrimary}44` }}>
                      {p.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-main text-sm">{p.name}</div>
                      <div className="text-xs text-text-muted">{p.title}</div>
                    </div>
                    {isActive && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: p.colorPrimary + '22', color: p.colorPrimary }}>ATIVA</span>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
