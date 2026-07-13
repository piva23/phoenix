import { formatDateBR } from '../../../shared/utils/time';

const PRIORIDADE_CONFIG = {
  baixa: { color: '#6B6A7A', label: 'Baixa' },
  media: { color: '#3B82F6', label: 'Média' },
  alta: { color: '#F59E0B', label: 'Alta' },
  critica: { color: '#EF4444', label: 'Crítica' },
};

const STATUS_CONFIG = {
  todo: { color: '#6B6A7A', label: 'A Fazer' },
  doing: { color: '#F59E0B', label: 'Em Andamento' },
  done: { color: '#10B981', label: 'Concluído' },
};

export function TaskItem({ task, projectCor, onComplete, onEdit, onDelete }) {
  const prio = PRIORIDADE_CONFIG[task.prioridade] || PRIORIDADE_CONFIG.media;
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const isDone = task.status === 'done';
  const isOverdue =
    task.dataFim &&
    task.dataFim < new Date().toISOString().split('T')[0] &&
    !isDone;

  // SANITIZAÇÃO: Puxa o título ou o nome (caso venha do JSON antigo)
  const displayTitle = task.titulo || task.nome || 'Task sem título';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border transition-all group"
      style={{
        background: isDone ? 'transparent' : 'var(--bg-surface-2)',
        borderColor: isDone
          ? 'var(--border)'
          : task.milestone
            ? projectCor + '44'
            : 'var(--border)',
        opacity: isDone ? 0.55 : 1,
      }}
    >
      {/* Checkbox / Milestone */}
      <button
        onClick={() => !isDone && onComplete()}
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all cursor-pointer hover:scale-110"
        style={{
          background: isDone ? '#10B981' : 'transparent',
          border: `1.5px solid ${isDone ? '#10B981' : task.milestone ? projectCor : 'var(--border-strong)'}`,
        }}
      >
        {isDone ? (
          <span className="text-white text-xs">✓</span>
        ) : task.milestone ? (
          <span style={{ color: projectCor, fontSize: 10 }}>◆</span>
        ) : null}
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className="text-sm font-medium line-clamp-1"
            title={displayTitle}
            style={{
              color: isDone ? 'var(--text-dim)' : 'var(--text-main)',
              textDecoration: isDone ? 'line-through' : 'none',
            }}
          >
            {displayTitle}
          </span>
          {task.milestone && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
              style={{
                background: projectCor + '22',
                color: projectCor,
                border: `1px solid ${projectCor}44`,
              }}
            >
              ◆ Milestone
            </span>
          )}
          {isOverdue && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider animate-pulse"
              style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#F87171',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              Atrasada
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {/* Prioridade */}
          <span
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: prio.color }}
          >
            <span className="text-[8px]">●</span> {prio.label}
          </span>

          {/* Datas */}
          {task.dataFim && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: isOverdue ? '#F87171' : 'var(--text-dim)' }}
            >
              <span>📅</span> {formatDateBR(task.dataFim)}
            </span>
          )}

          {/* XP */}
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--primary)' }}
          >
            ⚡ +{task.xpReward || 10} XP
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          title="Editar Task"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-white/8 text-xs transition-colors"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          title="Excluir Task"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
