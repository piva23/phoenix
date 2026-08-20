import { useEffect } from 'react';
import { useStudyStore } from '../../stores/useStudyStore';
import toast from 'react-hot-toast';

export function useQuestionListener() {
  const addSubject = useStudyStore(s => s.addSubject);
  const addTopic = useStudyStore(s => s.addTopic);
  const addSubtopic = useStudyStore(s => s.addSubtopic);
  const updateSubtopic = useStudyStore(s => s.updateSubtopic);
  const addFlashcard = useStudyStore(s => s.addFlashcard);

  useEffect(() => {
    const handleMessage = (event) => {
      // Garantir que a mensagem é segura e tem o formato correto
      if (!event.data || event.data.type !== 'PHOENIX_NEW_QUESTION') return;

      const { disciplina, assunto, pergunta, alternativas, respostaCorreta, respostaUsuario, justificativa } = event.data.payload || {};

      if (!pergunta) return;

      // 1. Procurar ou criar a Matéria (Subject)
      let state = useStudyStore.getState();
      let subject = state.subjects.find(
        s => s.name?.toLowerCase().trim() === (disciplina || '').toLowerCase().trim()
      );

      let targetSubjectId;
      if (subject) {
        targetSubjectId = subject.id;
      } else {
        // Se a matéria não existe, procura ou cria a "Caixa de Entrada de Gaps"
        let inboxSubject = state.subjects.find(
          s => s.name === 'Caixa de Entrada de Gaps'
        );
        if (!inboxSubject) {
          const newId = `subj_inbox_${Date.now()}`;
          addSubject({
            id: newId,
            name: 'Caixa de Entrada de Gaps',
            color: '#EF4444',
            emoji: '📥'
          });
          targetSubjectId = newId;
        } else {
          targetSubjectId = inboxSubject.id;
        }
      }

      // Re-ler estado do Zustand para pegar dados atualizados do subject criado
      state = useStudyStore.getState();
      let currentSubject = state.subjects.find(s => s.id === targetSubjectId);
      if (!currentSubject) return;

      // 2. Procurar ou criar o Tópico (Topic)
      const topicName = assunto || 'Gaps Gerais';
      let topic = currentSubject.topics?.find(
        t => t.name?.toLowerCase().trim() === topicName.toLowerCase().trim()
      );

      let targetTopicId;
      if (topic) {
        targetTopicId = topic.id;
      } else {
        const newTopicId = `topic_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        addTopic(targetSubjectId, {
          id: newTopicId,
          name: topicName
        });
        targetTopicId = newTopicId;
      }

      // Re-ler estado do Zustand para obter o tópico criado
      state = useStudyStore.getState();
      currentSubject = state.subjects.find(s => s.id === targetSubjectId);
      topic = currentSubject?.topics?.find(t => t.id === targetTopicId);
      if (!topic) return;

      // 3. Procurar ou criar o Subtópico (Subtopic)
      const subtopicName = assunto || 'Gaps Importados';
      let subtopic = topic.subtopics?.find(
        st => st.name?.toLowerCase().trim() === subtopicName.toLowerCase().trim()
      );

      let targetSubtopicId;
      if (subtopic) {
        targetSubtopicId = subtopic.id;
      } else {
        const newSubtopicId = `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        addSubtopic(targetSubjectId, targetTopicId, {
          id: newSubtopicId,
          name: subtopicName
        });
        targetSubtopicId = newSubtopicId;
      }

      // Re-ler estado para obter o subtópico atualizado
      state = useStudyStore.getState();
      currentSubject = state.subjects.find(s => s.id === targetSubjectId);
      topic = currentSubject?.topics?.find(t => t.id === targetTopicId);
      subtopic = topic?.subtopics?.find(st => st.id === targetSubtopicId);
      if (!subtopic) return;

      // 4. Montar textos e adicionar o Flashcard
      const formattedAlternatives = Array.isArray(alternativas) 
        ? alternativas.map((alt, i) => `${alt}`).join('\n')
        : '';
      const frontText = `${pergunta}\n\n${formattedAlternatives}`;
      const backText = `Gabarito: ${respostaCorreta}\nSua Resposta: ${respostaUsuario}\n\nJustificativa:\n${justificativa || 'Sem justificativa registrada.'}`;

      addFlashcard(targetSubjectId, targetTopicId, targetSubtopicId, {
        front: frontText,
        back: backText,
        difficulty: 'medium'
      });

      // 5. Inserir também como um Gap na aba "Gaps & Inseguranças" para visualização instantânea
      const existingGaps = subtopic.gaps || [];
      updateSubtopic(targetSubjectId, targetTopicId, targetSubtopicId, {
        gaps: [
          ...existingGaps,
          {
            id: `gap_ext_${Date.now()}`,
            text: `[Caderno de Erros] Pergunta: ${pergunta.slice(0, 80)}... (Gabarito: ${respostaCorreta} / Sua resposta: ${respostaUsuario})`,
            date: new Date().toISOString().slice(0, 10),
            resolved: false
          }
        ]
      });

      toast.success(`Questão de "${disciplina || 'Caixa de Entrada'}" capturada no Caderno de Erros! 🎯`);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addSubject, addTopic, addSubtopic, updateSubtopic, addFlashcard]);
}
