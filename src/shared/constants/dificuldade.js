// ═══════════════════════════════════════════════════════════════
// MAGO — 5-level difficulty system (MAGO 2026)
// ═══════════════════════════════════════════════════════════════

export const DIFICULDADE_COLORS = {
  muito_facil: '#10B981',   // verde
  facil: '#06B6D4',         // azul claro
  medio: '#F59E0B',         // amarelo
  dificil: '#EF4444',       // vermelho
  muito_dificil: '#7C3AED', // roxo
};

export const DIFICULDADE_LABELS = {
  muito_facil: 'Muito Fácil',
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito Difícil',
};

// Status ativos para exibição
export const ACTIVE_STATUSES = ['ativa', 'gabarito_oficial', 'revisado', 'auditado'];

// Conversão letra → índice
export const LETTER_TO_INDEX = { A: 0, B: 1, C: 2, D: 3, E: 4 };
