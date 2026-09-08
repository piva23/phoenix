import { useHealthStore } from '../../../stores/useHealthStore';
import { useGameStore } from '../../../stores/useGameStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import toast from 'react-hot-toast';
import { Flame, CheckCircle2, ShieldAlert } from 'lucide-react';

const XP = { HABIT: 20 };

export function HabitosView() {
  const {
    plans = {},
    logHabit,
    getHabitLogToday,
    recalcStreaks,
    canClaimXP,
    markXPClaimed,
  } = useHealthStore();

  const dispatchXP = useGameStore(s => s.dispatchXP);
  const projects = useProjectStore(s => s.projects || []);
  const todayStr = new Date().toISOString().split('T')[0];

  const buildHabits = (plans.habits || []).filter(h => h.type === 'build');
  const quitHabits = (plans.habits || []).filter(h => h.type === 'quit');

  const getProjectById = (id) => projects.find(p => p.id === id);

  return (
    <div className="space-y-6 pb-20">
      <div className="card-glass p-6 relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <Flame size={16} />
              </span>
              Hábitos & Sobriedade
            </h3>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
              Autodomínio Diário
            </span>
          </div>

          {/* SEÇÃO 1: HÁBITOS BONS (VIRTUDES) */}
          <div className="space-y-3 mb-6">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">
              ✨ Virtudes Diárias (1-Clique):
            </span>

            {buildHabits.length === 0 && quitHabits.length === 0 ? (
              <div className="p-6 rounded-2xl bg-black/30 border-2 border-dashed border-purple-500/30 text-center space-y-3 my-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Nenhum hábito ou vício cadastrado
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Crie virtudes e monitore sua sobriedade na aba Config.
                  </p>
                </div>
              </div>
            ) : buildHabits.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-gray-500 text-center">
                Nenhuma virtude diária cadastrada.
              </div>
            ) : (
              buildHabits.map(h => {
                const done = getHabitLogToday(h.id);
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      logHabit(h.id, !done);
                      recalcStreaks();
                      if (!done) {
                        const xpKey = `habit_${h.id}_${todayStr}`;
                        if (canClaimXP(xpKey)) {
                          markXPClaimed(xpKey);
                          dispatchXP('health', XP.HABIT, 'disciplina');
                        }
                        toast.success(`Hábito "${h.name}" concluído! +${XP.HABIT} XP ✨`, {
                          style: { background: '#1c0f2a', color: '#A855F7', border: '1px solid #A855F733' },
                        });
                      }
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      done
                        ? 'bg-purple-950/20 border-purple-500/50 text-purple-200'
                        : 'bg-black/40 border-white/10 hover:border-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-1 bg-black/30 rounded-xl border border-white/5">
                        {h.icon || '🔥'}
                      </span>
                      <div>
                        <span className={`text-xs font-black uppercase tracking-wide block ${done ? 'line-through opacity-75' : ''}`}>
                          {h.name || h.routine}
                        </span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">
                          {h.reward ? `🎁 ${h.reward}` : 'Meta Diária'}
                        </span>
                        {h.projectId && (() => {
                          const proj = getProjectById(h.projectId);
                          return proj ? (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md border mt-1"
                              style={{
                                color: proj.cor || '#A855F7',
                                borderColor: `${proj.cor || '#A855F7'}44`,
                                background: `${proj.cor || '#A855F7'}15`,
                              }}
                            >
                              {proj.icone} {proj.nome}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                      done ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/20 bg-black/20'
                    }`}>
                      {done && <CheckCircle2 size={14} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* SEÇÃO 2: SOBRIEDADE */}
          {quitHabits.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-white/5">
              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">
                ⛔ Mural da Sobriedade (Vícios):
              </span>
              {quitHabits.map(q => {
                const isFail = getHabitLogToday(q.id) === false;
                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl border bg-gradient-to-r from-rose-950/30 to-black/40 border-rose-500/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                        <ShieldAlert size={16} />
                      </span>
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-wide block">
                          {q.name}
                        </span>
                        <span className="text-[9px] text-rose-300/80 font-bold uppercase tracking-wider block">
                          {isFail ? 'Recaída registrada hoje' : 'Dia Limpo em Andamento'}
                        </span>
                        {q.projectId && (() => {
                          const proj = getProjectById(q.projectId);
                          return proj ? (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md border mt-1"
                              style={{
                                color: proj.cor || '#A855F7',
                                borderColor: `${proj.cor || '#A855F7'}44`,
                                background: `${proj.cor || '#A855F7'}15`,
                              }}
                            >
                              {proj.icone} {proj.nome}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logHabit(q.id, false);
                        recalcStreaks();
                        toast.error(`Recaída registrada em "${q.name}". Zere e recomece!`, { icon: '🐍' });
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                    >
                      {isFail ? 'Registrado' : 'Resetar / Recaída'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HabitosView;