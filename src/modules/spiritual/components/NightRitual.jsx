import { useState } from 'react'
import { useSpiritualStore, ENERGY_LEVELS } from '../../../stores/useSpiritualStore'
import { useXPStore } from '../../../stores/useXPStore'
import { useUserStore } from '../../../stores/useUserStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import toast from 'react-hot-toast'

const ACCENT = '#6366F1'
const today = () => new Date().toISOString().split('T')[0]

export function NightRitual({ onClose, onComplete }) {
  const { saveNight, getRitual, toggleTask } = useSpiritualStore()
  const { logXP } = useXPStore()
  const { addXP } = useUserStore()
  const activePersonaId = usePersonaStore(s => s.activePersonaId)

  const date     = today()
  const morning  = getRitual(date, 'morning')
  const existing = getRitual(date, 'night')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    wentWell:          existing?.wentWell          || '',
    learned:           existing?.learned           || '',
    tomorrow:          existing?.tomorrow          || '',
    energyLevel:       existing?.energyLevel       || 3,
    meditated:         existing?.meditated         || false,
    meditationMinutes: existing?.meditationMinutes || 0,
  })

  const tasks      = (morning?.tasks || []).filter(t => t.text?.trim())
  const tasksDone  = tasks.filter(t => t.done).length
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const saveStep   = () => saveNight(date, form)

  const handleComplete = () => {
    saveNight(date, { ...form, completedAt: new Date().toISOString() })
    const xp = 25 + (form.meditated ? 15 : 0)
    logXP({ action: 'NIGHT_RITUAL', xp, moduleOrigin: 'spiritual', personaId: activePersonaId, radarAxis: 'disciplina' })
    addXP(xp)
    toast.success(`Dia fechado! +${xp} XP 🌙`)
    onComplete?.()
  }

  const STEPS = [
    { label: 'Tarefas',  icon: '✅' },
    { label: 'Reflexão', icon: '💭' },
    { label: 'Amanhã',   icon: '🔮' },
    { label: 'Energia',  icon: '⚡' },
  ]

  const ta    = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="px-4 pt-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-main">🌙 Ritual da Noite</h2>
            <p className="text-xs text-text-dim mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-dim hover:bg-white/8">✕</button>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => { saveStep(); setStep(i + 1) }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: step === i + 1 ? ACCENT : step > i + 1 ? ACCENT + '55' : 'var(--bg-surface)',
                color: step === i + 1 ? '#fff' : step > i + 1 ? '#fff' : 'var(--text-dim)',
              }}>
              {step > i + 1 ? '✓' : s.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Step 1 — Revisão de tarefas */}
        {step === 1 && (
          <div className="space-y-3">
            {tasks.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-dim">Revisão das tarefas do dia</p>
                  <span className="text-sm font-bold"
                    style={{ color: tasksDone === tasks.length ? '#10B981' : ACCENT }}>
                    {tasksDone}/{tasks.length}
                  </span>
                </div>
                {tasks.map((task, i) => (
                  <button key={i} onClick={() => toggleTask(date, i)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all active:scale-[0.98]"
                    style={{ background: task.done ? '#10B98115' : 'var(--bg-surface)', borderColor: task.done ? '#10B98144' : 'var(--border)' }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: task.done ? '#10B981' : 'var(--bg-surface-2)', border: `1px solid ${task.done ? '#10B981' : 'var(--border)'}` }}>
                      {task.done && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm"
                      style={{ color: task.done ? 'var(--text-dim)' : 'var(--text-main)', textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.7 : 1 }}>
                      {task.text}
                    </span>
                  </button>
                ))}
                {tasksDone === tasks.length && (
                  <div className="rounded-xl p-3 text-center" style={{ background: '#10B98115', border: '1px solid #10B98133' }}>
                    <p className="text-sm font-semibold" style={{ color: '#10B981' }}>🎉 Todas as tarefas concluídas!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="text-4xl mb-2 opacity-30">✅</div>
                <p className="text-text-muted">Nenhuma tarefa foi planejada hoje</p>
                <p className="text-xs text-text-dim mt-1">Complete o ritual da manhã para planejar tarefas</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Reflexão */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">🌟 O que deu bem hoje?</label>
              <textarea rows={4} className={ta} style={inpSt} autoFocus
                placeholder="Qual foi a melhor parte do dia?"
                value={form.wentWell} onChange={e => setF('wentWell', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">📚 O que você aprendeu?</label>
              <textarea rows={4} className={ta} style={inpSt}
                placeholder="Uma lição, insight ou aprendizado de hoje..."
                value={form.learned} onChange={e => setF('learned', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3 — Amanhã + Meditação */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">🔮 Amanhã, o mais importante é...</label>
              <textarea rows={3} className={ta} style={inpSt} autoFocus
                placeholder="Uma coisa que fará amanhã ser ótimo..."
                value={form.tomorrow} onChange={e => setF('tomorrow', e.target.value)} />
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 cursor-pointer mb-3"
                onClick={() => setF('meditated', !form.meditated)}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: form.meditated ? '#A855F7' : 'var(--bg-surface-2)', border: `1px solid ${form.meditated ? '#A855F7' : 'var(--border)'}` }}>
                  {form.meditated && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-main">🧘 Meditei / Orei hoje</div>
                  <div className="text-xs text-text-dim">Marque se praticou hoje</div>
                </div>
              </div>
              {form.meditated && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-text-dim">Quantos minutos?</span>
                  <input type="number" min={1} max={180}
                    className="w-20 px-2 py-1.5 rounded-xl text-sm text-center outline-none"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                    value={form.meditationMinutes}
                    onChange={e => setF('meditationMinutes', Number(e.target.value))} />
                  <span className="text-xs text-text-dim">min</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Energia + Resumo */}
        {step === 4 && (
          <div className="space-y-5 py-2">
            <div className="text-center">
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-5">Qual foi seu nível de energia hoje?</p>
              <div className="flex justify-center gap-3">
                {ENERGY_LEVELS.map(e => (
                  <button key={e.value} onClick={() => setF('energyLevel', e.value)}
                    className="flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all"
                    style={{
                      borderColor: form.energyLevel === e.value ? ACCENT : 'var(--border)',
                      background:  form.energyLevel === e.value ? ACCENT + '22' : 'var(--bg-surface)',
                      transform:   form.energyLevel === e.value ? 'scale(1.1)' : 'scale(1)',
                    }}>
                    <span className="text-3xl">{e.emoji}</span>
                    <span className="text-xs text-text-dim">{e.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Resumo do dia</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-surface-2)' }}>
                  <div className="text-lg font-bold" style={{ color: tasksDone === tasks.length && tasks.length > 0 ? '#10B981' : ACCENT }}>
                    {tasksDone}/{tasks.length}
                  </div>
                  <div className="text-xs text-text-dim">Tarefas</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-surface-2)' }}>
                  <div className="text-lg font-bold" style={{ color: '#A855F7' }}>
                    {form.meditated ? `${form.meditationMinutes}m` : '—'}
                  </div>
                  <div className="text-xs text-text-dim">Meditação</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-surface-2)' }}>
                  <div className="text-2xl">{ENERGY_LEVELS.find(e => e.value === form.energyLevel)?.emoji}</div>
                  <div className="text-xs text-text-dim">Energia</div>
                </div>
              </div>
              {form.wentWell && (
                <p className="text-sm text-text-dim italic">
                  "{ form.wentWell.length > 80 ? form.wentWell.slice(0, 80) + '...' : form.wentWell }"
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {step > 1 ? (
          <button onClick={() => { saveStep(); setStep(s => s - 1) }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5"
            style={{ borderColor: 'var(--border)' }}>
            ← Voltar
          </button>
        ) : (
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5"
            style={{ borderColor: 'var(--border)' }}>
            Cancelar
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => { saveStep(); setStep(s => s + 1) }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: ACCENT }}>
            Próximo →
          </button>
        ) : (
          <button onClick={handleComplete}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: '#10B981' }}>
            ✓ Fechar o Dia — +{25 + (form.meditated ? 15 : 0)} XP
          </button>
        )}
      </div>
    </div>
  )
}
