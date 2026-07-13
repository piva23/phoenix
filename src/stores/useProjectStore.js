import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const uid = prefix =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],

      // ── Projects ──────────────────────────────────────────
      addProject: data =>
        set(state => ({
          projects: [
            ...state.projects,
            {
              ...data,
              // Se vier com ID do JSON (data.id), mantém. Se não, cria um novo (uid).
              id: data.id || uid('proj'),
              // Se vier com objetivos do JSON (data.objetivos), mantém. Se não, cria array vazio.
              objetivos: data.objetivos || [],
              status: data.status || 'ativo',
              createdAt: data.createdAt || Date.now(),
              updatedAt: Date.now(),
            },
          ],
        })),

      updateProject: (id, data) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== id ? p : { ...p, ...data, updatedAt: Date.now() }
          ),
        })),

      deleteProject: id =>
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
        })),

      getProjectById: id => get().projects.find(p => p.id === id),

      // ── Objetivos ─────────────────────────────────────────
      addObjetivo: (projectId, data) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: [
                    ...(p.objetivos || []),
                    {
                      ...data,
                      id: uid('obj'),
                      keyResults: [],
                      tasks: [],
                      ordem: (p.objetivos || []).length,
                      createdAt: Date.now(),
                    },
                  ],
                }
          ),
        })),

      updateObjetivo: (projectId, objetivoId, data) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId ? o : { ...o, ...data }
                  ),
                }
          ),
        })),

      deleteObjetivo: (projectId, objetivoId) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: p.objetivos.filter(o => o.id !== objetivoId),
                }
          ),
        })),

      // ── Key Results ───────────────────────────────────────
      addKeyResult: (projectId, objetivoId, data) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId
                      ? o
                      : {
                          ...o,
                          keyResults: [
                            ...(o.keyResults || []),
                            {
                              ...data,
                              id: uid('kr'),
                              metaAtual: data.metaAtual || 0,
                              createdAt: Date.now(),
                            },
                          ],
                        }
                  ),
                }
          ),
        })),

      updateKeyResult: (projectId, objetivoId, krId, data) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId
                      ? o
                      : {
                          ...o,
                          keyResults: o.keyResults.map(kr =>
                            kr.id !== krId ? kr : { ...kr, ...data }
                          ),
                        }
                  ),
                }
          ),
        })),

      deleteKeyResult: (projectId, objetivoId, krId) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId
                      ? o
                      : {
                          ...o,
                          keyResults: o.keyResults.filter(kr => kr.id !== krId),
                        }
                  ),
                }
          ),
        })),

      // ── Tasks ─────────────────────────────────────────────
      addTask: (projectId, objetivoId, data) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId
                      ? o
                      : {
                          ...o,
                          tasks: [
                            ...(o.tasks || []),
                            {
                              ...data,
                              id: uid('task'),
                              status: 'todo',
                              milestone: data.milestone || false,
                              prioridade: data.prioridade || 'media',
                              xpReward:
                                data.prioridade === 'critica'
                                  ? 30
                                  : data.prioridade === 'alta'
                                    ? 20
                                    : data.prioridade === 'baixa'
                                      ? 5
                                      : 10,
                              completedAt: null,
                              createdAt: Date.now(),
                            },
                          ],
                        }
                  ),
                }
          ),
        })),

      updateTask: (projectId, objetivoId, taskId, data) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId
                      ? o
                      : {
                          ...o,
                          tasks: o.tasks.map(t =>
                            t.id !== taskId ? t : { ...t, ...data }
                          ),
                        }
                  ),
                }
          ),
        })),

      deleteTask: (projectId, objetivoId, taskId) =>
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId
                      ? o
                      : {
                          ...o,
                          tasks: o.tasks.filter(t => t.id !== taskId),
                        }
                  ),
                }
          ),
        })),

      completeTask: (projectId, objetivoId, taskId) => {
        const project = get().projects.find(p => p.id === projectId);
        const objetivo = project?.objetivos?.find(o => o.id === objetivoId);
        const task = objetivo?.tasks?.find(t => t.id === taskId);
        if (!task || task.status === 'done') return null;

        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  updatedAt: Date.now(),
                  objetivos: p.objetivos.map(o =>
                    o.id !== objetivoId
                      ? o
                      : {
                          ...o,
                          tasks: o.tasks.map(t =>
                            t.id !== taskId
                              ? t
                              : {
                                  ...t,
                                  status: 'done',
                                  completedAt: new Date()
                                    .toISOString()
                                    .split('T')[0],
                                }
                          ),
                        }
                  ),
                }
          ),
        }));

        return task.xpReward || 10;
      },

      updateTaskStatus: (projectId, objectiveId, taskId, newStatus) => {
        set(state => {
          let targetProjectId = projectId;
          let targetObjectiveId = objectiveId;

          // Encontra o projeto e objetivo da tarefa caso não tenham sido passados
          if (!targetProjectId || !targetObjectiveId) {
            for (const p of state.projects) {
              for (const o of p.objetivos || []) {
                if ((o.tasks || []).some(t => t.id === taskId)) {
                  targetProjectId = p.id;
                  targetObjectiveId = o.id;
                  break;
                }
              }
              if (targetProjectId) break;
            }
          }

          if (!targetProjectId || !targetObjectiveId) return {};

          return {
            projects: state.projects.map(p => {
              if (p.id !== targetProjectId) return p;
              return {
                ...p,
                updatedAt: Date.now(),
                objetivos: (p.objetivos || []).map(o => {
                  if (o.id !== targetObjectiveId) return o;
                  return {
                    ...o,
                    tasks: (o.tasks || []).map(t => {
                      if (t.id !== taskId) return t;
                      return {
                        ...t,
                        status: newStatus,
                        completedAt: newStatus === 'done' ? (t.completedAt || new Date().toISOString().split('T')[0]) : null
                      };
                    })
                  };
                })
              };
            })
          };
        });
      },

      importProjects: (projectArray) => {
        if (!Array.isArray(projectArray)) {
          throw new Error('Os projetos devem ser disponibilizados em formato de array.');
        }
        
        // Garante que todos os projetos, objetivos e tasks importados tenham a estrutura e status corretos
        const mapped = projectArray.map(p => ({
          ...p,
          id: p.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          status: p.status || 'ativo',
          createdAt: p.createdAt || Date.now(),
          updatedAt: Date.now(),
          objetivos: (p.objetivos || []).map(o => ({
            ...o,
            id: o.id || `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            keyResults: o.keyResults || [],
            tasks: (o.tasks || []).map(t => ({
              ...t,
              id: t.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              status: t.status || 'todo',
              milestone: t.milestone || false,
              prioridade: t.prioridade || 'media',
              xpReward: t.xpReward || 10,
              completedAt: t.completedAt || null,
              createdAt: t.createdAt || Date.now()
            }))
          }))
        }));

        set(state => {
          // Remove duplicatas por ID se existirem
          const existingIds = state.projects.map(p => p.id);
          const newFiltered = mapped.filter(p => !existingIds.includes(p.id));
          return {
            projects: [...state.projects, ...newFiltered]
          };
        });
      },

      // ── Seletores derivados ───────────────────────────────
      getProjectsByPersona: personaId =>
        get().projects.filter(p => p.personaId === personaId),

      getProjectProgress: projectId => {
        const p = get().projects.find(x => x.id === projectId);
        if (!p) return 0;
        const allTasks = (p.objetivos || []).flatMap(o => o.tasks || []);
        if (allTasks.length === 0) return 0;
        return Math.round(
          (allTasks.filter(t => t.status === 'done').length / allTasks.length) *
            100
        );
      },
    }),
    { name: 'phoenix-projects' }
  )
);
