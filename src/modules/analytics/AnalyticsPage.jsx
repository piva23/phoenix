import { useMemo } from 'react'
import { useXPStore } from '../../stores/useXPStore'
import { useUserStore } from '../../stores/useUserStore'
import { useSessionStore } from '../../stores/useSessionStore'
import { usePersonaStore } from '../../stores/usePersonaStore'
import { calcXPProgress } from '../../shared/utils/xp'
import { RADAR_AXES } from '../../shared/constants/xpRules'
import { formatMinutes } from '../../shared/utils/time'

const AXIS_LABELS = {
  conhecimento: 'Conhecimento',
  disciplina:   'Disciplina',
  foco:         'Foco',
  consistencia: 'Consistência',
  velocidade:   'Velocidade',
  retencao:     'Retenção',
}

function RadarChart({ data }) {
  const size = 200
  const cx = size/2, cy = size/2, r = 80
  const n = RADAR_AXES.length
  const points = RADAR_AXES.map((axis,i) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI/2
    const val = (data[axis]||0)/100
    return { x: cx + r*val*Math.cos(angle), y: cy + r*val*Math.sin(angle), lx: cx+(r+20)*Math.cos(angle), ly: cy+(r+20)*Math.sin(angle), label: AXIS_LABELS[axis], val:data[axis]||0 }
  })
  const polyPoints = points.map(p=>`${p.x},${p.y}`).join(' ')
  const gridLevels = [0.25,0.5,0.75,1]

  return (
    <div className="flex flex-col items-center">
      <svg width={size+60} height={size+60} viewBox={`-30 -30 ${size+60} ${size+60}`}>
        {/* Grid */}
        {gridLevels.map(lv=>{
          const pts = RADAR_AXES.map((_,i)=>{ const a=(i*2*Math.PI/n)-Math.PI/2; return `${cx+r*lv*Math.cos(a)},${cy+r*lv*Math.sin(a)}` }).join(' ')
          return <polygon key={lv} points={pts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        })}
        {/* Axes */}
        {RADAR_AXES.map((_,i)=>{ const a=(i*2*Math.PI/n)-Math.PI/2; return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" /> })}
        {/* Data */}
        <polygon points={polyPoints} fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="1.5" />
        {points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />)}
        {/* Labels */}
        {points.map((p,i)=>(
          <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fill="rgba(155,154,171,0.9)" fontSize="9" fontFamily="Inter,sans-serif">{p.label}</text>
        ))}
      </svg>
    </div>
  )
}

export function AnalyticsPage() {
  const { getRadarNormalized, getXPByModule, logs } = useXPStore()
  const { xp } = useUserStore()
  const sessions = useSessionStore(s => s.sessions)
  const personas = usePersonaStore(s => s.personas)

  const radar = getRadarNormalized()
  const xpData = calcXPProgress(xp)
  const byModule = getXPByModule()

  const personaUsage = useMemo(() => {
    const map = {}
    logs.forEach(l => { map[l.personaId]=(map[l.personaId]||0)+l.xp })
    return Object.entries(map).map(([id,totalXP])=>{
      const p = personas.find(x=>x.id===id)
      return { id, name:p?.name||id, icon:p?.icon||'?', color:p?.colorPrimary||'var(--primary)', totalXP }
    }).sort((a,b)=>b.totalXP-a.totalXP)
  }, [logs, personas])

  const totalStudyMins = sessions.reduce((a,s)=>a+(s.totalMinutes||0),0)
  const totalSessions = sessions.length

  const MODULE_LABELS = { study:'Study', health:'Saúde', projects:'Projetos', knowledge:'Conhecimento', finance:'Finanças', spiritual:'Espiritual', relationships:'Relações' }
  const MODULE_ICONS = { study:'📚', health:'🏃', projects:'◇', knowledge:'🧠', finance:'💰', spiritual:'🌿', relationships:'👥' }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Analytics Global</h1>
        <p className="text-text-muted text-sm mt-1">Visão unificada da sua evolução em todos os módulos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'XP Total',      value:xp,                     color:'var(--accent)' },
          { label:'Nível',         value:`Lv. ${xpData.level}`,  color:'var(--primary)' },
          { label:'Horas Estudo',  value:formatMinutes(totalStudyMins), color:'var(--secondary)' },
          { label:'Sessões',       value:totalSessions,           color:'#10B981' },
        ].map(s=>(
          <div key={s.label} className="rounded-xl p-4" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color:s.color }}>{s.value}</div>
            <div className="text-xs text-text-dim mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar RPG */}
        <div className="rounded-xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm mb-4">Radar de Evolução RPG</h3>
          {xp === 0 ? (
            <div className="text-center py-8 text-text-dim text-sm">Complete ações para ver seu radar evoluir</div>
          ) : (
            <>
              <RadarChart data={radar} />
              <div className="grid grid-cols-2 gap-2 mt-3">
                {RADAR_AXES.map(axis=>(
                  <div key={axis} className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background:'var(--bg-surface-2)' }}>
                      <div className="h-full rounded-full" style={{ width:`${radar[axis]||0}%`, background:'var(--primary)' }} />
                    </div>
                    <span className="text-xs text-text-dim w-16 text-right">{AXIS_LABELS[axis]}</span>
                    <span className="text-xs font-semibold w-8 text-right" style={{ color:'var(--primary)' }}>{radar[axis]||0}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* XP por Módulo */}
        <div className="rounded-xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm mb-4">XP por Módulo</h3>
          {Object.keys(byModule).length===0 ? (
            <div className="text-center py-8 text-text-dim text-sm">Nenhum XP registrado ainda</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(byModule).sort((a,b)=>b[1]-a[1]).map(([mod,val])=>{
                const total = Math.max(...Object.values(byModule),1)
                return (
                  <div key={mod}>
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{MODULE_ICONS[mod]||'◈'}</span>
                        <span className="text-sm font-medium text-text-main">{MODULE_LABELS[mod]||mod}</span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color:'var(--accent)' }}>+{val} XP</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg-surface-2)' }}>
                      <div className="h-full rounded-full" style={{ width:`${(val/total)*100}%`, background:'var(--primary)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Personas mais usadas */}
      {personaUsage.length > 0 && (
        <div className="rounded-xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm mb-4">Personas Mais Ativas</h3>
          <div className="space-y-3">
            {personaUsage.map((p,i)=>{
              const max = personaUsage[0]?.totalXP||1
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="text-lg w-8 text-center">{p.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-text-main">{p.name}</span>
                      <span className="text-sm font-semibold" style={{ color:p.color }}>+{p.totalXP} XP</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg-surface-2)' }}>
                      <div className="h-full rounded-full" style={{ width:`${(p.totalXP/max)*100}%`, background:p.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Level Progress */}
      <div className="rounded-xl p-5" style={{ background:'var(--bg-surface)', border:`1px solid var(--primary)33` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Progresso de Nível</h3>
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background:'var(--primary)22', color:'var(--primary)' }}>Lv. {xpData.level}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background:'var(--bg-surface-2)' }}>
          <div className="h-full rounded-full transition-all" style={{ width:`${xpData.progress}%`, background:`linear-gradient(90deg,var(--primary),var(--secondary))` }} />
        </div>
        <div className="flex justify-between text-xs text-text-dim">
          <span>{xpData.currentXP} XP neste nível</span>
          <span>{xpData.neededXP - xpData.currentXP} XP para Lv. {xpData.level+1}</span>
        </div>
      </div>
    </div>
  )
}
