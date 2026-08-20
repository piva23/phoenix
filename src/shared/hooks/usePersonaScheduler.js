import { useEffect, useRef } from 'react';
import { usePersonaStore } from '../../stores/usePersonaStore';
import { toast } from 'react-hot-toast';

export function usePersonaScheduler() {
  const { personas, activePersonaId, setActivePersona } = usePersonaStore();
  const lastCheckedMinute = useRef('');

  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${currentHours}:${currentMinutes}`;

      // Only check once per minute change
      if (lastCheckedMinute.current === timeString) return;
      lastCheckedMinute.current = timeString;

      personas.forEach((p) => {
        if (p.schedule && p.schedule.active && p.schedule.time === timeString) {
          if (activePersonaId !== p.id) {
            setActivePersona(p.id);
            
            // Disparar notificação visual (Toast)
            toast.custom((t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-surface-2 border border-white/10 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}
                style={{
                  borderLeft: `4px solid ${p.colorPrimary || 'var(--primary)'}`
                }}
              >
                <div className="flex-1 w-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5 text-2xl">
                      {p.icon}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-xs font-bold text-text-main uppercase tracking-wider">
                        Mudança de Lente: {p.name}
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        {p.schedule.notificationText || `Sincronização de horário com a Persona ${p.name}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-white/5">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-2 flex items-center justify-center text-xs font-medium text-text-dim hover:text-text-main focus:outline-none"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ), { duration: 8000 });

            // Som curto orgânico gerado via sintetizador Web Audio API
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              
              // Primeiro bip suave (D5)
              const osc1 = audioCtx.createOscillator();
              const gain1 = audioCtx.createGain();
              osc1.type = 'sine';
              osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              gain1.gain.setValueAtTime(0.05, audioCtx.currentTime);
              gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
              osc1.connect(gain1);
              gain1.connect(audioCtx.destination);
              osc1.start();
              osc1.stop(audioCtx.currentTime + 0.4);

              // Segundo bip suave harmonioso (A5) que entra logo a seguir
              setTimeout(() => {
                try {
                  const osc2 = audioCtx.createOscillator();
                  const gain2 = audioCtx.createGain();
                  osc2.type = 'sine';
                  osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
                  gain2.gain.setValueAtTime(0.04, audioCtx.currentTime);
                  gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                  osc2.connect(gain2);
                  gain2.connect(audioCtx.destination);
                  osc2.start();
                  osc2.stop(audioCtx.currentTime + 0.5);
                } catch (_) {}
              }, 120);

            } catch (err) {
              console.warn('Web Audio API não inicializada para som do Scheduler:', err);
            }
          }
        }
      });
    };

    // Executa verificação imediatamente e depois a cada 30s
    checkSchedule();
    const interval = setInterval(checkSchedule, 30000);

    return () => clearInterval(interval);
  }, [personas, activePersonaId, setActivePersona]);
}
