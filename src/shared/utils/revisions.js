import { addDays, today } from './time'
import { getNextRevisionDays } from '../constants/revisionStages'

export function generateRevisions(subjectId, topicId, subtopicId) {
  return Array.from({ length: 6 }, (_, i) => {
    const stage = i + 1
    return {
      id: `rev_${subtopicId}_${stage}_${Date.now()}_${i}`,
      subjectId, topicId, subtopicId,
      stage,
      revisionDate: addDays(today(), getNextRevisionDays(stage)),
      completed: false,
      score: null,
      completedAt: null,
    }
  })
}

export function generateNextRevision(existing) {
  const nextStage = existing.stage + 1
  return {
    id: `rev_${existing.subtopicId}_${nextStage}_${Date.now()}`,
    subjectId: existing.subjectId,
    topicId: existing.topicId,
    subtopicId: existing.subtopicId,
    stage: nextStage,
    revisionDate: addDays(existing.completedAt || today(), 60),
    completed: false,
    score: null,
    completedAt: null,
  }
}
