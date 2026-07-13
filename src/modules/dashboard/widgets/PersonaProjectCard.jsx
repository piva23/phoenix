import { useNavigate } from 'react-router-dom';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useUserStore } from '../../../stores/useUserStore';
import { calcXPProgress } from '../../../shared/utils/xp';

export function PersonaProjectCard() {
  const navigate = useNavigate();
  const getActivePersona = usePersonaStore(s => s.getActivePersona);
  const activePersonaId = usePersonaStore(s => s.activePersonaId);
  const { xp } = useUserStore();
  const getProjectsByPersona = useProjectStore(s => s.getProjectsByPersona);
  const getProjectProgress = useProjectStore(s => s.getProjectProgress);
  const streak = useSessionStore(s => s.getStreak());

  const persona = getActivePersona();
  const xpData = calcXPProgress(xp);
  const projects = getProjectsByPersona(activePersonaId).filter(
    p => p.status === 'ativo'
  );
  const mainProject = projects[0];
  const progress = mainProject ? getProjectProgress(mainProject.id) : 0;

  if (!persona) return null;

  return (
    <div
      className="rounded-2xl p-5 border space-y-4"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${persona.colorPrimary}33, ${persona.colorSecondary}11)`,
            border: `1px solid ${persona.colorPrimary}33`,
          }}
        >
          {persona.icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-text-dim font-semibold">
            Persona ativa
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-text-main truncate">
              {persona.name}
            </h3>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: `${persona.colorPrimary}22`,
                color: persona.colorPrimary,
              }}
            >
              Nível {xpData.level}
            </span>
          </div>
          <p className="text-xs text-text-muted truncate">{persona.title}</p>
        </div>
      </div>

      <div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${xpData.progress}%`,
              background: `linear-gradient(90deg, ${persona.colorPrimary}, ${persona.colorSecondary})`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-dim mt-1.5 font-medium">
          <span>
            {xpData.currentXP}/{xpData.neededXP} XP
          </span>
          <span>🔥 {streak} {streak === 1 ? 'dia' : 'dias'}</span>
        </div>
      </div>

      {persona.focus?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {persona.focus.map(f => (
            <span
              key={f}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {mainProject ? (
        <button
          onClick={() => navigate(`/projects/${mainProject.id}`)}
          className="w-full text-left p-3 rounded-xl border transition-all hover:border-primary"
          style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest text-text-dim font-semibold">
              Projeto principal
            </span>
            <span className="text-xs font-bold" style={{ color: persona.colorPrimary }}>
              {progress}%
            </span>
          </div>
          <div className="text-sm font-semibold text-text-main truncate mb-2">
            {mainProject.nome || mainProject.name}
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: persona.colorPrimary }}
            />
          </div>
        </button>
      ) : (
        <button
          onClick={() => navigate('/projects')}
          className="w-full text-xs text-text-dim p-3 rounded-xl border border-dashed hover:text-text-main transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          Nenhum projeto ativo para esta persona — criar um
        </button>
      )}
    </div>
  );
}
