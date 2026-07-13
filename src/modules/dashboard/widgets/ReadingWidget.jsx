import React from 'react';

const CURRENT_BOOK = {
  title: 'Meditações de Marco Aurélio',
  author: 'Marco Aurélio',
  coverBg: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
  lastRead: 'Hoje, 14:20',
  progressPct: 62,
  chapter: 'Livro IV - O Homem Interior',
};

export function ReadingWidget() {
  return (
    <div
      className="rounded-3xl p-5 border flex flex-col justify-between relative overflow-hidden select-none"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-36 h-36 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ background: 'var(--secondary)' }} />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
              Última Leitura
            </h4>
            <p className="text-xs text-text-muted">Biblioteca & Manuais</p>
          </div>
          <span className="text-xl">📚</span>
        </div>

        {/* Book Visual Mock */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-16 rounded-lg shadow-lg flex flex-col justify-between p-2 text-white relative overflow-hidden flex-shrink-0"
            style={{ background: CURRENT_BOOK.coverBg }}
          >
            <div className="text-[8px] font-bold uppercase tracking-wider opacity-80">ESTOICO</div>
            <div className="text-[14px] font-serif font-bold text-center">🜂</div>
            <div className="text-[6px] text-center opacity-70">MEDITAÇÕES</div>
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-semibold text-text-main truncate">
              {CURRENT_BOOK.title}
            </h5>
            <p className="text-[10px] text-text-dim truncate">{CURRENT_BOOK.author}</p>
            <p className="text-[9px] text-primary font-medium mt-1">
              {CURRENT_BOOK.chapter}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-text-dim">
            <span>Progresso</span>
            <span className="font-semibold text-text-main">{CURRENT_BOOK.progressPct}%</span>
          </div>
          <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-secondary to-accent transition-all duration-300"
              style={{ width: `${CURRENT_BOOK.progressPct}%` }}
            />
          </div>
          <p className="text-[9px] text-text-dim mt-1 text-right">Lido por último: {CURRENT_BOOK.lastRead}</p>
        </div>

        {/* Action button */}
        <button
          onClick={() => alert('O Leitor de PDFs & Manuais está planejado para uma fase futura.')}
          className="w-full py-2 rounded-xl text-xs font-semibold text-text-main border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/5 transition-all text-center flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <span>📖</span> Retomar Leitura
        </button>
      </div>
    </div>
  );
}
