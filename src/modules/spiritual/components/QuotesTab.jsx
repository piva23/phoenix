import { useState } from 'react'
import { useSpiritualStore, QUOTE_CATEGORIES } from '../../../stores/useSpiritualStore'
import toast from 'react-hot-toast'

const ACCENT = '#A855F7'

export function QuotesTab() {
  const { quotes, addQuote, updateQuote, deleteQuote, toggleFavoriteQuote, drawDailyQuote, todayQuoteId } = useSpiritualStore()
  const [filterCat, setFilterCat] = useState('')
  const [filterFav, setFilterFav] = useState(false)
  const [formOpen,  setFormOpen]  = useState(false)
  const [editQuote, setEditQuote] = useState(null)
  const [form, setForm] = useState({ text: '', author: '', category: 'foco' })

  const todayQuote = quotes.find(q => q.id === todayQuoteId)

  const filtered = quotes.filter(q => {
    if (filterFav && !q.favorite) return false
    if (filterCat && q.category !== filterCat) return false
    return true
  })

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.text.trim()) { toast.error('Texto obrigatório'); return }
    if (editQuote) { updateQuote(editQuote.id, form); toast.success('Citação atualizada!') }
    else { addQuote(form); toast.success('Citação salva!') }
    setForm({ text: '', author: '', category: 'foco' })
    setFormOpen(false)
    setEditQuote(null)
  }

  const startEdit = (q) => {
    setEditQuote(q)
    setForm({ text: q.text, author: q.author, category: q.category })
    setFormOpen(true)
  }

  const inp   = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }

  return (
    <div className="space-y-4">
      {/* Citação do dia */}
      {todayQuote && (
        <div className="rounded-2xl p-5" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}33` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>✨ Citação do dia</p>
          <p className="text-base italic text-text-main leading-relaxed">"{todayQuote.text}"</p>
          {todayQuote.author && <p className="text-xs text-text-dim mt-2 text-right">— {todayQuote.author}</p>}
          <button onClick={() => { drawDailyQuote(); toast('Nova citação sorteada! 🎲') }}
            className="mt-3 text-xs font-semibold hover:opacity-80" style={{ color: ACCENT }}>
            🎲 Sortear outra
          </button>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterFav(f => !f)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
            style={{ borderColor: filterFav ? '#F59E0B' : 'var(--border)', background: filterFav ? '#F59E0B22' : 'transparent', color: filterFav ? '#F59E0B' : 'var(--text-muted)' }}>
            ⭐ Favoritas
          </button>
          {QUOTE_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilterCat(filterCat === c.id ? '' : c.id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{ borderColor: filterCat === c.id ? c.color : 'var(--border)', background: filterCat === c.id ? c.color + '22' : 'transparent', color: filterCat === c.id ? c.color : 'var(--text-muted)' }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditQuote(null); setForm({ text: '', author: '', category: 'foco' }); setFormOpen(true) }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: ACCENT }}>
          + Citação
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">📿</div>
          <p className="text-text-muted font-semibold">Nenhuma citação</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const cat = QUOTE_CATEGORIES.find(c => c.id === q.category)
            return (
              <div key={q.id} className="rounded-2xl p-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm italic text-text-main leading-relaxed flex-1">"{q.text}"</p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleFavoriteQuote(q.id)}
                      className="w-7 h-7 flex items-center justify-center text-sm"
                      style={{ color: q.favorite ? '#F59E0B' : 'var(--text-dim)' }}>
                      {q.favorite ? '⭐' : '☆'}
                    </button>
                    <button onClick={() => startEdit(q)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-muted hover:bg-white/8 text-xs">
                      ✎
                    </button>
                    <button onClick={() => { if (window.confirm('Excluir?')) deleteQuote(q.id) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs">
                      ✕
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {q.author && <p className="text-xs text-text-dim">— {q.author}</p>}
                  {cat && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: cat.color + '22', color: cat.color }}>
                      {cat.emoji} {cat.label}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
          onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-text-main">{editQuote ? 'Editar Citação' : 'Nova Citação'}</h3>
              <button onClick={() => setFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Texto *</label>
                <textarea rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={inpSt}
                  placeholder="Digite a citação, versículo ou afirmação..."
                  value={form.text} onChange={e => setF('text', e.target.value)} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Autor / Fonte</label>
                  <input className={inp} style={inpSt} placeholder="Filipenses 4:13..."
                    value={form.author} onChange={e => setF('author', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Categoria</label>
                  <select className={inp} style={inpSt} value={form.category} onChange={e => setF('category', e.target.value)}>
                    {QUOTE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setFormOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5"
                style={{ borderColor: 'var(--border)' }}>
                Cancelar
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                style={{ background: ACCENT }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
