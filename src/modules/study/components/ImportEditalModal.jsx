// ImportEditalModal.jsx — Parser hierárquico: matéria → tópico → subtópico
import { useState } from 'react';
import toast from 'react-hot-toast';

// ── helpers de parse ──────────────────────────────────────────────────────────

function getIndent(line) {
  const match = line.match(/^(\s+)/);
  if (!match) return 0;
  return match[1].replace(/\t/g, '  ').length;
}

export function parseHierarchy(text) {
  const raw = text.split('\n').filter(l => l.trim());
  if (!raw.length) return [];

  const indents = raw.map(getIndent).filter(i => i > 0);
  const step = indents.length > 0 ? Math.min(...indents) : 2;

  const subjects = [];
  let currentSubject = null;
  let currentTopic = null;

  raw.forEach(line => {
    const indent = getIndent(line);
    const level = Math.round(indent / step);
    const name = line.trim().replace(/^[-*•]\s*/, '');
    if (!name) return;

    if (level === 0) {
      currentSubject = { name, topics: [] };
      currentTopic = null;
      subjects.push(currentSubject);
    } else if (level === 1) {
      if (!currentSubject) {
        currentSubject = { name, topics: [] };
        subjects.push(currentSubject);
        return;
      }
      currentTopic = { name, subtopics: [] };
      currentSubject.topics.push(currentTopic);
    } else {
      if (!currentTopic) {
        currentTopic = { name: 'Geral', subtopics: [] };
        if (currentSubject) currentSubject.topics.push(currentTopic);
      }
      currentTopic.subtopics.push({ name });
    }
  });

  return subjects;
}

// ── componente ────────────────────────────────────────────────────────────────

export function ImportEditalModal({ onClose, onImport }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);

  function handlePreview() {
    const parsed = parseHierarchy(text);
    if (!parsed.length) {
      toast.error('Nenhuma matéria detectada. Verifique o formato.');
      return;
    }
    setPreview(parsed);
  }

  function handleImport() {
    onImport(preview);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          maxHeight: '88vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-main)' }}>
              Importar Edital
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Cole o conteúdo programático com hierarquia
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* instruções */}
          {!preview && (
            <div
              className="rounded-xl p-3 text-xs"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="font-bold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Formato — use indentação para hierarquia:
              </p>
              <pre style={{ color: 'var(--text-dim)', lineHeight: 1.8 }}>
                {`Direito Administrativo
  Licitações
    Dispensa e Inexigibilidade
    Fases do Processo Licitatório
  Atos Administrativos

Direito Constitucional
  Direitos Fundamentais
    Remédios Constitucionais`}
              </pre>
              <p className="mt-2" style={{ color: 'var(--text-dim)' }}>
                Sem recuo ={' '}
                <strong style={{ color: 'var(--text-muted)' }}>matéria</strong>{' '}
                &nbsp;|&nbsp; 1 nível ={' '}
                <strong style={{ color: 'var(--text-muted)' }}>tópico</strong>{' '}
                &nbsp;|&nbsp; 2 níveis ={' '}
                <strong style={{ color: 'var(--text-muted)' }}>aula</strong>
              </p>
            </div>
          )}

          {!preview && (
            <>
              <textarea
                rows={10}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none font-mono"
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  lineHeight: 1.7,
                }}
                placeholder={
                  'Direito Administrativo\n  Licitações\n    Dispensa e Inexigibilidade\n  Atos Administrativos\n\nDireito Constitucional\n  Direitos Fundamentais'
                }
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button
                onClick={handlePreview}
                disabled={!text.trim()}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--primary)' }}
              >
                Pré-visualizar →
              </button>
            </>
          )}

          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p
                  className="text-xs font-bold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {preview.length} matéria{preview.length !== 1 ? 's' : ''}{' '}
                  detectada{preview.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setPreview(null)}
                  className="text-xs font-bold"
                  style={{ color: 'var(--primary)' }}
                >
                  ← Editar
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {preview.map((subj, si) => (
                  <div
                    key={si}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2.5"
                      style={{ background: 'var(--primary)12' }}
                    >
                      <span
                        className="text-xs font-black"
                        style={{ color: 'var(--primary)' }}
                      >
                        📚
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--text-main)' }}
                      >
                        {subj.name}
                      </span>
                      <span
                        className="text-[10px] ml-auto"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        {subj.topics.length} tópico
                        {subj.topics.length !== 1 ? 's' : ''} ·{' '}
                        {subj.topics.reduce(
                          (a, t) => a + t.subtopics.length,
                          0
                        )}{' '}
                        aulas
                      </span>
                    </div>
                    {subj.topics.map((t, ti) => (
                      <div key={ti}>
                        <div
                          className="flex items-center gap-2 px-4 py-1.5 border-t"
                          style={{
                            borderColor: 'var(--border)',
                            background: 'var(--bg-surface-2)',
                          }}
                        >
                          <span
                            className="text-[10px]"
                            style={{ color: 'var(--text-dim)' }}
                          >
                            ├
                          </span>
                          <span
                            className="text-xs font-medium"
                            style={{ color: 'var(--text-main)' }}
                          >
                            {t.name}
                          </span>
                          {t.subtopics.length > 0 && (
                            <span
                              className="text-[9px] ml-auto"
                              style={{ color: 'var(--text-dim)' }}
                            >
                              {t.subtopics.length} aula
                              {t.subtopics.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {t.subtopics.map((st, sti) => (
                          <div
                            key={sti}
                            className="flex items-center gap-2 px-6 py-1 border-t"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <span
                              className="text-[10px]"
                              style={{ color: 'var(--text-dim)' }}
                            >
                              └
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: 'var(--text-dim)' }}
                            >
                              {st.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-3 text-xs"
                style={{
                  background: '#10B98115',
                  border: '1px solid #10B98133',
                  color: '#10B981',
                }}
              >
                ✓ Estrutura criada automaticamente em Matérias. Pesos ajustados
                no próximo passo.
              </div>
            </div>
          )}
        </div>

        <div
          className="flex gap-3 p-5 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!preview}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--primary)' }}
          >
            Criar matérias e avançar →
          </button>
        </div>
      </div>
    </div>
  );
}
