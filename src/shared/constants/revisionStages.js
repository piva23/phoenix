export const REVISION_DAYS = [1, 3, 7, 15, 30, 60]

export function getNextRevisionDays(stage) {
  if (stage <= REVISION_DAYS.length) return REVISION_DAYS[stage - 1]
  return 60
}
