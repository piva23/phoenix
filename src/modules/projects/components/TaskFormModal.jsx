import { useState } from 'react';
import { motion } from 'framer-motion';

const PRIORIDADES = [
  { id: 'baixa', label: 'Baixa', color: '#6B6A7A', xp: 5 },
  { id: 'media', label: 'Média', color: '#3B82F6', xp: 10 },
  { id: 'alta', label: 'Alta', color: '#F59E0B', xp: 20 },
  { id: 'critica', label: 'Crítica', color: '#EF4444', xp: 30 },
];

export function TaskFormModal({
  onClose,
  onSave,
  editData = null,
  projectCor = 'var(--primary)',
}) {
  // SANITIZAÇÃO: Aceita 'titulo' ou 'nome' (caso a task venha do JSON)
  const [form, setForm] = useState({
    titulo: editData?.titulo || editData?.nome || '',
    descricao: editData?.descricao || '',
    prioridade: editData?.prioridade || 'media',
    dataInicio: editData?.dataInicio || '',
    dataFim: editData?.dataFim || '',
    milestone: editData?.milestone || false,
    status: editData?.status || 'todo',
  });

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inpStyle = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };
  const inp = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none';

  const selectedPrioridade = PRIORIDADES.find(p => p.id === form.prioridade);

  const handleSave = () => {
    if (!form.titulo.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="font-semibold text-text-main">
            {editData ? 'Editar Task' : 'Nova Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-main w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Título *
            </label>
            <input
              className={inp}
              style={inpStyle}
              placeholder="O que precisa ser feito?"
              value={form.titulo}
              onChange={e => sf('titulo', e.target.value)}
              autoFocus
              onFocus={e => (e.target.style.borderColor = projectCor)}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Descrição
            </label>
            <textarea
              rows={2}
              className={`${inp} resize-none`}
              style={inpStyle}
              placeholder="Detalhes opcionais..."
              value={form.descricao}
              onChange={e => sf('descricao', e.target.value)}
            />
          </div>

          {/* Prioridade */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
              Prioridade{' '}
              <span className="font-normal normal-case text-text-dim">
                · +{selectedPrioridade?.xp} XP ao concluir
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORIDADES.map(p => (
                <button
                  key={p.id}
                  onClick={() => sf('prioridade', p.id)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all border hover:opacity-80"
                  style={{
                    borderColor:
                      form.prioridade === p.id ? p.color : 'var(--border)',
                    background:
                      form.prioridade === p.id ? p.color + '22' : 'transparent',
                    color:
                      form.prioridade === p.id ? p.color : 'var(--text-muted)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                Data de Início
              </label>
              <input
                type="date"
                className={inp}
                style={inpStyle}
                value={form.dataInicio}
                onChange={e => sf('dataInicio', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                Prazo Final
              </label>
              <input
                type="date"
                className={inp}
                style={inpStyle}
                value={form.dataFim}
                onChange={e => sf('dataFim', e.target.value)}
              />
            </div>
          </div>

          {/* Status (só no edit) */}
          {editData && (
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'todo', label: 'A Fazer', color: '#6B6A7A' },
                  { id: 'doing', label: 'Em Andamento', color: '#F59E0B' },
                  { id: 'done', label: 'Concluído', color: '#10B981' },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => sf('status', s.id)}
                    className="py-2 rounded-xl text-xs font-semibold transition-all border hover:opacity-80"
                    style={{
                      borderColor:
                        form.status === s.id ? s.color : 'var(--border)',
                      background:
                        form.status === s.id ? s.color + '22' : 'transparent',
                      color:
                        form.status === s.id ? s.color : 'var(--text-muted)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milestone toggle */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5"
            style={{
              borderColor: form.milestone ? projectCor : 'var(--border)',
              background: form.milestone ? projectCor + '0f' : 'transparent',
            }}
            onClick={() => sf('milestone', !form.milestone)}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-sm flex-shrink-0 transition-colors"
              style={{
                background: form.milestone ? projectCor : 'var(--bg-surface-2)',
                border: `1px solid ${form.milestone ? projectCor : 'var(--border)'}`,
              }}
            >
              {form.milestone && <span className="text-white text-xs">◆</span>}
            </div>
            <div>
              <div className="text-sm font-medium text-text-main">
                Marcar como Milestone
              </div>
              <div className="text-xs text-text-dim">
                Aparece destacado no Gantt e no Calendário
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex gap-3 p-5 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-text-muted border hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: projectCor }}
          >
            {editData ? 'Salvar' : 'Criar Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
