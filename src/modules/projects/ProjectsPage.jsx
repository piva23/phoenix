import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';
import { usePersonaStore } from '../../stores/usePersonaStore';
import { ProjectFormModal } from './components/ProjectFormModal';
import { KanbanView } from './views/KanbanView';
import { formatDateBR, daysUntil } from '../../shared/utils/time';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
  ativo: { label: 'Ativo', color: '#10B981' },
  pausado: { label: 'Pausado', color: '#F59E0B' },
  concluido: { label: 'Concluído', color: '#3B82F6' },
  arquivado: { label: 'Arquivado', color: '#6B6A7A' },
};

const INITIAL_TEMPLATES = [
  {
    id: 'proj_stabled_v3',
    nome: 'Plano Stabled Version',
    descricao: 'Foco: Estabilidade Psicológica profunda e alinhamento de rotina ativa.',
    icone: '🧠',
    cor: '#8B5CF6',
    status: 'ativo',
    personaId: 'horus',
    dataInicio: '2026-07-01',
    dataFim: '2026-12-31',
    objetivos: [
      {
        id: 'obj_stable_kr1',
        titulo: 'Frequência Emocional e Meditação',
        keyResults: [
          {
            id: 'kr_stable_1',
            titulo: 'Consistência nos rituais de respiração e presença',
            metaAlvo: 100,
            metaAtual: 75,
            unidade: '%'
          }
        ],
        tasks: [
          {
            id: 'task_stable_1',
            title: 'Ritual matinal diário de gratidão e afirmações',
            status: 'todo',
            prioridade: 'alta',
            xpReward: 20,
            dataInicio: '2026-07-10',
            dataFim: '2026-07-15'
          },
          {
            id: 'task_stable_2',
            title: 'Meditação noturna de descompressão 15 min',
            status: 'doing',
            prioridade: 'media',
            xpReward: 15,
            dataInicio: '2026-07-11',
            dataFim: '2026-07-16'
          }
        ]
      }
    ]
  },
  {
    id: 'proj_ambient_v3',
    nome: 'Plano Ambient',
    descricao: 'Foco: Otimizar ambiente de Eldorado, preparar mudança de residência e queimar barcos.',
    icone: '🏡',
    cor: '#EF4444',
    status: 'ativo',
    personaId: 'maion',
    dataInicio: '2026-07-01',
    dataFim: '2026-10-31',
    objetivos: [
      {
        id: 'obj_ambient_kr1',
        titulo: 'Otimização e Desapego',
        keyResults: [
          {
            id: 'kr_ambient_1',
            titulo: 'Eliminar itens acumulados e fechar rotas de fuga',
            metaAlvo: 100,
            metaAtual: 50,
            unidade: '%'
          }
        ],
        tasks: [
          {
            id: 'task_ambient_1',
            title: 'Triagem e doação de pertences não essenciais',
            status: 'done',
            prioridade: 'alta',
            xpReward: 20,
            dataInicio: '2026-07-05',
            dataFim: '2026-07-10'
          },
          {
            id: 'task_ambient_2',
            title: 'Mapear custos de transporte e nova moradia',
            status: 'doing',
            prioridade: 'critica',
            xpReward: 30,
            dataInicio: '2026-07-12',
            dataFim: '2026-07-18'
          }
        ]
      }
    ]
  },
  {
    id: 'proj_corpo_v3',
    nome: 'Projeto Corpo - MakeThisLittleHartBeat',
    descricao: 'Foco: Musculação diária de alta consistência e corridas regulares.',
    icone: '🫀',
    cor: '#10B981',
    status: 'ativo',
    personaId: 'leotauro',
    dataInicio: '2026-07-01',
    dataFim: '2026-12-31',
    objetivos: [
      {
        id: 'obj_corpo_kr1',
        titulo: 'Consistência Física e Cardio',
        keyResults: [
          {
            id: 'kr_corpo_1',
            titulo: 'Sessões de treino muscular completadas',
            metaAlvo: 60,
            metaAtual: 15,
            unidade: 'treinos'
          }
        ],
        tasks: [
          {
            id: 'task_corpo_1',
            title: 'Treino A: Peito, ombro e tríceps com intensidade máxima',
            status: 'todo',
            prioridade: 'critica',
            xpReward: 30,
            dataInicio: '2026-07-12',
            dataFim: '2026-07-13'
          },
          {
            id: 'task_corpo_2',
            title: 'Corrida de 5km em ritmo progressivo na pista',
            status: 'doing',
            prioridade: 'alta',
            xpReward: 20,
            dataInicio: '2026-07-13',
            dataFim: '2026-07-14'
          }
        ]
      }
    ]
  },
  {
    id: 'proj_ftp_v3',
    nome: 'Plano FTP',
    descricao: 'Foco: Projetar casa familiar detalhadamente e materializar veículo ideal.',
    icone: '🏠',
    cor: '#3B82F6',
    status: 'ativo',
    personaId: 'leao-peixe',
    dataInicio: '2026-07-01',
    dataFim: '2027-06-30',
    objetivos: [
      {
        id: 'obj_ftp_kr1',
        titulo: 'Projeto e Planeamento Familiar',
        keyResults: [
          {
            id: 'kr_ftp_1',
            titulo: 'Definição das especificações da residência',
            metaAlvo: 100,
            metaAtual: 30,
            unidade: '%'
          }
        ],
        tasks: [
          {
            id: 'task_ftp_1',
            title: 'Definir programa de necessidades para a residência',
            status: 'done',
            prioridade: 'media',
            xpReward: 15,
            dataInicio: '2026-07-02',
            dataFim: '2026-07-06'
          },
          {
            id: 'task_ftp_2',
            title: 'Pesquisa de modelos e preços de utilitários familiares',
            status: 'todo',
            prioridade: 'baixa',
            xpReward: 5,
            dataInicio: '2026-07-15',
            dataFim: '2026-07-20'
          }
        ]
      }
    ]
  },
  {
    id: 'proj_17_v3',
    nome: 'Plano $17',
    descricao: 'Foco: Economia rigorosa extremada, investimentos consistentes e controle de saídas.',
    icone: '💰',
    cor: '#F59E0B',
    status: 'ativo',
    personaId: 'maion',
    dataInicio: '2026-07-01',
    dataFim: '2026-12-31',
    objetivos: [
      {
        id: 'obj_17_kr1',
        titulo: 'Rigor e Acumulação',
        keyResults: [
          {
            id: 'kr_17_1',
            titulo: 'Atingir taxa planejada de economia mensal',
            metaAlvo: 80,
            metaAtual: 75,
            unidade: '%'
          }
        ],
        tasks: [
          {
            id: 'task_17_1',
            title: 'Planilhar gastos da última quinzena no centavo',
            status: 'todo',
            prioridade: 'alta',
            xpReward: 20,
            dataInicio: '2026-07-12',
            dataFim: '2026-07-14'
          },
          {
            id: 'task_17_2',
            title: 'Revisar assinaturas recorrentes não utilizadas',
            status: 'done',
            prioridade: 'media',
            xpReward: 15,
            dataInicio: '2026-07-04',
            dataFim: '2026-07-08'
          }
        ]
      }
    ]
  }
];

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, deleteProject, getProjectProgress, importProjects } = useProjectStore();
  const { personas } = usePersonaStore();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'kanban'
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [filterPersona, setFilterPersona] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const addProject = useProjectStore(s => s.addProject);
  const updateProject = useProjectStore(s => s.updateProject);

  const fileInputRef = useRef(null);

  const filtered = projects.filter(p => {
    if (filterPersona !== 'all' && p.personaId !== filterPersona) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const handleDelete = (e, id, nome) => {
    e.stopPropagation();
    if (!window.confirm(`Excluir "${nome}"?`)) return;
    deleteProject(id);
    toast.success('Projeto removido com sucesso!');
  };

  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const jsonContent = JSON.parse(e.target.result);
        const itemsToImport = Array.isArray(jsonContent) ? jsonContent : [jsonContent];

        importProjects(itemsToImport);
        toast.success('Projetos importados com sucesso!', { icon: '📥' });
      } catch (error) {
        console.error('Erro ao importar:', error);
        toast.error('O arquivo selecionado não é um JSON válido.');
      }
      event.target.value = null;
    };
    reader.readAsText(file);
  };

  const handleLoadTemplates = () => {
    try {
      importProjects(INITIAL_TEMPLATES);
      toast.success('Templates V3 carregados com sucesso! Projetos e metas importados.', {
        icon: '⚡',
        duration: 4000
      });
    } catch (err) {
      toast.error('Erro ao carregar templates.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl select-none">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-2">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight">Projetos</h1>
          <p className="text-text-muted text-xs mt-1 font-medium leading-relaxed">
            Gestão estratégica de vida, OKRs e acompanhamento reativo das lentes ativas.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5 items-center flex-wrap">
          {/* Button to Load Templates */}
          <button
            onClick={handleLoadTemplates}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-[#A78BFA] hover:from-purple-500/20 hover:to-indigo-500/20 outline-none"
            title="Injetar Projetos de Vida Estruturais"
          >
            ⚡ Carregar Templates V3
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border hover:bg-white/5"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
            }}
          >
            <span>📥</span> Importar
          </button>

          <button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all flex-shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            + Novo Projeto
          </button>
        </div>
      </div>

      {/* View Switcher Tabs: List vs Kanban Board */}
      <div className="flex border-b border-white/5 bg-white/[0.01] rounded-t-xl overflow-hidden">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all outline-none ${
            activeTab === 'list'
              ? 'border-primary text-text-main bg-white/[0.02]'
              : 'border-transparent text-text-dim hover:text-text-main'
          }`}
        >
          📋 Meus Projetos ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all outline-none ${
            activeTab === 'kanban'
              ? 'border-primary text-text-main bg-white/[0.02]'
              : 'border-transparent text-text-dim hover:text-text-main'
          }`}
        >
          🗂️ Kanban Board Global
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div>
              <select
                className="px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-primary/50"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                }}
                value={filterPersona}
                onChange={e => setFilterPersona(e.target.value)}
              >
                <option value="all">Todas as personas</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-primary/50"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                }}
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos os status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs font-medium text-text-dim flex items-center ml-auto">
              Exibindo {filtered.length} de {projects.length} projetos
            </div>
          </div>

          {/* Cards Listing */}
          {filtered.length === 0 ? (
            <div
              className="rounded-3xl p-16 text-center border border-dashed"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-5xl mb-4 opacity-35">💎</div>
              <p className="font-bold text-text-main mb-2 text-base">
                {projects.length === 0 ? 'Nenhum projeto de vida ativo' : 'Nenhum projeto encontrado'}
              </p>
              <p className="text-xs text-text-dim mb-6 max-w-sm mx-auto leading-relaxed">
                {projects.length === 0
                  ? 'Inicie a sua jornada importando os templates de vida phoenix v3 ou crie um projeto totalmente personalizado.'
                  : 'Tente alterar as opções de filtragem das personas ou status.'}
              </p>
              {projects.length === 0 && (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleLoadTemplates}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-95 shadow-md active:scale-95 transition-all"
                  >
                    Carregar Templates V3
                  </button>
                  <button
                    onClick={() => setFormOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-text-main hover:bg-white/5 transition-all"
                  >
                    Criar Manualmente
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(p => {
                const progress = getProjectProgress(p.id);
                const persona = personas.find(x => x.id === p.personaId);
                const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.ativo;
                const cor = p.cor || 'var(--primary)';
                const days = daysUntil(p.dataFim);
                const allTasks = (p.objetivos || []).flatMap(o => o.tasks || []);
                const doneTasks = allTasks.filter(t => t.status === 'done').length;
                const overdue = allTasks.filter(
                  t =>
                    t.dataFim &&
                    t.dataFim < new Date().toISOString().split('T')[0] &&
                    t.status !== 'done'
                ).length;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
                    style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${cor}33`,
                    }}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {/* Visual gradient accent */}
                    <div
                      className="h-1 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${cor}, ${cor}44)`,
                      }}
                    />

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      {/* Top content */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                              style={{
                                background: `${cor}22`,
                                border: `1px solid ${cor}44`,
                              }}
                            >
                              {p.icone || '🎯'}
                            </div>
                            <div>
                              <h4 className="font-bold text-text-main text-sm leading-snug line-clamp-1">
                                {p.nome}
                              </h4>
                              {persona && (
                                <span
                                  className="text-[10px] font-bold mt-0.5 flex items-center gap-1 uppercase tracking-wider"
                                  style={{ color: persona.colorPrimary }}
                                >
                                  {persona.icon} {persona.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <span
                              className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                              style={{
                                background: status.color + '15',
                                color: status.color,
                                border: `1px solid ${status.color}33`,
                              }}
                            >
                              {status.label}
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setEditTarget(p);
                                setFormOpen(true);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-white/5 text-xs outline-none"
                            >
                              ✎
                            </button>
                            <button
                              onClick={e => handleDelete(e, p.id, p.nome)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs outline-none"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {p.descricao && (
                          <p className="text-xs text-text-dim leading-relaxed line-clamp-2">
                            {p.descricao}
                          </p>
                        )}
                      </div>

                      {/* Stats & Progress */}
                      <div className="space-y-3 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-3 text-[10px] text-text-dim flex-wrap font-semibold uppercase tracking-wider">
                          <span>🎯 {(p.objetivos || []).length} objetivos</span>
                          <span>✓ {doneTasks}/{allTasks.length} tasks</span>
                          {overdue > 0 && (
                            <span className="text-red-400">⚠️ {overdue} atrasadas</span>
                          )}
                          {p.dataFim && days !== null && (
                            <span
                              style={{
                                color: days < 7 && days >= 0 ? '#F59E0B' : 'var(--text-dim)',
                              }}
                            >
                              📅 {days > 0 ? `${days}d restantes` : days === 0 ? 'Encerra hoje' : formatDateBR(p.dataFim)}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-text-dim">Conclusão de Metas</span>
                            <span className="font-bold font-mono" style={{ color: cor }}>
                              {progress}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'var(--bg-surface-2)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${cor}, ${cor}aa)`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Render Kanban View when Active Tab is 'kanban' */
        <div className="animate-fadeIn">
          <KanbanView />
        </div>
      )}

      {formOpen && (
        <ProjectFormModal
          editData={editTarget}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          onSave={data => {
            if (editTarget) updateProject(editTarget.id, data);
            else addProject(data);
          }}
        />
      )}
    </div>
  );
}
