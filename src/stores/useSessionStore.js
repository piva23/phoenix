import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCycleStore } from './useCycleStore';

// Formato esperado de uma sessão:
// {
//   id, subjectId, topicId, subtopicId,
//   studyType: 'teoria' | 'questoes' | 'revisao' | 'anki' | 'feynman' | 'pdf' | 'video' | 'mapa',
//   totalMinutes, questionsAnswered, questionsCorrect,
//   difficulty, focus, energy,   // 1-5
//   notes, date (YYYY-MM-DD), finishedAt (timestamp)
// }

export const useSessionStore = create(
  persist(
    (set, get) => ({
      sessions: [],

      // ─── AÇÕES ────────────────────────────────────────────────────────────

      addSession: data => {
        const isQuestions =
          data.studyType === 'questoes' ||
          (data.modes && data.modes.includes('questoes'));

        const session = {
          ...data,
          id: `sess_${Date.now()}`,
          createdAt: Date.now(),
          // Garante que questões só existem quando tipo = 'questoes'
          questionsAnswered: isQuestions ? data.questionsAnswered || 0 : 0,
          questionsCorrect: isQuestions ? data.questionsCorrect || 0 : 0,
        };
        set(state => ({ sessions: [...state.sessions, session] }));

        // Integração com ciclo: dispara addMinutesToItem se houver ciclo ativo.
        try {
          const cycleState = useCycleStore.getState();
          const cycle = cycleState.getActiveCycle();
          if (cycle && session.subjectId) {
            const item = cycle.items?.find(
              i => i.subjectId === session.subjectId
            );
            if (item) {
              cycleState.addMinutesToItem(
                cycle.id,
                item.id,
                session.totalMinutes || 0
              );
            }
          }
        } catch (_) {
          // Store do ciclo não disponível — sem efeito colateral
        }

        return session;
      },

      deleteSession: id =>
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== id),
        })),

      // ─── SELETORES ────────────────────────────────────────────────────────

      // Todas as sessões de uma data específica (YYYY-MM-DD)
      getByDate: date => get().sessions.filter(s => s.date === date),

      // Todas as sessões de uma matéria
      getBySubject: subjectId =>
        get().sessions.filter(s => s.subjectId === subjectId),

      // Sessões em um intervalo de datas (inclusivo)
      getByDateRange: (from, to) =>
        get().sessions.filter(s => s.date >= from && s.date <= to),

      // Sessões de um subtópico específico
      getBySubtopic: subtopicId =>
        get().sessions.filter(s => s.subtopicId === subtopicId),

      // Total de minutos estudados numa data
      getTodayMinutes: date => {
        const d = date || new Date().toISOString().slice(0, 10);
        return get()
          .sessions.filter(s => s.date === d)
          .reduce((acc, s) => acc + (s.totalMinutes || 0), 0);
      },

      // % de acerto de uma matéria (apenas sessões tipo 'questoes')
      getAccuracyBySubject: subjectId => {
        const sessions = get().sessions.filter(
          s => s.subjectId === subjectId && s.studyType === 'questoes'
        );
        const totalAnswered = sessions.reduce(
          (a, s) => a + (s.questionsAnswered || 0),
          0
        );
        const totalCorrect = sessions.reduce(
          (a, s) => a + (s.questionsCorrect || 0),
          0
        );
        if (totalAnswered === 0) return null;
        return Math.round((totalCorrect / totalAnswered) * 100);
      },

      // % de acerto de uma matéria agrupado por data — para o gráfico de evolução
      getAccuracyTimelineBySubject: subjectId => {
        const sessions = get().sessions.filter(
          s => s.subjectId === subjectId && s.studyType === 'questoes'
        );
        const byDate = {};
        sessions.forEach(s => {
          if (!byDate[s.date]) byDate[s.date] = { answered: 0, correct: 0 };
          byDate[s.date].answered += s.questionsAnswered || 0;
          byDate[s.date].correct += s.questionsCorrect || 0;
        });
        return Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, v]) => ({
            date,
            accuracy:
              v.answered > 0
                ? Math.round((v.correct / v.answered) * 100)
                : null,
            answered: v.answered,
            correct: v.correct,
          }));
      },

      // Minutos por data — para o heatmap (retorna { 'YYYY-MM-DD': minutes })
      getHeatmapData: () => {
        const map = {};
        get().sessions.forEach(s => {
          map[s.date] = (map[s.date] || 0) + (s.totalMinutes || 0);
        });
        return map;
      },

      // Minutos totais por matéria — para pizza/barras do analytics
      getMinutesBySubject: () => {
        const map = {};
        get().sessions.forEach(s => {
          map[s.subjectId] = (map[s.subjectId] || 0) + (s.totalMinutes || 0);
        });
        return map;
      },

      // Streak: quantos dias consecutivos até hoje com pelo menos 1 sessão
      getStreak: () => {
        const today = new Date().toISOString().slice(0, 10);
        const daysWithSessions = new Set(get().sessions.map(s => s.date));
        let streak = 0;
        let cursor = new Date(today);
        while (true) {
          const dateStr = cursor.toISOString().slice(0, 10);
          if (!daysWithSessions.has(dateStr)) break;
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
      },

      // KPIs gerais de uma matéria (para o card de matéria)
      getSubjectKPIs: subjectId => {
        const sessions = get().sessions.filter(s => s.subjectId === subjectId);
        const questionSessions = sessions.filter(
          s => s.studyType === 'questoes'
        );
        const totalAnswered = questionSessions.reduce(
          (a, s) => a + (s.questionsAnswered || 0),
          0
        );
        const totalCorrect = questionSessions.reduce(
          (a, s) => a + (s.questionsCorrect || 0),
          0
        );
        return {
          totalMinutes: sessions.reduce((a, s) => a + (s.totalMinutes || 0), 0),
          totalSessions: sessions.length,
          questionsAnswered: totalAnswered,
          questionsCorrect: totalCorrect,
          accuracy:
            totalAnswered > 0
              ? Math.round((totalCorrect / totalAnswered) * 100)
              : null,
          lastStudied:
            sessions.length > 0
              ? sessions.sort((a, b) => b.finishedAt - a.finishedAt)[0].date
              : null,
        };
      },
    }),
    { name: 'phoenix-sessions' }
  )
);
