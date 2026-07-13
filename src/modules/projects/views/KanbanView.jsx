import React, { useState } from 'react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { DndContext, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';

export function KanbanCard({ task, project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityColor = {
    critica: '#EF4444',
    alta: '#F97316',
    media: '#3B82F6',
    baixa: '#10B981',
  }[task.prioridade] || '#9CA3AF';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-xl bg-[#1e1e2d] border border-white/5 hover:border-white/10 active:cursor-grabbing cursor-grab transition-all select-none space-y-3 ${
        isDragging ? 'shadow-2xl scale-105 z-50 ring-1 ring-primary/30' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[120px]"
          style={{
            background: `${project?.color || 'var(--primary)'}22`,
            color: project?.color || 'var(--primary)',
          }}
        >
          {project?.name || 'Geral'}
        </span>
        <span
          className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ background: priorityColor + '22', color: priorityColor }}
        >
          {task.prioridade}
        </span>
      </div>

      <h5 className="text-xs font-semibold text-text-main leading-snug line-clamp-2">
        {task.title}
      </h5>

      {task.subtitle && (
        <p className="text-[10px] text-text-dim leading-relaxed line-clamp-2">
          {task.subtitle}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-text-dim">
        <span className="font-mono">{task.completedAt || 'Pendente'}</span>
        <span className="font-bold text-emerald-400">+{task.xpReward || 10} XP</span>
      </div>
    </div>
  );
}

export function KanbanColumn({ id, title, tasks, projectsById, colorAccent }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-4 flex flex-col min-h-[480px] w-[80vw] sm:w-auto sm:flex-1 transition-all duration-200 flex-shrink-0 ${
        isOver ? 'bg-white/[0.08] ring-1 ring-primary/20' : 'bg-[#15151e]'
      } border border-white/5 space-y-4`}
    >
      {/* Column Title */}
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorAccent, boxShadow: `0 0 6px ${colorAccent}` }} />
          <h4 className="text-xs font-bold text-text-main tracking-wider uppercase">
            {title}
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-dim">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] scrollbar-hide pb-4">
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              project={projectsById[task.projectId]}
            />
          ))}
          {tasks.length === 0 && (
            <div className="h-32 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-[10px] text-text-dim select-none">
              Arraste tarefas para aqui
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanView({ projectId }) {
  const { projects, updateTaskStatus } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || 'all');

  // Reacts to changes in prop projectId if any
  React.useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  // Configure sensors for touch and pointer drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require dragging a bit to avoid accidental triggers
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Long press on touch screen
        tolerance: 5,
      },
    })
  );

  // Group all tasks from either all projects or selected project
  const tasksByStatus = React.useMemo(() => {
    const groups = { todo: [], doing: [], done: [] };
    
    projects.forEach(p => {
      if (selectedProjectId !== 'all' && p.id !== selectedProjectId) return;
      
      (p.objetivos || []).forEach(o => {
        (o.tasks || []).forEach(t => {
          const taskWithContext = {
            ...t,
            projectId: p.id,
            objectiveId: o.id,
            status: t.status || 'todo', // guarantee status
          };
          if (groups[taskWithContext.status]) {
            groups[taskWithContext.status].push(taskWithContext);
          } else {
            groups.todo.push(taskWithContext); // fallback
          }
        });
      });
    });

    return groups;
  }, [projects, selectedProjectId]);

  const projectsById = React.useMemo(() => {
    return projects.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [projects]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const targetStatus = over.id; // 'todo' | 'doing' | 'done'

    // If dropped over a valid column status and is different
    if (['todo', 'doing', 'done'].includes(targetStatus)) {
      // Find current task metadata
      let foundTask = null;
      for (const p of projects) {
        for (const o of p.objetivos || []) {
          const t = (o.tasks || []).find(item => item.id === taskId);
          if (t) {
            foundTask = { task: t, pId: p.id, oId: o.id };
            break;
          }
        }
        if (foundTask) break;
      }

      if (foundTask && foundTask.task.status !== targetStatus) {
        updateTaskStatus(foundTask.pId, foundTask.oId, foundTask.task.id, targetStatus);
        toast.success(`Tarefa movida para "${
          targetStatus === 'todo' ? 'A Fazer' : targetStatus === 'doing' ? 'Em Andamento' : 'Concluído'
        }"`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtering Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">
            Quadro Executivo
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5">Sincronização de progresso Kanban</p>
        </div>

        {!projectId && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-text-dim uppercase whitespace-nowrap">Filtrar:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 sm:flex-none text-xs font-semibold bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-text-main focus:outline-none focus:border-primary/50 outline-none"
            >
              <option value="all" className="bg-[#15151e]">Todos os Projetos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-[#15151e]">{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanban Board columns wrapper */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Support swipe scroll on touch devices */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory sm:snap-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="snap-center">
            <KanbanColumn
              id="todo"
              title="A Fazer"
              tasks={tasksByStatus.todo}
              projectsById={projectsById}
              colorAccent="#3B82F6"
            />
          </div>
          <div className="snap-center">
            <KanbanColumn
              id="doing"
              title="Em Andamento"
              tasks={tasksByStatus.doing}
              projectsById={projectsById}
              colorAccent="#F59E0B"
            />
          </div>
          <div className="snap-center">
            <KanbanColumn
              id="done"
              title="Concluído"
              tasks={tasksByStatus.done}
              projectsById={projectsById}
              colorAccent="#10B981"
            />
          </div>
        </div>
      </DndContext>
    </div>
  );
}
