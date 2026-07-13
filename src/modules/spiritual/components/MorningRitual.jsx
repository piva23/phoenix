import { useState } from 'react'
import { useSpiritualStore, DAY_FEELINGS, ENERGY_LEVELS } from '../../../stores/useSpiritualStore'
import { useXPStore } from '../../../stores/useXPStore'
import { useUserStore } from '../../../stores/useUserStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import toast from 'react-hot-toast'

const ACCENT = '#F59E0B'
const today = () => new Date().toISOString().split('T')[0]

export function MorningRitual({ onClose, onComplete }) {
  const { saveMorning, getRitual, quotes, todayQuoteId, drawDailyQuote } = useSpiritualStore()
  const { logXP } = useXPStore()
  const { addXP } = useUserStore()
  const activePersonaId = usePersonaStore(s => s.activePersonaId)

  const date = today()
  const existing = getRitual(date, 'morning')

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    intention:    existing?.intention    || '',
    gratitude:    existing?.gratitude    || ['', '', ''],
    tasks:        existing?.tasks        || [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }],
    feeling:      existing?.feeling      || '',
    affirmation:  existing?.affirmation  || '',
    energyLevel:  existing?.energyLevel  || 3,
  })

  const quote = quotes.find(q => q.id === todayQuoteId) || drawDailyQuote()
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const updateGratitude = (i, val) => {
    const g = [...form.gratitude]; g[i] = val; setF('gratitude', g)
  }
  const updateTask = (i, val) => {
    const t = [...form.tasks]; t[i] = { ...t[i], text: val }; setF('tasks', t)
  }
  const addTask = () => { if (form.tasks.length < 5) setF('tasks', [...form.tasks, { text: '', done: false }]) }
  const removeTask = (i) => setF('tasks', form.tasks.filter((_, idx) => idx !== i))

  const saveStep = () => saveMorning(date, form)

  const handleComplete = () => {
    const filledTasks = form.tasks.filter(t => t.text.trim())
    saveMorning(date, { ...form, tasks: filledTasks, completedAt: new Date().toISOString() })
    logXP({ action: 'MORNING_RITUAL', xp: 30, moduleOrigin: 'spiritual', personaId: activePersonaId, radarAxis: 'disciplina' })
    addXP(30)
    toast.success('Ritual da manhã completo! +30 XP 🌅')
    onComplete?.()
  }

  const STEPS = [
    { label: 'Intenção', icon: '🎯' },
    { label: 'Gratidão', icon: '🙏' },
    { label: 'Tarefas',  icon: '✅' },
    { label: 'Energia',  icon: '⚡' },
  ]

  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="px-4 pt-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-main">🌅 Ritual da Manhã</h2>
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

        {/* Step 1 — Intenção */}
        {step === 1 && (
          <>
            {quote && (
              <div className="rounded-2xl p-4" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}33` }}>
                <p className="text-sm italic text-text-main leading-relaxed">"{quote.text}"</p>
                {quote.author && <p className="text-xs text-text-dim mt-1.5 text-right">— {quote.author}</p>}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">🎯 Intenção do dia</label>
              <textarea rows={3} className={`${inp} resize-none`} style={inpSt}
                placeholder="Hoje eu vou focar em..." autoFocus
                value={form.intention} onChange={e => setF('intention', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">⚡ Como quero me sentir hoje?</label>
              <div className="flex flex-wrap gap-2">
                {DAY_FEELINGS.map(f => (
                  <button key={f.id} onClick={() => setF('feeling', form.feeling === f.id ? '' : f.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={{ borderColor: form.feeling === f.id ? ACCENT : 'var(--border)', background: form.feeling === f.id ? ACCENT + '22' : 'transparent', color: form.feeling === f.id ? ACCENT : 'var(--text-muted)' }}>
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">✨ Afirmação / Versículo pessoal</label>
              <textarea rows={2} className={`${inp} resize-none`} style={inpSt}
                placeholder="Escreva ou cole uma afirmação..."
                value={form.affirmation} onChange={e => setF('affirmation', e.target.value)} />
            </div>
          </>
        )}

        {/* Step 2 — Gratidão */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-text-dim">Pelo que você é grato hoje? Seja específico.</p>
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-2"
                  style={{ background: ACCENT + '22', color: ACCENT }}>
                  {i + 1}
                </div>
                <textarea rows={2} className={`${inp} flex-1 resize-none`} style={inpSt}
                  placeholder={['Sou grato por...', 'Fico feliz quando...', 'Agradeço por...'][i]}
                  value={form.gratitude[i]} onChange={e => updateGratitude(i, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {/* Step 3 — Tarefas */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-text-dim">Quais as tarefas mais importantes de hoje? (máx. 5)</p>
            {form.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'var(--bg-surface-2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                  {i + 1}
                </div>
                <input className={`${inp} flex-1`} style={inpSt}
                  placeholder={`Tarefa ${i + 1}...`}
                  value={task.text} onChange={e => updateTask(i, e.target.value)} />
                {form.tasks.length > 1 && (
                  <button onClick={() => removeTask(i)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 text-xs">✕</button>
                )}
              </div>
            ))}
            {form.tasks.length < 5 && (
              <button onClick={addTask}
                className="w-full py-2.5 rounded-xl text-xs font-semibold border transition-all"
                style={{ borderColor: `${ACCENT}44`, color: ACCENT, background: `${ACCENT}0a` }}>
                + Adicionar tarefa
              </button>
            )}
          </div>
        )}

        {/* Step 4 — Energia */}
        {step === 4 && (
          <div className="space-y-6 py-2">
            <div className="text-center">
              <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-6">Como você está acordando hoje?</p>
              <div className="flex justify-center gap-3">
                {ENERGY_LEVELS.map(e => (
                  <button key={e.value} onClick={() => setF('energyLevel', e.value)}
                    className="flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all"
                    style={{
                      borderColor: form.energyLevel === e.value ? ACCENT : 'var(--border)',
                      background: form.energyLevel === e.value ? ACCENT + '22' : 'var(--bg-surface)',
                      transform: form.energyLevel === e.value ? 'scale(1.1)' : 'scale(1)',
                    }}>
                    <span className="text-3xl">{e.emoji}</span>
                    <span className="text-xs text-text-dim">{e.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Resumo</p>
              {form.intention && <p className="text-sm text-text-muted">🎯 {form.intention}</p>}
              {form.feeling && <p className="text-sm text-text-muted">⚡ Quero me sentir {DAY_FEELINGS.find(f => f.id === form.feeling)?.label}</p>}
              <p className="text-sm text-text-muted">🙏 {form.gratitude.filter(g => g.trim()).length}/3 itens de gratidão</p>
              <p className="text-sm text-text-muted">✅ {form.tasks.filter(t => t.text.trim()).length} tarefas planejadas</p>
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
            ✓ Completar — +30 XP
          </button>
        )}
      </div>
    </div>
  )
}
