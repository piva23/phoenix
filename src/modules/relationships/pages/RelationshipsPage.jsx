import { useState, useEffect, useMemo } from 'react'
import { useRelationshipStore } from '../../../stores/useRelationshipStore'
import { CATEGORIES, getLevel, getLevelColor } from '../algorithms/relationshipAlgorithms'
import { PersonCard } from '../components/PersonCard'
import { PersonProfileView } from '../views/PersonProfileView'
import { PersonFormModal } from '../components/PersonFormModal'
import { MeetingMode } from '../components/MeetingMode'
import { RelationshipAnalyticsView } from '../views/RelationshipAnalyticsView'
import { SocialRadarView } from '../views/SocialRadarView'

const ACCENT = '#8B5CF6'

export function RelationshipsPage() {
  const { people, applyAllDecays } = useRelationshipStore()
  const [tab, setTab]           = useState('people')   // people | radar | analytics
  const [selected, setSelected] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [meetOpen, setMeetOpen] = useState(false)
  const [search, setSearch]     = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [sortBy, setSortBy]     = useState('score') // score | name | recent

  // Aplicar decaimento automático ao abrir o módulo
  useEffect(() => { applyAllDecays() }, [])

  const filtered = useMemo(() => {
    let list = [...people]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.nickname || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q)
      )
    }
    if (filterCat) list = list.filter(p => p.categoryId === filterCat)
    if (sortBy === 'score')  list.sort((a, b) => b.relationshipScore - a.relationshipScore)
    if (sortBy === 'name')   list.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'recent') list.sort((a, b) => (b.lastInteraction || '').localeCompare(a.lastInteraction || ''))
    return list
  }, [people, search, filterCat, sortBy])

  // Página de detalhe
  if (selected) return (
    <PersonProfileView
      person={selected}
      onBack={() => setSelected(null)} />
  )

  const inpSt = { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Relacionamentos</h1>
            <p className="text-xs text-text-dim mt-0.5">{people.length} pessoa{people.length !== 1 ? 's' : ''} cadastrada{people.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMeetOpen(true)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: `${ACCENT}44`, color: ACCENT, background: `${ACCENT}0f` }}>
              🎯 Encontro
            </button>
            <button onClick={() => setFormOpen(true)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
              style={{ background: ACCENT }}>
              + Pessoa
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--bg-surface)' }}>
          {[
            ['people', '👥 Pessoas'], 
            ['radar', '📡 Radar Social'], 
            ['analytics', '📊 Analytics']
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: tab === id ? ACCENT : 'transparent', color: tab === id ? '#fff' : 'var(--text-muted)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-4">
        {/* ── TAB PESSOAS ── */}
        {tab === 'people' && (
          <>
            {/* Busca + filtros */}
            <div className="space-y-2">
              <input
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inpSt}
                placeholder="🔍 Buscar por nome, apelido ou cidade..."
                value={search} onChange={e => setSearch(e.target.value)} />

              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button onClick={() => setFilterCat('')}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{ borderColor: !filterCat ? ACCENT : 'var(--border)', background: !filterCat ? ACCENT + '22' : 'transparent', color: !filterCat ? ACCENT : 'var(--text-muted)' }}>
                  Todos
                </button>
                {CATEGORIES.filter(c => people.some(p => p.categoryId === c.id)).map(cat => (
                  <button key={cat.id} onClick={() => setFilterCat(filterCat === cat.id ? '' : cat.id)}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap"
                    style={{ borderColor: filterCat === cat.id ? cat.color : 'var(--border)', background: filterCat === cat.id ? cat.color + '22' : 'transparent', color: filterCat === cat.id ? cat.color : 'var(--text-muted)' }}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <select className="px-3 py-1.5 rounded-xl text-xs outline-none"
                   style={{ ...inpSt, border: '1px solid var(--border)' }}
                  value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="score">Ordenar: Pontuação</option>
                  <option value="name">Ordenar: Nome</option>
                  <option value="recent">Ordenar: Recente</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 && people.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="text-5xl mb-4 opacity-30">👥</div>
                <p className="font-semibold text-text-muted mb-2">Nenhuma pessoa ainda</p>
                <p className="text-sm text-text-dim mb-5">Adicione as pessoas importantes da sua vida.</p>
                <button onClick={() => setFormOpen(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: ACCENT }}>
                  + Adicionar primeira pessoa
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="text-3xl mb-2 opacity-30">🔍</div>
                <p className="text-text-muted">Nenhuma pessoa encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(p => (
                  <PersonCard key={p.id} person={p} onClick={() => setSelected(p)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB RADAR ── */}
        {tab === 'radar' && (
          <SocialRadarView onSelectPerson={p => setSelected(p)} />
        )}

        {/* ── TAB ANALYTICS ── */}
        {tab === 'analytics' && (
          <RelationshipAnalyticsView onSelectPerson={p => { setSelected(p); setTab('people') }} />
        )}
      </div>

      {formOpen && <PersonFormModal onClose={() => setFormOpen(false)} />}
      {meetOpen && <MeetingMode onClose={() => setMeetOpen(false)} />}
    </div>
  )
}
