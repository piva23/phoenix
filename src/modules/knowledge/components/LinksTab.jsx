import { useState, useMemo } from 'react'
import { useKnowledgeStore } from '../../../stores/useKnowledgeStore'
import toast from 'react-hot-toast'

const ACCENT = '#38BDF8'

function LinkFormModal({ link = null, onClose }) {
  const { addLink, updateLink, collections, getAllTags } = useKnowledgeStore()
  const allTags = getAllTags()
  const [form, setForm] = useState({
    title:        link?.title        || '',
    url:          link?.url          || '',
    summary:      link?.summary      || '',
    collectionId: link?.collectionId || '',
    tags:         link?.tags         || [],
  })
  const [tagInput, setTagInput] = useState('')
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const val = tagInput.trim()
    if (!val || form.tags.includes(val)) return
    setF('tags', [...form.tags, val])
    setTagInput('')
  }

  const handleSave = () => {
    if (!form.url.trim()) { toast.error('URL obrigatória'); return }
    if (!form.title.trim()) setF('title', form.url)
    if (link) { updateLink(link.id, form); toast.success('Link atualizado!') }
    else { addLink(form); toast.success('Link salvo!') }
    onClose()
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none'
  const inpSt = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-text-main">{link ? 'Editar Link' : 'Salvar Link'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:bg-white/8">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">URL *</label>
            <input className={inp} style={inpSt} placeholder="https://..." value={form.url} onChange={e => setF('url', e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Título</label>
            <input className={inp} style={inpSt} placeholder="Nome do artigo ou site" value={form.title} onChange={e => setF('title', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Resumo</label>
            <textarea rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={inpSt}
              placeholder="O que este link contém? Por que salvar?"
              value={form.summary} onChange={e => setF('summary', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Coleção</label>
              <select className={inp} style={inpSt} value={form.collectionId} onChange={e => setF('collectionId', e.target.value)}>
                <option value="">Sem coleção</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Tags</label>
              <div className="flex gap-1">
                <input className="flex-1 px-2 py-2 rounded-xl text-xs outline-none" style={inpSt}
                  placeholder="+ tag" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  list="link-tag-suggestions" />
                <datalist id="link-tag-suggestions">
                  {allTags.filter(t => !form.tags.includes(t)).map(t => <option key={t} value={t} />)}
                </datalist>
                <button onClick={addTag} className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: ACCENT }}>+</button>
              </div>
            </div>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: ACCENT + '22', color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                  #{tag}
                  <button onClick={() => setF('tags', form.tags.filter(t => t !== tag))} className="hover:opacity-70">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: ACCENT }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

function getLinkIcon(url) {
  const u = url?.toLowerCase() || ''
  if (u.includes('youtube') || u.includes('youtu.be')) return '▶️'
  if (u.includes('github')) return '🐙'
  if (u.includes('twitter') || u.includes('x.com')) return '🐦'
  if (u.includes('linkedin')) return '💼'
  if (u.includes('reddit')) return '🤖'
  if (u.includes('medium')) return '✍️'
  if (u.includes('notion')) return '📋'
  if (u.includes('figma')) return '🎨'
  return '🔗'
}

export function LinksTab() {
  const { links, collections, deleteLink, toggleFavoriteLink, getAllTags } = useKnowledgeStore()
  const allTags = getAllTags()
  const [modal, setModal]       = useState(null) // null | 'new' | link obj
  const [search, setSearch]     = useState('')
  const [filterCol, setFilterCol] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterFav, setFilterFav] = useState(false)

  const colMap = Object.fromEntries(collections.map(c => [c.id, c]))

  const filtered = useMemo(() => {
    return links.filter(l => {
      if (filterFav && !l.favorite) return false
      if (filterCol && l.collectionId !== filterCol) return false
      if (filterTag && !(l.tags || []).includes(filterTag)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return l.title?.toLowerCase().includes(q) || l.url?.toLowerCase().includes(q) || l.summary?.toLowerCase().includes(q)
      }
      return true
    })
  }, [links, filterFav, filterCol, filterTag, search])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <input className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          placeholder="🔍 Buscar links..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={() => setModal('new')}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex-shrink-0"
          style={{ background: ACCENT }}>
          + Link
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilterFav(f => !f)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
          style={{ borderColor: filterFav ? '#F59E0B' : 'var(--border)', background: filterFav ? '#F59E0B22' : 'transparent', color: filterFav ? '#F59E0B' : 'var(--text-muted)' }}>
          ⭐ Favoritos
        </button>
        {collections.filter(c => links.some(l => l.collectionId === c.id)).map(col => (
          <button key={col.id} onClick={() => setFilterCol(filterCol === col.id ? '' : col.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap"
            style={{ borderColor: filterCol === col.id ? col.color : 'var(--border)', background: filterCol === col.id ? col.color + '22' : 'transparent', color: filterCol === col.id ? col.color : 'var(--text-muted)' }}>
            {col.emoji} {col.name}
          </button>
        ))}
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {allTags.filter(t => links.some(l => (l.tags || []).includes(t))).map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
              style={{ borderColor: filterTag === tag ? ACCENT : 'var(--border)', background: filterTag === tag ? ACCENT + '22' : 'transparent', color: filterTag === tag ? ACCENT : 'var(--text-dim)' }}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">🔗</div>
          <p className="font-semibold text-text-muted mb-1">Nenhum link salvo</p>
          <p className="text-sm text-text-dim mb-4">Salve artigos, vídeos e referências importantes.</p>
          <button onClick={() => setModal('new')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: ACCENT }}>
            + Salvar primeiro link
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(link => {
            const col = colMap[link.collectionId]
            return (
              <div key={link.id} className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="text-2xl flex-shrink-0 mt-0.5">{getLinkIcon(link.url)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <a href={link.url} target="_blank" rel="noreferrer"
                      className="text-sm font-semibold hover:underline text-text-main truncate">
                      {link.title || getDomain(link.url)}
                    </a>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => toggleFavoriteLink(link.id)}
                        className="w-6 h-6 flex items-center justify-center text-sm"
                        style={{ color: link.favorite ? '#F59E0B' : 'var(--text-dim)' }}>
                        {link.favorite ? '⭐' : '☆'}
                      </button>
                      <button onClick={() => setModal(link)}
                        className="w-6 h-6 flex items-center justify-center rounded text-text-dim hover:text-text-muted text-xs">
                        ✎
                      </button>
                      <button onClick={() => { if (window.confirm('Excluir link?')) deleteLink(link.id) }}
                        className="w-6 h-6 flex items-center justify-center rounded text-text-dim hover:text-red-400 text-xs">
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-dim mt-0.5">{getDomain(link.url)}</p>
                  {link.summary && <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{link.summary}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {col && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: col.color + '22', color: col.color }}>{col.emoji} {col.name}</span>}
                    {(link.tags || []).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-surface-2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <LinkFormModal link={modal === 'new' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
