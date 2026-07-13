import { useState } from 'react'
import { useRelationshipStore } from '../../../stores/useRelationshipStore'
import {
  CATEGORIES, LOVE_LANGUAGES, ATTACHMENT_TYPES, MBTI_TYPES, INTEREST_TAGS, BADGES
} from '../algorithms/relationshipAlgorithms'
import toast from 'react-hot-toast'

const ACCENT = '#8B5CF6'

export function PersonFormModal({ person = null, onClose }) {
  const { addPerson, updatePerson } = useRelationshipStore()
  const [step, setStep] = useState(1) // 1=básico 2=perfil 3=interesses
  const [form, setForm] = useState({
    name:              person?.name              || '',
    nickname:          person?.nickname          || '',
    categoryId:        person?.categoryId        || 'friend',
    birthday:          person?.birthday          || '',
    city:              person?.city              || '',
    contactPref:       person?.contactPref       || '',
    loveLanguage:      person?.loveLanguage      || '',
    attachmentType:    person?.attachmentType    || '',
    mbti:              person?.mbti              || '',
    introvertExtrovert:person?.introvertExtrovert|| '',
    interests:         person?.interests         || [],
    notes:             person?.notes             || '',
    relationshipScore: person?.relationshipScore ?? 20,
    badges:            person?.badges            || [],
    customInterest:    '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleInterest = (tag) => {
    const has = form.interests.includes(tag)
    set('interests', has ? form.interests.filter(t => t !== tag) : [...form.interests, tag])
  }

  const addCustomInterest = () => {
    const val = form.customInterest.trim()
    if (!val || form.interests.includes(val)) return
    set('interests', [...form.interests, val])
    set('customInterest', '')
  }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return }
    const { customInterest, ...data } = form
    if (person) { updatePerson(person.id, data); toast.success('Pessoa atualizada!') }
    else { addPerson(data); toast.success('Pessoa adicionada!') }
    onClose()
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }
  const cat = CATEGORIES.find(c => c.id === form.categoryId)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="font-semibold text-text-main">{person ? 'Editar Pessoa' : 'Nova Pessoa'}</h3>
            <div className="flex gap-2 mt-2">
              {['Básico', 'Perfil', 'Interesses'].map((l, i) => (
                <button key={i} onClick={() => setStep(i + 1)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={{ background: step === i + 1 ? ACCENT : 'var(--bg-surface-2)', color: step === i + 1 ? '#fff' : 'var(--text-dim)' }}>
                  {i + 1}. {l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── STEP 1: BÁSICO ── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Nome *</label>
                  <input className={inp} style={inpSt} placeholder="Nome completo" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Apelido</label>
                  <input className={inp} style={inpSt} placeholder="Como chama?" value={form.nickname} onChange={e => set('nickname', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => set('categoryId', c.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
                      style={{ borderColor: form.categoryId === c.id ? c.color : 'var(--border)', background: form.categoryId === c.id ? c.color + '22' : 'transparent', color: form.categoryId === c.id ? c.color : 'var(--text-muted)' }}>
                      <span>{c.emoji}</span><span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Aniversário</label>
                  <input type="date" className={inp} style={inpSt} value={form.birthday} onChange={e => set('birthday', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Cidade</label>
                  <input className={inp} style={inpSt} placeholder="Porto Alegre..." value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Contato preferido</label>
                <input className={inp} style={inpSt} placeholder="WhatsApp, ligação, e-mail..." value={form.contactPref} onChange={e => set('contactPref', e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Pontuação inicial</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={100} value={form.relationshipScore}
                    onChange={e => set('relationshipScore', Number(e.target.value))}
                    className="flex-1" style={{ accentColor: ACCENT }} />
                  <span className="text-sm font-bold w-8 text-right" style={{ color: ACCENT }}>{form.relationshipScore}</span>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: PERFIL ── */}
          {step === 2 && (
            <>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">💬 Linguagem do Amor</label>
                <div className="space-y-2">
                  {LOVE_LANGUAGES.map(l => (
                    <button key={l.id} onClick={() => set('loveLanguage', form.loveLanguage === l.id ? '' : l.id)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{ borderColor: form.loveLanguage === l.id ? ACCENT : 'var(--border)', background: form.loveLanguage === l.id ? ACCENT + '18' : 'transparent' }}>
                      <span className="text-xl flex-shrink-0">{l.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: form.loveLanguage === l.id ? ACCENT : 'var(--text-main)' }}>{l.label}</div>
                        <div className="text-xs text-text-dim mt-0.5">{l.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">🔗 Tipo de Apego</label>
                <div className="grid grid-cols-2 gap-2">
                  {ATTACHMENT_TYPES.map(a => (
                    <button key={a.id} onClick={() => set('attachmentType', form.attachmentType === a.id ? '' : a.id)}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={{ borderColor: form.attachmentType === a.id ? ACCENT : 'var(--border)', background: form.attachmentType === a.id ? ACCENT + '18' : 'var(--bg-surface-2)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{a.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: form.attachmentType === a.id ? ACCENT : 'var(--text-main)' }}>{a.label}</span>
                      </div>
                      <div className="text-xs text-text-dim leading-relaxed">{a.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">🧠 MBTI</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {MBTI_TYPES.map(m => (
                    <button key={m} onClick={() => set('mbti', form.mbti === m ? '' : m)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                      style={{ borderColor: form.mbti === m ? ACCENT : 'var(--border)', background: form.mbti === m ? ACCENT + '22' : 'transparent', color: form.mbti === m ? ACCENT : 'var(--text-muted)' }}>
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {[{ id: 'introvert', label: 'Introvertido' }, { id: 'extrovert', label: 'Extrovertido' }].map(opt => (
                    <button key={opt.id} onClick={() => set('introvertExtrovert', form.introvertExtrovert === opt.id ? '' : opt.id)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                      style={{ borderColor: form.introvertExtrovert === opt.id ? ACCENT : 'var(--border)', background: form.introvertExtrovert === opt.id ? ACCENT + '22' : 'transparent', color: form.introvertExtrovert === opt.id ? ACCENT : 'var(--text-muted)' }}>
                      {opt.id === 'introvert' ? '🤫' : '⚡'} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">📝 Notas pessoais</label>
                <textarea rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={inpSt} placeholder="Contexto, situação atual, o que sabe sobre ela..."
                  value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </>
          )}

          {/* ── STEP 3: INTERESSES + BADGES ── */}
          {step === 3 && (
            <>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">🏷️ Interesses</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {INTEREST_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleInterest(tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                      style={{ borderColor: form.interests.includes(tag) ? ACCENT : 'var(--border)', background: form.interests.includes(tag) ? ACCENT + '22' : 'transparent', color: form.interests.includes(tag) ? ACCENT : 'var(--text-muted)' }}>
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={`${inp} flex-1`} style={inpSt} placeholder="+ interesse personalizado"
                    value={form.customInterest} onChange={e => set('customInterest', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomInterest()} />
                  <button onClick={addCustomInterest} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: ACCENT }}>+</button>
                </div>
                {form.interests.filter(t => !INTEREST_TAGS.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.interests.filter(t => !INTEREST_TAGS.includes(t)).map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ background: ACCENT + '22', color: ACCENT, border: `1px solid ${ACCENT}44` }}>
                        {tag}
                        <button onClick={() => toggleInterest(tag)} className="hover:opacity-70">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">🏅 Badges manuais</label>
                <div className="grid grid-cols-2 gap-2">
                  {BADGES.filter(b => !['birthday_star', 'streak_30', 'soul_mate', 'cooling'].includes(b.id)).map(badge => (
                    <button key={badge.id}
                      onClick={() => {
                        const has = form.badges.includes(badge.id)
                        set('badges', has ? form.badges.filter(b => b !== badge.id) : [...form.badges, badge.id])
                      }}
                      className="flex items-start gap-2 p-3 rounded-xl border text-left transition-all"
                      style={{ borderColor: form.badges.includes(badge.id) ? ACCENT : 'var(--border)', background: form.badges.includes(badge.id) ? ACCENT + '15' : 'var(--bg-surface-2)' }}>
                      <span className="text-lg flex-shrink-0">{badge.emoji}</span>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: form.badges.includes(badge.id) ? ACCENT : 'var(--text-main)' }}>{badge.label}</div>
                        <div className="text-xs text-text-dim">{badge.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>← Anterior</button>
            : <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
          }
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: ACCENT }}>Próximo →</button>
            : <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: ACCENT }}>
                {person ? '✓ Salvar' : '+ Adicionar'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
