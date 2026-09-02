import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { StudyLayout } from '../components/StudyLayout'
import { BentoCard, SectionHeader, Badge } from '../components/BentoCard'
import { useRedacaoStore } from '../../../stores/useRedacaoStore'
import { useGameStore, XP_RULES } from '../../../stores/useGameStore'
import { formatDateBR } from '../../../shared/utils/time'

const countWords = (t) => t?.trim() ? t.trim().split(/\s+/).length : 0
const countLines = (t) => t?.trim() ? t.trim().split('\n').filter(l => l.trim()).length : 0

const fadeSlide = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.35 } }

function PartesModal({ onClose }) {
  const { partesTemplate, updatePartesTemplate, resetPartesTemplate } = useRedacaoStore()
  const [partes, setPartes] = useState([...partesTemplate])
  const upd = (i, f, v) => setPartes(p => p.map((x, idx) => idx === i ? { ...x, [f]: v } : x))

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-full max-w-lg rounded-2xl border overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh' }} onClick={e => e.stopPropagation()} {...fadeSlide}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="font-semibold text-white text-sm">Customizar Partes da Redação</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {partes.map((p, i) => (
            <div key={i} className="rounded-xl p-3 border border-white/8 space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex gap-2">
                <input className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none bg-white/5 border border-white/10 text-white" value={p.label} onChange={e => upd(i, 'label', e.target.value)} placeholder="Nome da parte" />
                <input type="number" className="w-16 px-2 py-1.5 rounded-lg text-sm outline-none text-center bg-white/5 border border-white/10 text-white text-center" value={p.target} onChange={e => upd(i, 'target', Number(e.target.value))} title="Meta de linhas" />
                <button onClick={() => setPartes(p => p.filter((_, idx) => idx !== i))} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 text-xs shrink-0 transition-colors">✕</button>
              </div>
              <input className="w-full px-2 py-1.5 rounded-lg text-xs outline-none bg-white/5 border border-white/10 text-white/60" value={p.desc} onChange={e => upd(i, 'desc', e.target.value)} placeholder="Descrição (opcional)" />
            </div>
          ))}
          <button onClick={() => setPartes(p => [...p, { key: `parte_${Date.now()}`, label: 'Nova Parte', desc: '', target: 5 }])} className="w-full py-2 rounded-xl text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition-colors">+ Adicionar Parte</button>
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={() => { resetPartesTemplate(); onClose() }} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 border border-white/10 hover:bg-white/5 transition-colors">Restaurar Padrão</button>
          <button onClick={() => { if (partes.length > 0) { updatePartesTemplate(partes); onClose() } }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity">Salvar</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function TemaModal({ onClose, onSave }) {
  const [newTema, setNewTema] = useState({ titulo: '', categoria: '', fonte: '' })
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-full max-w-md rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()} {...fadeSlide}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="font-semibold text-white text-sm">Adicionar Tema</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-3">
          {[['titulo', 'Tema *', 'Ex: A reforma tributária...'], ['categoria', 'Categoria', 'Direito Administrativo...'], ['fonte', 'Fonte', 'TJRS, ENEM...']].map(([k, l, p]) => (
            <div key={k}><label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-1.5">{l}</label>
              <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white placeholder-white/20" placeholder={p} value={newTema[k]} onChange={e => setNewTema(f => ({ ...f, [k]: e.target.value }))} /></div>
          ))}
        </div>
        <div className="flex gap-3 p-5 border-t border-white/10">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
          <button onClick={() => { if (newTema.titulo.trim()) { onSave(newTema); onClose() } }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity">Salvar</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function StudyRedacaoPage() {
  const { themes, redacoes, partesTemplate, addRedacao, updateRedacao, deleteRedacao, sortearTema, addTheme, deleteTheme, updateAnotacao } = useRedacaoStore()
  const { dispatchXP } = useGameStore()
  const [view, setView] = useState('list')
  const [activeRedacao, setActiveRedacao] = useState(null)
  const [activeParte, setActiveParte] = useState(partesTemplate[0]?.key)
  const [temaModal, setTemaModal] = useState(false)
  const [partesModal, setPartesModal] = useState(false)
  const [showAnotacao, setShowAnotacao] = useState(false)

  const newRedacao = (tema) => {
    const partesIniciais = {}
    partesTemplate.forEach(p => { partesIniciais[p.key] = '' })
    const r = { themeId: tema?.id || null, themeTitulo: tema?.titulo || 'Tema livre', id: `red_${Date.now()}`, partes: partesIniciais, anotacoes: {}, status: 'rascunho', createdAt: Date.now(), updatedAt: Date.now() }
    addRedacao(r)
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
    dispatchXP('study', XP_RULES.REDACAO_CREATED.xp, 'sabedoria', false, 'conhecimento')
    toast.success(`Redação concluída! +${XP_RULES.REDACAO_CREATED.xp} XP`)
    setView('list')
  }

  const exportPDF = () => {
    const partesHtml = partesTemplate.map(p => `<div style="margin-bottom:24px"><h3 style="font-size:14px;font-weight:700;color:#333;margin-bottom:8px">${p.label}</h3><p style="font-size:13px;line-height:1.8;color:#111;white-space:pre-wrap">${(activeRedacao.partes[p.key] || '').replace(/</g, '&lt;')}</p></div>`).join('')
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>${activeRedacao.themeTitulo}</title><style>body{font-family:Georgia,serif;padding:40px;max-width:700px;margin:0 auto}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:24px}@media print{body{padding:20px}}</style></head><body><h1>${activeRedacao.themeTitulo}</h1>${partesHtml}</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  if (view === 'editor' && activeRedacao) {
    const parte = partesTemplate.find(p => p.key === activeParte)
    const words = countWords(activeRedacao.partes[activeParte] || '')
    const lines = countLines(activeRedacao.partes[activeParte] || '')
    const totalWords = Object.values(activeRedacao.partes).reduce((a, t) => a + countWords(t), 0)

    return (
      <StudyLayout>
        <motion.div {...fadeSlide}>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <button onClick={() => setView('list')} className="text-sm text-white/50 hover:text-white/80 transition-colors">← Voltar</button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white text-sm truncate">{activeRedacao.themeTitulo}</h2>
              <p className="text-xs text-white/40">Total: {totalWords} palavras</p>
            </div>
            <button onClick={() => setPartesModal(true)} className="px-3 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80 transition-all">⚙ Partes</button>
            <button onClick={exportPDF} className="px-3 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80 transition-all">📄 Exportar PDF</button>
            <button onClick={finalize} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">✓ Finalizar</button>
          </div>

          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
            {partesTemplate.map(p => {
              const w = countWords(activeRedacao.partes[p.key] || '')
              const done = w >= p.target * 5
              return (
                <button key={p.key} onClick={() => setActiveParte(p.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border"
                  style={{
                    borderColor: activeParte === p.key ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    background: activeParte === p.key ? 'rgba(var(--primary-rgb),0.15)' : 'rgba(255,255,255,0.03)',
                    color: activeParte === p.key ? 'var(--primary)' : 'rgba(255,255,255,0.45)'
                  }}>
                  {done && <span className="text-emerald-400">✓</span>}
                  {p.label}
                  <span className="opacity-60">{w}w</span>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
            <div className="p-4 border-b border-white/8 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-white">{parte?.label}</div>
                <div className="text-xs text-white/40 mt-0.5">{parte?.desc}</div>
              </div>
              <button onClick={() => setShowAnotacao(v => !v)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${showAnotacao ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-white/10 text-white/40 hover:text-white/60'}`}>
                💬 Correção
              </button>
            </div>
            <div className="p-4">
              <textarea className="w-full px-4 py-4 rounded-xl text-sm outline-none resize-none leading-loose bg-white/[0.03] border border-white/8 text-white placeholder-white/20" style={{ fontFamily: 'Georgia, serif' }} rows={12}
                placeholder={`Digite sua ${parte?.label?.toLowerCase()}...`}
                value={activeRedacao.partes[activeParte] || ''}
                onChange={e => updateParte(activeParte, e.target.value)} />
              <div className="flex justify-between text-xs text-white/40 mt-2">
                <span>{words} palavras · {lines} linhas</span>
                <span className={lines >= parte?.target ? 'text-emerald-400' : ''}>Meta: {parte?.target} linhas</span>
              </div>
              <AnimatePresence>
                {showAnotacao && (
                  <motion.div className="mt-4 rounded-xl p-4 border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.06)' }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-2 text-amber-400">📝 Anotação de Correção</label>
                    <textarea rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none bg-white/5 border border-white/10 text-white placeholder-white/20"
                      placeholder="Observações do corretor sobre esta parte..."
                      value={activeRedacao.anotacoes?.[activeParte] || ''}
                      onChange={e => updateAnotacaoLocal(activeParte, e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        <AnimatePresence>{partesModal && <PartesModal onClose={() => setPartesModal(false)} />}</AnimatePresence>
      </StudyLayout>
    )
  }

  return (
    <StudyLayout>
      <motion.div {...fadeSlide}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SectionHeader title="Redação" icon="✍️" />
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setPartesModal(true)} className="px-3 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:bg-white/5 transition-all">⚙ Partes</button>
            <button onClick={() => setView(view === 'temas' ? 'list' : 'temas')} className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:bg-white/5 transition-all">📋 Banco de Temas</button>
            <button onClick={() => { const t = sortearTema(); if (t) newRedacao(t) }} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 transition-opacity">🎲 Sortear Tema</button>
            <button onClick={() => newRedacao(null)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition-colors">+ Tema Livre</button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'temas' ? (
            <motion.div key="temas" {...fadeSlide}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{themes.length} temas cadastrados</h3>
                <button onClick={() => setTemaModal(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 transition-colors">+ Adicionar Tema</button>
              </div>
              <div className="space-y-2">
                {themes.map(t => (
                  <BentoCard key={t.id} padding onClick={() => newRedacao(t)}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{t.titulo}</p>
                        <div className="flex gap-2 mt-0.5">
                          <Badge>{t.categoria}</Badge>
                          {t.fonte && <Badge>{t.fonte}</Badge>}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); newRedacao(t) }} className="text-xs px-3 py-1.5 rounded-lg font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 transition-colors whitespace-nowrap">Usar →</button>
                      {!t.padrao && <button onClick={e => { e.stopPropagation(); deleteTheme(t.id) }} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 text-xs transition-colors">✕</button>}
                    </div>
                  </BentoCard>
                ))}
              </div>
            </motion.div>
          ) : redacoes.length === 0 ? (
            <motion.div key="empty" {...fadeSlide}>
              <BentoCard>
                <div className="py-8 text-center">
                  <div className="text-4xl mb-3 opacity-30">✍️</div>
                  <p className="font-semibold text-white/60 mb-1">Nenhuma redação ainda</p>
                  <p className="text-sm text-white/30 mb-5">Sorteie um tema ou escreva com tema livre</p>
                </div>
              </BentoCard>
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-2" {...fadeSlide}>
              {[...redacoes].sort((a, b) => b.createdAt - a.createdAt).map(r => {
                const totalWords = Object.values(r.partes || {}).reduce((a, t) => a + countWords(t), 0)
                const hasAnotacoes = Object.values(r.anotacoes || {}).some(a => a?.trim())
                return (
                  <BentoCard key={r.id} padding onClick={() => { setActiveRedacao(r); setActiveParte(partesTemplate[0]?.key); setView('editor') }}>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{r.status === 'concluida' ? '✅' : '📝'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.themeTitulo}</p>
                        <p className="text-xs text-white/40">{formatDateBR(new Date(r.createdAt).toISOString().split('T')[0])} · {totalWords} palavras{hasAnotacoes ? ' · 💬 com correção' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={r.status === 'concluida' ? '#10B981' : '#F59E0B'} variant="solid">
                          {r.status === 'concluida' ? 'Concluída' : 'Rascunho'}
                        </Badge>
                        <button onClick={e => { e.stopPropagation(); if (window.confirm('Excluir redação?')) deleteRedacao(r.id) }} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 text-xs transition-colors">✕</button>
                      </div>
                    </div>
                  </BentoCard>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {temaModal && <TemaModal onClose={() => setTemaModal(false)} onSave={(t) => { addTheme(t); setTemaModal(false) }} />}
        {partesModal && <PartesModal onClose={() => setPartesModal(false)} />}
      </AnimatePresence>
    </StudyLayout>
  )
}
