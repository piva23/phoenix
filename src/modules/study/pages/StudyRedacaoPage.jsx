import { useState } from 'react'
import { StudyLayout } from '../components/StudyLayout'
import { useRedacaoStore } from '../../../stores/useRedacaoStore'
import { useXPStore } from '../../../stores/useXPStore'
import { useUserStore } from '../../../stores/useUserStore'
import { usePersonaStore } from '../../../stores/usePersonaStore'
import { XP_RULES } from '../../../shared/constants/xpRules'
import { formatDateBR } from '../../../shared/utils/time'
import toast from 'react-hot-toast'

function countWords(text) { return text?.trim() ? text.trim().split(/\s+/).length : 0 }
function countLines(text) { return text?.trim() ? text.trim().split('\n').filter(l => l.trim()).length : 0 }

function PartesCustomModal({ onClose }) {
  const { partesTemplate, updatePartesTemplate, resetPartesTemplate } = useRedacaoStore()
  const [partes, setPartes] = useState([...partesTemplate])

  const updatePart = (i, field, val) => setPartes(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
  const addPart = () => setPartes(p => [...p, { key: `parte_${Date.now()}`, label: 'Nova Parte', desc: '', target: 5 }])
  const removePart = (i) => setPartes(p => p.filter((_, idx) => idx !== i))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-text-main">Customizar Partes da Redação</h3>
          <button onClick={onClose} className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {partes.map((p, i) => (
            <div key={i} className="rounded-xl p-3 border space-y-2" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
              <div className="flex gap-2">
                <input className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                  value={p.label} onChange={e => updatePart(i, 'label', e.target.value)} placeholder="Nome da parte" />
                <input type="number" className="w-16 px-2 py-1.5 rounded-lg text-sm outline-none text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                  value={p.target} onChange={e => updatePart(i, 'target', Number(e.target.value))} title="Meta de linhas" />
                <button onClick={() => removePart(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 text-xs flex-shrink-0">✕</button>
              </div>
              <input className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
                value={p.desc} onChange={e => updatePart(i, 'desc', e.target.value)} placeholder="Descrição (opcional)" />
            </div>
          ))}
          <button onClick={addPart} className="w-full py-2 rounded-xl text-xs font-semibold border" style={{ borderColor: 'var(--primary)44', color: 'var(--primary)', background: 'var(--primary)0f' }}>+ Adicionar Parte</button>
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => { resetPartesTemplate(); onClose() }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Restaurar Padrão</button>
          <button onClick={() => { if (partes.length > 0) { updatePartesTemplate(partes); onClose() } }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
      </div>
    </div>
  )
}

export function StudyRedacaoPage() {
  const { themes, redacoes, partesTemplate, addRedacao, updateRedacao, deleteRedacao, sortearTema, addTheme, deleteTheme, updateAnotacao } = useRedacaoStore()
  const { logXP } = useXPStore()
  const { addXP } = useUserStore()
  const activePersonaId = usePersonaStore(s => s.activePersonaId)

  const [view, setView] = useState('list')
  const [activeRedacao, setActiveRedacao] = useState(null)
  const [activeParte, setActiveParte] = useState(partesTemplate[0]?.key)
  const [temaModal, setTemaModal] = useState(false)
  const [newTema, setNewTema] = useState({ titulo: '', categoria: '', fonte: '' })
  const [partesModal, setPartesModal] = useState(false)
  const [showAnotacao, setShowAnotacao] = useState(false)

  const newRedacao = (tema) => {
    addRedacao({ themeId: tema?.id || null, themeTitulo: tema?.titulo || 'Tema livre' })
    const partesIniciais = {}
    partesTemplate.forEach(p => { partesIniciais[p.key] = '' })
    const r = { themeId: tema?.id || null, themeTitulo: tema?.titulo || 'Tema livre', id: `red_${Date.now()}`, partes: partesIniciais, anotacoes: {}, status: 'rascunho', createdAt: Date.now(), updatedAt: Date.now() }
    setActiveRedacao(r)
    setActiveParte(partesTemplate[0]?.key)
    setView('editor')
  }

  const updateParte = (key, value) => {
    const updated = { ...activeRedacao, partes: { ...activeRedacao.partes, [key]: value }, updatedAt: Date.now() }
    setActiveRedacao(updated)
    updateRedacao(updated.id, { partes: updated.partes, updatedAt: updated.updatedAt })
  }

  const updateAnotacaoLocal = (key, value) => {
    const updated = { ...activeRedacao, anotacoes: { ...(activeRedacao.anotacoes || {}), [key]: value } }
    setActiveRedacao(updated)
    updateAnotacao(activeRedacao.id, key, value)
  }

  const finalize = () => {
    const totalWords = Object.values(activeRedacao.partes).reduce((a, t) => a + countWords(t), 0)
    updateRedacao(activeRedacao.id, { status: 'concluida', wordCount: totalWords })
    const xp = XP_RULES.REDACAO_CREATED.xp
    logXP({ action: 'REDACAO_CREATED', xp, moduleOrigin: 'study', personaId: activePersonaId, radarAxis: 'conhecimento' })
    addXP(xp)
    toast.success(`Redação concluída! +${xp} XP`)
    setView('list')
  }

  const exportPDF = () => {
    const partesHtml = partesTemplate.map(p => `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #333; margin-bottom: 8px;">${p.label}</h3>
        <p style="font-size: 13px; line-height: 1.8; color: #111; white-space: pre-wrap;">${(activeRedacao.partes[p.key] || '').replace(/</g, '&lt;')}</p>
      </div>
    `).join('')
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>${activeRedacao.themeTitulo}</title>
      <style>
        body { font-family: Georgia, serif; padding: 40px; max-width: 700px; margin: 0 auto; }
        h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 24px; }
        @media print { body { padding: 20px; } }
      </style></head>
      <body>
        <h1>${activeRedacao.themeTitulo}</h1>
        ${partesHtml}
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const ta = 'w-full px-4 py-4 rounded-xl text-sm outline-none resize-none leading-loose'
  const taStyle = { background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)', fontFamily: 'Georgia, serif' }

  if (view === 'editor' && activeRedacao) {
    const parte = partesTemplate.find(p => p.key === activeParte)
    const words = countWords(activeRedacao.partes[activeParte] || '')
    const lines = countLines(activeRedacao.partes[activeParte] || '')
    const totalWords = Object.values(activeRedacao.partes).reduce((a, t) => a + countWords(t), 0)

    return (
      <StudyLayout>
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <button onClick={() => setView('list')} className="text-sm text-text-muted hover:text-text-main">← Voltar</button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-text-main text-sm truncate">{activeRedacao.themeTitulo}</h2>
            <p className="text-xs text-text-dim">Total: {totalWords} palavras</p>
          </div>
          <button onClick={() => setPartesModal(true)} className="px-3 py-2 rounded-xl text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>⚙ Partes</button>
          <button onClick={exportPDF} className="px-3 py-2 rounded-xl text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>📄 Exportar PDF</button>
          <button onClick={finalize} className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: '#10B981' }}>✓ Finalizar</button>
        </div>

        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
          {partesTemplate.map(p => {
            const w = countWords(activeRedacao.partes[p.key] || '')
            const done = w >= (p.target * 5) // estimativa palavras por linha
            return (
              <button key={p.key} onClick={() => setActiveParte(p.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border"
                style={{ borderColor: activeParte === p.key ? 'var(--primary)' : 'var(--border)', background: activeParte === p.key ? 'var(--primary)22' : 'transparent', color: activeParte === p.key ? 'var(--primary)' : 'var(--text-muted)' }}>
                {done && <span className="text-green-400">✓</span>}
                {p.label}
                <span className="opacity-60">{w}w</span>
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div>
              <div className="font-semibold text-sm text-text-main">{parte?.label}</div>
              <div className="text-xs text-text-dim mt-0.5">{parte?.desc}</div>
            </div>
            <button onClick={() => setShowAnotacao(v => !v)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: showAnotacao ? 'var(--primary)18' : 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)33' }}>
              💬 Correção
            </button>
          </div>
          <div className="p-4">
            <textarea className={ta} style={taStyle} rows={12}
              placeholder={`Digite sua ${parte?.label?.toLowerCase()}...`}
              value={activeRedacao.partes[activeParte] || ''}
              onChange={e => updateParte(activeParte, e.target.value)} />
            <div className="flex justify-between text-xs text-text-dim mt-2">
              <span>{words} palavras · {lines} linhas</span>
              <span style={{ color: lines >= parte?.target ? '#10B981' : 'var(--text-dim)' }}>Meta: {parte?.target} linhas</span>
            </div>

            {showAnotacao && (
              <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: '#F59E0B' }}>📝 Anotação de Correção</label>
                <textarea rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                  placeholder="Observações do corretor sobre esta parte..."
                  value={activeRedacao.anotacoes?.[activeParte] || ''}
                  onChange={e => updateAnotacaoLocal(activeParte, e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {partesModal && <PartesCustomModal onClose={() => setPartesModal(false)} />}
      </StudyLayout>
    )
  }

  return (
    <StudyLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-semibold text-text-main">Redação</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setPartesModal(true)} className="px-3 py-2.5 rounded-xl text-sm font-medium border transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>⚙ Partes</button>
          <button onClick={() => setView(view === 'temas' ? 'list' : 'temas')} className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-all" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-surface)' }}>📋 Banco de Temas</button>
          <button onClick={() => { const t = sortearTema(); if (t) newRedacao(t) }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>🎲 Sortear Tema</button>
          <button onClick={() => newRedacao(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all" style={{ borderColor: 'var(--primary)44', color: 'var(--primary)', background: 'var(--primary)0f' }}>+ Tema Livre</button>
        </div>
      </div>

      {view === 'temas' ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-muted">{themes.length} temas cadastrados</h3>
            <button onClick={() => setTemaModal(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'var(--primary)18', color: 'var(--primary)', border: '1px solid var(--primary)33' }}>+ Adicionar Tema</button>
          </div>
          <div className="space-y-2">
            {themes.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-main">{t.titulo}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-text-dim">{t.categoria}</span>
                    {t.fonte && <><span className="text-text-dim">·</span><span className="text-xs text-text-dim">{t.fonte}</span></>}
                  </div>
                </div>
                <button onClick={() => newRedacao(t)} className="text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap" style={{ background: 'var(--primary)18', color: 'var(--primary)', border: '1px solid var(--primary)33' }}>Usar tema →</button>
                {!t.padrao && <button onClick={() => deleteTheme(t.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 text-xs">✕</button>}
              </div>
            ))}
          </div>
        </div>
      ) : redacoes.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3 opacity-30">✍️</div>
          <p className="font-semibold text-text-muted mb-1">Nenhuma redação ainda</p>
          <p className="text-sm text-text-dim mb-5">Sorteie um tema ou escreva com tema livre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...redacoes].sort((a, b) => b.createdAt - a.createdAt).map(r => {
            const totalWords = Object.values(r.partes || {}).reduce((a, t) => a + countWords(t), 0)
            const hasAnotacoes = Object.values(r.anotacoes || {}).some(a => a?.trim())
            return (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-[var(--primary)] cursor-pointer" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                onClick={() => { setActiveRedacao(r); setActiveParte(partesTemplate[0]?.key); setView('editor') }}>
                <div className="text-2xl">{r.status === 'concluida' ? '✅' : '📝'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-main truncate">{r.themeTitulo}</p>
                  <p className="text-xs text-text-dim">{formatDateBR(new Date(r.createdAt).toISOString().split('T')[0])} · {totalWords} palavras{hasAnotacoes ? ' · 💬 com correção' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: r.status === 'concluida' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: r.status === 'concluida' ? '#10B981' : '#F59E0B' }}>
                    {r.status === 'concluida' ? 'Concluída' : 'Rascunho'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); if (window.confirm('Excluir redação?')) deleteRedacao(r.id) }} className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {temaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} onClick={() => setTemaModal(false)}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-text-main">Adicionar Tema</h3>
              <button onClick={() => setTemaModal(false)} className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
            </div>
            <div className="p-5 space-y-3">
              {[['titulo', 'Tema *', 'Ex: A reforma tributária...'], ['categoria', 'Categoria', 'Direito Administrativo...'], ['fonte', 'Fonte', 'TJRS, ENEM...']].map(([k, l, p]) => (
                <div key={k}><label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">{l}</label>
                  <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-main)' }} placeholder={p} value={newTema[k]} onChange={e => setNewTema(f => ({ ...f, [k]: e.target.value }))} /></div>
              ))}
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setTemaModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>Cancelar</button>
              <button onClick={() => { if (newTema.titulo.trim()) { addTheme(newTema); setNewTema({ titulo: '', categoria: '', fonte: '' }); setTemaModal(false) } }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: 'var(--primary)' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {partesModal && <PartesCustomModal onClose={() => setPartesModal(false)} />}
    </StudyLayout>
  )
}
