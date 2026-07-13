import { useState } from 'react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useXPStore } from '../../../stores/useXPStore';
import { useUserStore } from '../../../stores/useUserStore';
import { usePersonaStore } from '../../../stores/usePersonaStore';
import { KeyResultBar } from './KeyResultBar';
import { TaskItem } from './TaskItem';
import { TaskFormModal } from './TaskFormModal';
import toast from 'react-hot-toast';

const KR_TIPOS = [
  { id: 'numero', label: 'Número' },
  { id: 'percentual', label: 'Percentual' },
  { id: 'monetario', label: 'Monetário' },
];

export function KRForm({ onSave, onClose, projectCor }) {
  const [form, setForm] = useState({
    titulo: '',
    metaAtual: 0,
    metaAlvo: 100,
    unidade: '',
    tipo: 'numero',
  });
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inpStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div
      className="rounded-xl p-3 border space-y-2"
      style={{ borderColor: projectCor + '44', background: projectCor + '08' }}
    >
      <input
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={inpStyle}
        placeholder="Título do Key Result..."
        value={form.titulo}
        onChange={e => sf('titulo', e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={inpStyle}
          placeholder="Atual"
          value={form.metaAtual}
          onChange={e => sf('metaAtual', Number(e.target.value))}
        />
        <input
          type="number"
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={inpStyle}
          placeholder="Meta"
          value={form.metaAlvo}
          onChange={e => sf('metaAlvo', Number(e.target.value))}
        />
        <input
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={inpStyle}
          placeholder="Unidade"
          value={form.unidade}
          onChange={e => sf('unidade', e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        {KR_TIPOS.map(t => (
          <button
            key={t.id}
            onClick={() => sf('tipo', t.id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border"
            style={{
              borderColor: form.tipo === t.id ? projectCor : 'var(--border)',
              background:
                form.tipo === t.id ? projectCor + '22' : 'transparent',
              color: form.tipo === t.id ? projectCor : 'var(--text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium border text-text-muted hover:bg-white/5"
          style={{ borderColor: 'var(--border)' }}
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            if (form.titulo.trim()) {
              onSave(form);
              onClose();
            }
          }}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: projectCor }}
        >
          Adicionar KR
        </button>
      </div>
    </div>
  );
}

export function ObjetivoItem({ objetivo, projectId, projectCor }) {
  const {
    addKeyResult,
    updateKeyResult,
    deleteKeyResult,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    updateObjetivo,
    deleteObjetivo,
  } = useProjectStore();
  const { logXP } = useXPStore();
  const { addXP } = useUserStore();
  const activePersonaId = usePersonaStore(s => s.activePersonaId);

  const [open, setOpen] = useState(true);
  const [showKRForm, setShowKRForm] = useState(false);
  const [taskModal, setTaskModal] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);

  // CORREÇÃO: Aceita 'titulo' ou 'nome' (caso venha do JSON antigo)
  const [titleVal, setTitleVal] = useState(
    objetivo.titulo || objetivo.nome || ''
  );

  // CORREÇÃO: Aceita 'keyResults' ou 'krs'
  const tasks = objetivo.tasks || [];
  const krs = objetivo.keyResults || objetivo.krs || [];
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const pct =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const handleComplete = (objetivoId, taskId) => {
    const xp = completeTask(projectId, objetivoId, taskId);
    if (xp) {
      logXP({
        action: 'TASK_COMPLETED',
        xp,
        moduleOrigin: 'projects',
        personaId: activePersonaId,
        radarAxis: 'disciplina',
      });
      addXP(xp);
      toast.success(`Task concluída! +${xp} XP ⚡`);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Header do objetivo */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <button
          className="text-xs text-text-dim w-4 transition-transform flex-shrink-0"
          style={{ transform: open ? 'rotate(90deg)' : 'none' }}
        >
          ▶
        </button>

        {editingTitle ? (
          <input
            className="flex-1 px-2 py-1 rounded-lg text-sm font-semibold outline-none"
            style={{
              background: 'var(--bg-surface-2)',
              border: `1px solid ${projectCor}`,
              color: 'var(--text-main)',
            }}
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            autoFocus
            onClick={e => e.stopPropagation()}
            onBlur={() => {
              updateObjetivo(projectId, objetivo.id, { titulo: titleVal });
              setEditingTitle(false);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                updateObjetivo(projectId, objetivo.id, { titulo: titleVal });
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <span className="flex-1 font-semibold text-sm text-text-main">
            {objetivo.titulo || objetivo.nome}
          </span>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-20 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-surface-2)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: projectCor }}
            />
          </div>
          <span className="text-xs text-text-dim w-8 text-right">{pct}%</span>
        </div>

        {/* Ações */}
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setEditingTitle(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-white/8 text-xs"
          >
            ✎
          </button>
          <button
            onClick={() => {
              if (window.confirm('Excluir objetivo e todas as suas tasks?'))
                deleteObjetivo(projectId, objetivo.id);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {open && (
        <div
          className="border-t p-4 space-y-4"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Key Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                Key Results
              </span>
              <button
                onClick={() => setShowKRForm(v => !v)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                style={{
                  background: projectCor + '18',
                  color: projectCor,
                  border: `1px solid ${projectCor}33`,
                }}
              >
                + KR
              </button>
            </div>

            {showKRForm && (
              <div className="mb-3">
                <KRForm
                  projectCor={projectCor}
                  onClose={() => setShowKRForm(false)}
                  onSave={data => addKeyResult(projectId, objetivo.id, data)}
                />
              </div>
            )}

            {krs.length === 0 && !showKRForm ? (
              <p className="text-xs text-text-dim py-2">
                Nenhum Key Result.{' '}
                <button
                  className="underline"
                  style={{ color: projectCor }}
                  onClick={() => setShowKRForm(true)}
                >
                  + Adicionar
                </button>
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {krs.map(kr => (
                  <KeyResultBar
                    key={kr.id}
                    kr={kr}
                    projectCor={projectCor}
                    onUpdate={data =>
                      updateKeyResult(projectId, objetivo.id, kr.id, data)
                    }
                    onDelete={() => {
                      if (window.confirm('Excluir KR?'))
                        deleteKeyResult(projectId, objetivo.id, kr.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                Tasks{' '}
                <span className="font-normal normal-case">
                  ({doneTasks}/{tasks.length})
                </span>
              </span>
              <button
                onClick={() => setTaskModal('new')}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                style={{
                  background: projectCor + '18',
                  color: projectCor,
                  border: `1px solid ${projectCor}33`,
                }}
              >
                + Task
              </button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-xs text-text-dim py-2">
                Nenhuma task.{' '}
                <button
                  className="underline"
                  style={{ color: projectCor }}
                  onClick={() => setTaskModal('new')}
                >
                  + Adicionar
                </button>
              </p>
            ) : (
              <div className="space-y-2">
                {/* Pendentes primeiro */}
                {[...tasks]
                  .sort((a, b) => {
                    if (a.status === 'done' && b.status !== 'done') return 1;
                    if (a.status !== 'done' && b.status === 'done') return -1;
                    const prio = { critica: 0, alta: 1, media: 2, baixa: 3 };
                    return (
                      (prio[a.prioridade] || 2) - (prio[b.prioridade] || 2)
                    );
                  })
                  .map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projectCor={projectCor}
                      onComplete={() => handleComplete(objetivo.id, task.id)}
                      onEdit={() => setTaskModal(task)}
                      onDelete={() => {
                        if (window.confirm('Excluir task?'))
                          deleteTask(projectId, objetivo.id, task.id);
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TaskFormModal */}
      {taskModal === 'new' && (
        <TaskFormModal
          projectCor={projectCor}
          onClose={() => setTaskModal(null)}
          onSave={data => addTask(projectId, objetivo.id, data)}
        />
      )}
      {taskModal && taskModal !== 'new' && (
        <TaskFormModal
          editData={taskModal}
          projectCor={projectCor}
          onClose={() => setTaskModal(null)}
          onSave={data =>
            updateTask(projectId, objetivo.id, taskModal.id, data)
          }
        />
      )}
    </div>
  );
}
