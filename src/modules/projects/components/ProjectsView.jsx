import React, { useState } from 'react';
import { useProjectStore } from '../../../stores/useProjectStore';
import TaskFormModal from './TaskFormModal';
import { Briefcase, FolderPlus, Plus, Trash2, CheckCircle2, Circle, Calendar as CalendarIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectsView() {
  const { projects, addProject, deleteProject, addObjective, deleteObjective, toggleTask, deleteTask } = useProjectStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#f97316');
  
  const [newObjectiveName, setNewObjectiveName] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeObjectiveId, setActiveObjectiveId] = useState(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error('O nome do projeto é obrigatório!');
      return;
    }
    addProject(newProjectName, newProjectDesc, newProjectColor);
    toast.success('Projeto criado com sucesso!');
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectColor('#f97316');
  };

  const handleCreateObjective = (e) => {
    e.preventDefault();
    if (!newObjectiveName.trim()) {
      toast.error('O nome do objetivo é obrigatório!');
      return;
    }
    addObjective(selectedProject.id, newObjectiveName);
    toast.success('Objetivo criado com sucesso!');
    setNewObjectiveName('');
  };

  const openAddTaskModal = (objectiveId) => {
    setActiveObjectiveId(objectiveId);
    setIsModalOpen(true);
  };

  // Helper to calculate project progress
  const getProjectProgress = (project) => {
    if (!project || !project.objectives || project.objectives.length === 0) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    project.objectives.forEach(obj => {
      if (obj.tasks) {
        totalTasks += obj.tasks.length;
        completedTasks += obj.tasks.filter(t => t.completed).length;
      }
    });
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div id="projects-view-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Project Selector & Creation */}
      <div id="projects-sidebar" className="lg:col-span-4 space-y-6">
        <div id="projects-header" className="flex items-center gap-2 border-b border-zinc-800 pb-5">
          <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Projetos</h1>
            <p className="text-zinc-500 text-xs">Selecione ou crie novos projetos</p>
          </div>
        </div>

        {/* Create Project Form */}
        <form id="create-project-form" onSubmit={handleCreateProject} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
            <FolderPlus className="w-4.5 h-4.5 text-orange-500" />
            <span>Novo Projeto</span>
          </h2>
          <div className="space-y-1.5">
            <input
              id="new-project-name"
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nome do projeto"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition"
            />
          </div>
          <div className="space-y-1.5">
            <input
              id="new-project-desc"
              type="text"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Descrição curta"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition"
            />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex gap-1.5">
              {['#f97316', '#10b981', '#3b82f6', '#a855f7', '#ec4899'].map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setNewProjectColor(color)}
                  className={`w-6 h-6 rounded-full border transition cursor-pointer ${
                    newProjectColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              id="submit-new-project"
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition cursor-pointer"
            >
              Criar
            </button>
          </div>
        </form>

        {/* Project List */}
        <div id="project-cards-list" className="space-y-3">
          {projects.map((project) => {
            const progress = getProjectProgress(project);
            const isSelected = selectedProject?.id === project.id;
            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => setSelectedProjectId(project.id)}
                className={`p-4 rounded-2xl border transition duration-150 cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                  isSelected
                    ? 'bg-zinc-900 border-zinc-700 shadow-xl'
                    : 'bg-zinc-900/20 border-zinc-800/40 hover:bg-zinc-900/40 hover:border-zinc-800'
                }`}
              >
                <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ backgroundColor: project.color }} />
                <div className="pl-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-white truncate">{project.name}</h3>
                    <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{project.description}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                      toast.success('Projeto eliminado!');
                    }}
                    className="text-zinc-600 hover:text-red-500 transition p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pl-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, backgroundColor: project.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Project Detail */}
      <div id="project-detail-panel" className="lg:col-span-8 space-y-6">
        {selectedProject ? (
          <>
            <div id="project-title-header" className="border-b border-zinc-800 pb-5 flex items-start justify-between gap-4">
              <div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: selectedProject.color }}
                >
                  Projeto Ativo
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-1.5">{selectedProject.name}</h1>
                <p className="text-zinc-500 text-xs mt-1">{selectedProject.description}</p>
              </div>
            </div>

            {/* Objectives List */}
            <div id="objectives-list" className="space-y-6">
              {selectedProject.objectives && selectedProject.objectives.length > 0 ? (
                selectedProject.objectives.map((objective) => (
                  <div
                    key={objective.id}
                    id={`objective-card-${objective.id}`}
                    className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                      <div>
                        <h3 className="font-bold text-sm text-white">{objective.name}</h3>
                        <p className="text-zinc-500 text-[10px]">Metas específicas do objetivo</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAddTaskModal(objective.id)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tarefa</span>
                        </button>
                        <button
                          onClick={() => {
                            deleteObjective(selectedProject.id, objective.id);
                            toast.success('Objetivo eliminado!');
                          }}
                          className="p-1.5 text-zinc-600 hover:text-red-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-2.5">
                      {objective.tasks && objective.tasks.length > 0 ? (
                        objective.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition ${
                              task.completed
                                ? 'bg-zinc-950/20 border-zinc-800/40 text-zinc-500'
                                : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={() => toggleTask(selectedProject.id, objective.id, task.id)}
                                className="text-zinc-500 hover:text-orange-500 transition cursor-pointer flex-shrink-0"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <span className={`text-xs font-semibold block truncate ${task.completed ? 'line-through' : ''}`}>
                                  {task.name}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  {task.deadline && (
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                      <CalendarIcon className="w-3 h-3" />
                                      <span>{task.deadline}</span>
                                    </span>
                                  )}
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                      task.difficulty === 'Difícil'
                                        ? 'bg-red-500/10 text-red-500'
                                        : task.difficulty === 'Médio'
                                        ? 'bg-orange-500/10 text-orange-500'
                                        : 'bg-green-500/10 text-green-500'
                                    }`}
                                  >
                                    {task.difficulty}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                deleteTask(selectedProject.id, objective.id, task.id);
                                toast.success('Tarefa eliminada!');
                              }}
                              className="text-zinc-600 hover:text-red-500 transition p-1 cursor-pointer flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-[10px] text-center py-2">Sem tarefas criadas. Adicione tarefas acima!</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div id="no-objectives-view" className="text-center py-12 bg-zinc-900/20 border border-zinc-800/60 rounded-2xl">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500 text-xs">Crie objetivos para organizar as suas metas neste projeto.</p>
                </div>
              )}
            </div>

            {/* Create Objective Form */}
            <form id="create-objective-form" onSubmit={handleCreateObjective} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center gap-3">
              <input
                id="new-objective-name"
                type="text"
                value={newObjectiveName}
                onChange={(e) => setNewObjectiveName(e.target.value)}
                placeholder="Ex: Funcionalidades de Perfil"
                className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition"
              />
              <button
                id="submit-new-objective"
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition flex-shrink-0 cursor-pointer"
              >
                Novo Objetivo
              </button>
            </form>
          </>
        ) : (
          <div id="no-projects-view" className="text-center py-24 bg-zinc-900/10 border border-zinc-800 border-dashed rounded-3xl">
            <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Nenhum projeto selecionado ou criado.</p>
          </div>
        )}
      </div>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={selectedProject?.id}
        objectiveId={activeObjectiveId}
      />
    </div>
  );
}
