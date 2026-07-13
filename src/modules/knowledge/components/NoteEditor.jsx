import { useState, useCallback } from 'react'
import { useKnowledgeStore } from '../../../stores/useKnowledgeStore'
import toast from 'react-hot-toast'

// ── Markdown renderer simples ─────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;margin:1rem 0 0.5rem;color:var(--text-main)">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:1.1rem;font-weight:700;margin:1.2rem 0 0.5rem;color:var(--text-main)">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:1.25rem;font-weight:800;margin:1.5rem 0 0.5rem;color:var(--text-main)">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/`(.+?)`/g,      '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.85em">$1</code>')
    .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--primary);padding-left:1rem;color:var(--text-muted);margin:0.5rem 0">$1</blockquote>')
    .replace(/^- (.+)$/gm,    '<li style="margin:0.25rem 0 0.25rem 1rem;list-style:disc">$1</li>')
    .replace(/^---$/gm,       '<hr style="border:none;border-top:1px solid var(--border);margin:1rem 0"/>')
    .replace(/\n/g, '<br/>')
}

const TOOLBAR = [
  { label: '# H1',  insert: '# ',    wrap: false },
  { label: '## H2', insert: '## ',   wrap: false },
  { label: 'B',     insert: '**',    wrap: true,  end: '**' },
  { label: 'I',     insert: '*',     wrap: true,  end: '*'  },
  { label: '`',     insert: '`',     wrap: true,  end: '`'  },
  { label: '>',     insert: '> ',    wrap: false },
  { label: '—',     insert: '\n---\n',wrap: false },
  { label: '•',     insert: '- ',    wrap: false },
]

export function NoteEditor({ note = null, collectionId = '', onClose, onSave }) {
  const { addNote, updateNote, collections, getAllTags } = useKnowledgeStore()
  const allTags = getAllTags()

  const [form, setForm] = useState({
    title:        note?.title        || '',
    content:      note?.content      || '',
    collectionId: note?.collectionId || collectionId || '',
    tags:         note?.tags         || [],
  })
  const [mode, setMode]     = useState('edit') // edit | split | preview
  const [tagInput, setTagInput] = useState('')
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleInsert = useCallback((btn) => {
    const ta = document.getElementById('note-textarea')
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const sel   = form.content.slice(start, end)
    let newContent
    if (btn.wrap && sel) {
      newContent = form.content.slice(0, start) + btn.insert + sel + btn.end + form.content.slice(end)
    } else {
      newContent = form.content.slice(0, start) + btn.insert + form.content.slice(start)
    }
    setF('content', newContent)
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + btn.insert.length }, 10)
  }, [form.content])

  const addTag = () => {
    const val = tagInput.trim()
    if (!val || form.tags.includes(val)) return
    setF('tags', [...form.tags, val])
    setTagInput('')
  }

  const removeTag = (tag) => setF('tags', form.tags.filter(t => t !== tag))

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return }
    if (note) {
      updateNote(note.id, form)
      toast.success('Nota atualizada!')
    } else {
      addNote(form)
      toast.success('Nota salva!')
    }
    onSave?.()
    onClose()
  }

  const inp = 'px-3 py-2.5 rounded-xl text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }
  const col = collections.find(c => c.id === form.collectionId)

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-white/8">←</button>
        <input
          className="flex-1 text-base font-bold bg-transparent outline-none text-text-main"
          placeholder="Título da nota..."
          value={form.title} onChange={e => setF('title', e.target.value)} />
        <button onClick={handleSave}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: col?.color || 'var(--primary)' }}>
          ✓ Salvar
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 px-4 py-2 border-b flex-wrap" style={{ borderColor: 'var(--border)' }}>
        <select className={`${inp} text-xs`} style={inpSt} value={form.collectionId} onChange={e => setF('collectionId', e.target.value)}>
          <option value="">Sem coleção</option>
          {collections.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>

        <div className="flex items-center gap-2 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: (col?.color || '#7C3AED') + '22', color: col?.color || '#7C3AED', border: `1px solid ${(col?.color || '#7C3AED')}33` }}>
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:opacity-70 text-[10px]">✕</button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input className="px-2 py-1 rounded-lg text-xs outline-none w-24"
              style={inpSt} placeholder="+ tag"
              value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
              list="tag-suggestions" />
            <datalist id="tag-suggestions">
              {allTags.filter(t => !form.tags.includes(t)).map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        {/* View mode */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-surface-2)' }}>
          {[['edit','✎'],['split','⊞'],['preview','👁']].map(([m, icon]) => (
            <button key={m} onClick={() => setMode(m)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{ background: mode === m ? col?.color || 'var(--primary)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-dim)' }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      {mode !== 'preview' && (
        <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto scrollbar-hide"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          {TOOLBAR.map(btn => (
            <button key={btn.label} onClick={() => handleInsert(btn)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-text-muted hover:text-text-main hover:bg-white/8 flex-shrink-0 transition-all">
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor */}
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            id="note-textarea"
            className="flex-1 p-4 text-sm outline-none resize-none font-mono leading-relaxed"
            style={{ background: 'var(--bg-base)', color: 'var(--text-main)', minHeight: 400, borderRight: mode === 'split' ? '1px solid var(--border)' : 'none' }}
            placeholder="Comece a escrever em markdown...

# Título
## Subtítulo
**negrito** *itálico* `código`

- item da lista
> citação importante

---"
            value={form.content}
            onChange={e => setF('content', e.target.value)} />
        )}
        {/* Preview */}
        {(mode === 'preview' || mode === 'split') && (
          <div className="flex-1 p-4 overflow-y-auto prose-custom"
            style={{ maxWidth: mode === 'split' ? '50%' : '720px', margin: mode === 'preview' ? '0 auto' : undefined }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) || '<p style="color:var(--text-dim);font-style:italic">Nada para visualizar ainda...</p>' }} />
        )}
      </div>
    </div>
  )
}
