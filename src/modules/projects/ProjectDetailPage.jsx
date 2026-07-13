import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';
import { usePersonaStore } from '../../stores/usePersonaStore';
import { ObjetivosView } from './views/ObjetivosView';
import { GanttView } from './views/GanttView';
import { ProjectAnalyticsView } from './views/ProjectAnalyticsView';
import { KanbanView } from './views/KanbanView';
import { ProjectFormModal } from './components/ProjectFormModal';
import { formatDateBR, daysUntil } from '../../shared/utils/time';

const STATUS_CONFIG = {
  ativo: { label: 'Ativo', color: '#10B981' },
  pausado: { label: 'Pausado', color: '#F59E0B' },
  concluido: { label: 'Concluído', color: '#3B82F6' },
  arquivado: { label: 'Arquivado', color: '#6B6A7A' },
};

const VIEWS = [
  { id: 'objetivos', label: 'Objetivos', icon: '🎯' },
  { id: 'kanban', label: 'Kanban', icon: '🗂️' },
  { id: 'gantt', label: 'Gantt', icon: '📅' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
];

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // CORREÇÃO AQUI: Buscando de forma reativa e atribuindo diretamente ao rawProject
  const rawProject = useProjectStore(s => s.projects.find(p => p.id === id));

  const getProjectProgress = useProjectStore(s => s.getProjectProgress);
  const updateProject = useProjectStore(s => s.updateProject);
  const deleteProject = useProjectStore(s => s.deleteProject);
  const personas = usePersonaStore(s => s.personas);

  const [activeView, setActiveView] = useState('objetivos');
  const [editOpen, setEditOpen] = useState(false);

  // Tratamento de erro caso o projeto não exista
  if (!rawProject)
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-30">◇</div>
          <p className="text-text-muted font-semibold mb-2">
            Projeto não encontrado
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm underline"
            style={{ color: 'var(--primary)' }}
          >
            ← Voltar aos Projetos
          </button>
        </div>
      </div>
    );

  // SANITIZAÇÃO: Garante que as propriedades essenciais existam como arrays vazios, evitando que os .map() nas Views quebrem a tela.
  const project = {
    ...rawProject,
    objetivos: rawProject.objetivos || [],
    // Se você usar "objectives" no código das views em vez de "objetivos", garantimos que ambas existam
    objectives: rawProject.objetivos || rawProject.objectives || [],
  };

  const persona = personas.find(p => p.id === project.personaId);
  const progress = getProjectProgress(id) || 0;
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.ativo;
  const days = daysUntil(project.dataFim);
  const cor = project.cor || 'var(--primary)';

  const handleDelete = () => {
    if (!window.confirm(`Excluir "${project.nome}" e todos os seus dados?`))
      return;
    deleteProject(id);
    navigate('/projects');
  };

  // Função para atualizar propriedades específicas do projeto via Views
  const handleUpdateProject = updatedData => {
    updateProject(id, { ...project, ...updatedData });
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-dim">
        <button
          onClick={() => navigate('/projects')}
          className="hover:text-text-main transition-colors"
        >
          Projetos
        </button>
        <span>›</span>
        <span className="text-text-main font-medium">{project.nome}</span>
      </div>

      {/* Header do projeto */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${cor}18, ${cor}06, var(--bg-surface))`,
          border: `1px solid ${cor}33`,
        }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: cor, transform: 'translate(30%, -30%)' }}
        />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{
                background: `${cor}33`,
                border: `1px solid ${cor}55`,
                boxShadow: `0 0 20px ${cor}33`,
              }}
            >
              {project.icone || '🎯'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-text-main">
                  {project.nome}
                </h1>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: status.color + '22',
                    color: status.color,
                    border: `1px solid ${status.color}44`,
                  }}
                >
                  {status.label}
                </span>
              </div>
              {project.descricao && (
                <p className="text-sm text-text-muted mb-2 max-w-md leading-relaxed">
                  {project.descricao}
                </p>
              )}
              <div className="flex items-center gap-3 flex-wrap text-xs text-text-dim">
                {persona && (
                  <span className="flex items-center gap-1.5">
                    <span>{persona.icon}</span>
                    <span style={{ color: persona.colorPrimary }}>
                      {persona.name}
                    </span>
                  </span>
                )}
                {project.dataInicio && (
                  <span>📅 Início: {formatDateBR(project.dataInicio)}</span>
                )}
                {project.dataFim && (
                  <span
                    style={{
                      color:
                        days !== null && days < 7 && days >= 0
                          ? '#F59E0B'
                          : 'var(--text-dim)',
                    }}
                  >
                    🏁 Fim: {formatDateBR(project.dataFim)}
                    {days !== null && days >= 0
                      ? ` (${days}d)`
                      : days !== null && days < 0
                        ? ' (encerrado)'
                        : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-white/5"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                ✎ Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: '#F87171',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                Excluir
              </button>
            </div>
            {/* Progress */}
            <div className="min-w-[160px]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-dim">Progresso</span>
                <span className="font-bold" style={{ color: cor }}>
                  {progress}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-surface-2)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${cor}, ${cor}88)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeView === v.id ? cor : 'transparent',
              color: activeView === v.id ? 'white' : 'var(--text-muted)',
            }}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* Views */}
      {activeView === 'objetivos' && (
        <ObjetivosView project={project} onUpdate={handleUpdateProject} />
      )}
      {activeView === 'kanban' && (
        <KanbanView projectId={project.id} />
      )}
      {activeView === 'gantt' && (
        <GanttView project={project} onUpdate={handleUpdateProject} />
      )}
      {activeView === 'analytics' && <ProjectAnalyticsView project={project} />}

      {editOpen && (
        <ProjectFormModal
          editData={project}
          onClose={() => setEditOpen(false)}
          onSave={data => updateProject(id, data)}
        />
      )}
    </div>
  );
}
