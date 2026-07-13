export const XP_RULES = {
  STUDY_MINUTE:       { xp: 1,  radarAxis: 'conhecimento', label: '+1 XP por minuto' },
  QUESTION_CORRECT:   { xp: 2,  radarAxis: 'conhecimento', label: 'Questão correta' },
  MINDMAP_CREATED:    { xp: 10, radarAxis: 'conhecimento', label: 'Mapa mental' },
  FLASHCARD_REVIEWED: { xp: 2,  radarAxis: 'retencao',     label: 'Flashcard revisado' },
  SESSION_COMPLETED:  { xp: 15, radarAxis: 'disciplina',   label: 'Sessão concluída' },
  REVISION_EASY:      { xp: 5,  radarAxis: 'retencao',     label: 'Revisão fácil' },
  REVISION_MEDIUM:    { xp: 8,  radarAxis: 'retencao',     label: 'Revisão média' },
  REVISION_HARD:      { xp: 12, radarAxis: 'retencao',     label: 'Revisão difícil' },
  DAILY_STREAK:       { xp: 20, radarAxis: 'consistencia', label: 'Streak diário' },
  REDACAO_CREATED:    { xp: 25, radarAxis: 'conhecimento', label: 'Redação concluída' },
  WORKOUT_DONE:       { xp: 20, radarAxis: 'disciplina',   label: 'Treino registrado' },
  RUNNING_KM:         { xp: 15, radarAxis: 'velocidade',   label: 'Por km rodado' },
  SLEEP_LOGGED:       { xp: 5,  radarAxis: 'consistencia', label: 'Sono registrado' },
  TASK_COMPLETED:     { xp: 10, radarAxis: 'disciplina',   label: 'Task concluída' },
  NOTE_CREATED:       { xp: 8,  radarAxis: 'conhecimento', label: 'Nota criada' },
  REFLECTION_CREATED: { xp: 10, radarAxis: 'foco',         label: 'Reflexão registrada' },
  DAILY_NOTE_CREATED: { xp: 5,  radarAxis: 'consistencia', label: 'Nota diária' },
  CONCURSO_APROVADO:  { xp: 500,radarAxis: 'disciplina',   label: '🏆 Aprovado!' },
}

export const RADAR_AXES = ['conhecimento','disciplina','foco','consistencia','velocidade','retencao']
