import { useState, useEffect } from 'react';

export function KeyResultBar({ kr, projectCor, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  // SANITIZAÇÃO: Garante que os dados existam mesmo se vierem incompletos do JSON
  const titulo = kr.titulo || kr.nome || 'Key Result sem título';
  const metaAtual = Number(kr.metaAtual) || 0;
  const metaAlvo = Number(kr.metaAlvo) || 100; // Padrão de 100 se não houver alvo definido
  const tipo = kr.tipo || 'numero';

  const [val, setVal] = useState(metaAtual);

  // Garante que o input atualize se a meta mudar por fora
  useEffect(() => {
    setVal(metaAtual);
  }, [metaAtual]);

  // Cálculo protegido contra divisão por zero
  const pct = Math.min(100, Math.round((metaAtual / (metaAlvo || 1)) * 100));

  const formatVal = v => {
    if (tipo === 'monetario') return `R$ ${Number(v).toLocaleString('pt-BR')}`;
    if (tipo === 'percentual') return `${v}%`;
    return `${v} ${kr.unidade || ''}`.trim();
  };

  const handleSave = () => {
    onUpdate({ metaAtual: Number(val) });
    setEditing(false);
  };

  return (
    <div
      className="rounded-xl p-3 border transition-all"
      style={{
        background: 'var(--bg-surface-2)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold text-text-main line-clamp-2"
            title={titulo}
          >
            {titulo}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(e => !e)}
            className="w-6 h-6 flex items-center justify-center rounded text-text-dim hover:text-text-main hover:bg-white/8 text-xs transition-colors"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden mb-1.5"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 100 ? '#10B981' : projectCor,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="w-20 px-2 py-1 rounded-lg text-xs outline-none"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                }}
                value={val}
                onChange={e => setVal(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') {
                    setVal(metaAtual);
                    setEditing(false);
                  }
                }}
              />
              <button
                onClick={handleSave}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: projectCor }}
              >
                OK
              </button>
            </div>
          ) : (
            <span
              className="text-xs font-semibold cursor-pointer hover:underline"
              style={{ color: projectCor }}
              onClick={() => setEditing(true)}
              title="Clique para atualizar o valor"
            >
              {formatVal(metaAtual)}
            </span>
          )}
          <span className="text-xs text-text-dim">/ {formatVal(metaAlvo)}</span>
        </div>
        <span
          className="text-xs font-bold"
          style={{ color: pct >= 100 ? '#10B981' : 'var(--text-dim)' }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}
