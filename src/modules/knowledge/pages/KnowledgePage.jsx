import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useKnowledgeStore } from '../../../stores/useKnowledgeStore'
import { NoteEditor } from '../components/NoteEditor'
import { LinksTab } from '../components/LinksTab'
import { PDFReader } from '../components/PDFReader'
import toast from 'react-hot-toast'

const ACCENT = '#7C3AED'

// ── Coleções sidebar ──────────────────────────────────────────────────────────
function CollectionModal({ col = null, onClose }) {
  const { addCollection, updateCollection } = useKnowledgeStore()
  const [form, setForm] = useState({ name: col?.name || '', emoji: col?.emoji || '📁', color: col?.color || '#7C3AED' })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = () => {
    if (!form.name.trim()) return
    if (col) { updateCollection(col.id, form); toast.success('Coleção atualizada!') }
    else { addCollection(form); toast.success('Coleção criada!') }
    onClose()
  }
  const inp = 'px-3 py-2.5 rounded-xl text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-text-main">{col ? 'Editar Coleção' : 'Nova Coleção'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-3">
            <input className={`${inp} w-14 text-center text-xl`} style={inpSt} placeholder="📁" value={form.emoji} onChange={e => setF('emoji', e.target.value)} />
            <input className={`${inp} flex-1`} style={inpSt} placeholder="Nome da coleção" value={form.name} onChange={e => setF('name', e.target.value)} autoFocus />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-muted">Cor:</label>
            <input type="color" className="w-10 h-10 rounded-xl cursor-pointer" style={{ border: 'none' }}
              value={form.color} onChange={e => setF('color', e.target.value)} />
            <span className="text-xs text-text-dim">{form.color}</span>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: form.color || ACCENT }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ── Notes list ────────────────────────────────────────────────────────────────
function NotesList({ collectionId, onEdit, onNew }) {
  const { notes, collections, deleteNote, toggleFavoriteNote, getAllTags } = useKnowledgeStore()
  const allTags = getAllTags()
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterFav, setFilterFav] = useState(false)

  const colMap = Object.fromEntries(collections.map(c => [c.id, c]))
  const col    = colMap[collectionId]

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (collectionId && n.collectionId !== collectionId) return false
      if (filterFav && !n.favorite) return false
      if (filterTag && !(n.tags || []).includes(filterTag)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) || (n.tags || []).some(t => t.toLowerCase().includes(q))
      }
      return true
    }).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  }, [notes, collectionId, filterFav, filterTag, search])

  const tagsInScope = useMemo(() => {
    const s = new Set()
    notes.filter(n => !collectionId || n.collectionId === collectionId).forEach(n => (n.tags || []).forEach(t => s.add(t)))
    return [...s]
  }, [notes, collectionId])

  return (
    <div className="space-y-3">
      {/* Busca + novo */}
      <div className="flex gap-2">
        <input className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          placeholder="🔍 Buscar notas..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={onNew}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: col?.color || ACCENT }}>
          + Nota
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilterFav(f => !f)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
          style={{ borderColor: filterFav ? '#F59E0B' : 'var(--border)', background: filterFav ? '#F59E0B22' : 'transparent', color: filterFav ? '#F59E0B' : 'var(--text-muted)' }}>
          ⭐ Favoritas
        </button>
        {tagsInScope.map(tag => (
          <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-all"
            style={{ borderColor: filterTag === tag ? (col?.color || ACCENT) : 'var(--border)', background: filterTag === tag ? (col?.color || ACCENT) + '22' : 'transparent', color: filterTag === tag ? (col?.color || ACCENT) : 'var(--text-dim)' }}>
            #{tag}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">📝</div>
          <p className="font-semibold text-text-muted mb-1">Nenhuma nota</p>
          <button onClick={onNew} className="mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: col?.color || ACCENT }}>
            + Criar primeira nota
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(note => {
            const notCol = colMap[note.collectionId]
            const preview = note.content?.replace(/[#*`>\-]/g, '').slice(0, 120)
            return (
              <div key={note.id}
                className="p-4 rounded-2xl cursor-pointer hover:bg-white/3 transition-all"
                style={{ background: 'var(--bg-surface)', border: `1px solid ${notCol?.color ? notCol.color + '22' : 'var(--border)'}` }}
                onClick={() => onEdit(note)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notCol && <span className="text-sm">{notCol.emoji}</span>}
                      <h3 className="text-sm font-bold text-text-main truncate">{note.title || 'Sem título'}</h3>
                      {note.favorite && <span className="text-xs">⭐</span>}
                    </div>
                    {preview && <p className="text-xs text-text-dim leading-relaxed line-clamp-2">{preview}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-text-dim">{note.updatedAt}</span>
                      {(note.tags || []).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); toggleFavoriteNote(note.id) }}
                      className="w-7 h-7 flex items-center justify-center text-sm"
                      style={{ color: note.favorite ? '#F59E0B' : 'var(--text-dim)' }}>
                      {note.favorite ? '⭐' : '☆'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm('Excluir nota?')) deleteNote(note.id) }}
                      className="w-7 h-7 flex items-center justify-center rounded text-text-dim hover:text-red-400 text-xs">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export function KnowledgePage() {
  const { collections, notes, links, deleteCollection, search: doSearch } = useKnowledgeStore()
  const [tab, setTab]               = useState('notes')   // notes | links
  const [selCol, setSelCol]         = useState(null)       // null = todas
  const [editingNote, setEditingNote] = useState(null)     // null | note obj | 'new'
  const [colModal, setColModal]     = useState(null)       // null | 'new' | col obj
  const [globalSearch, setGlobalSearch] = useState('')

  // Busca global
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return null
    return doSearch(globalSearch)
  }, [globalSearch])

  // Editor de nota
  if (editingNote) return (
    <NoteEditor
      note={editingNote === 'new' ? null : editingNote}
      collectionId={selCol || ''}
      onClose={() => setEditingNote(null)}
      onSave={() => setEditingNote(null)} />
  )

  const col = collections.find(c => c.id === selCol)

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Conhecimento</h1>
            <p className="text-xs text-text-dim mt-0.5">{notes.length} notas · {links.length} links</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/knowledge/mental-models"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 flex items-center gap-1.5 shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              🧠 Modelos Mentais
            </Link>
          </div>
        </div>

        {/* Busca global */}
        <div className="mb-4">
          <input className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            placeholder="🔍 Busca global em notas e links..."
            value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
        </div>

        {/* Tabs */}
        {!globalSearch && (
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--bg-surface)' }}>
            {[
              ['notes', '📝 Notas'],
              ['links', '🔗 Links'],
              ['pdf', '📄 Leitor PDF'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: tab === id ? (col?.color || ACCENT) : 'transparent', color: tab === id ? '#fff' : 'var(--text-muted)' }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pb-4 space-y-4">
        {/* Busca global results */}
        {searchResults && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-muted">
                {searchResults.notes.length + searchResults.links.length} resultado{searchResults.notes.length + searchResults.links.length !== 1 ? 's' : ''} para "{globalSearch}"
              </p>
              <button onClick={() => setGlobalSearch('')} className="text-xs text-text-dim hover:text-text-muted">✕ Limpar</button>
            </div>
            {searchResults.notes.map(note => (
              <div key={note.id} className="p-3 rounded-xl cursor-pointer hover:bg-white/5"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                onClick={() => setEditingNote(note)}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">📝</span>
                  <span className="text-sm font-semibold text-text-main">{note.title}</span>
                </div>
                <p className="text-xs text-text-dim mt-1 line-clamp-1">{note.content?.replace(/[#*`>-]/g, '').slice(0, 100)}</p>
              </div>
            ))}
            {searchResults.links.map(link => (
              <div key={link.id} className="p-3 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔗</span>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-text-main hover:underline">{link.title || link.url}</a>
                </div>
                {link.summary && <p className="text-xs text-text-dim mt-1 line-clamp-1">{link.summary}</p>}
              </div>
            ))}
            {searchResults.notes.length === 0 && searchResults.links.length === 0 && (
              <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <p className="text-text-muted">Nenhum resultado encontrado</p>
              </div>
            )}
          </div>
        )}

        {/* Coleções e conteúdo dependendo da tab */}
        {!globalSearch && (
          <>
            {tab === 'pdf' ? (
              <PDFReader />
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Coleções</p>
                    <button onClick={() => setColModal('new')}
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={{ background: ACCENT + '18', color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                      + Coleção
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button onClick={() => setSelCol(null)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{ borderColor: !selCol ? ACCENT : 'var(--border)', background: !selCol ? ACCENT + '22' : 'transparent', color: !selCol ? ACCENT : 'var(--text-muted)' }}>
                      📋 Todas
                      <span className="opacity-60">({notes.length})</span>
                    </button>
                    {collections.map(c => {
                      const count = notes.filter(n => n.collectionId === c.id).length
                      return (
                        <button key={c.id}
                          onClick={() => setSelCol(selCol === c.id ? null : c.id)}
                          onContextMenu={e => { e.preventDefault(); setColModal(c) }}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all group"
                          style={{ borderColor: selCol === c.id ? c.color : 'var(--border)', background: selCol === c.id ? c.color + '22' : 'var(--bg-surface)', color: selCol === c.id ? c.color : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {c.emoji} {c.name}
                          <span className="opacity-60">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-text-dim mt-1">Clique direito em uma coleção para editar</p>
                </div>

                {tab === 'notes' && (
                  <NotesList
                    collectionId={selCol}
                    onEdit={setEditingNote}
                    onNew={() => setEditingNote('new')} />
                )}

                {tab === 'links' && <LinksTab />}
              </>
            )}
          </>
        )}
      </div>

      {colModal && <CollectionModal col={colModal === 'new' ? null : colModal} onClose={() => setColModal(null)} />}
    </div>
  )
}
