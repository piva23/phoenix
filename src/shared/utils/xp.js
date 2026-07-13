export function calcLevel(totalXP) {
  let level = 1
  while (100 * Math.pow(level + 1, 2) <= totalXP) level++
  return level
}

export function calcXPForLevel(level) {
  return 100 * Math.pow(level, 2)
}

export function calcXPProgress(totalXP) {
  const level = calcLevel(totalXP)
  const currentLevelXP = calcXPForLevel(level)
  const nextLevelXP = calcXPForLevel(level + 1)
  const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
  return {
    level,
    currentXP: totalXP - currentLevelXP,
    neededXP: nextLevelXP - currentLevelXP,
    progress: Math.min(100, Math.max(0, progress)),
  }
}
