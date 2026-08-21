import {
  calcXpForNextLevel,
  calcLevel,
  calcLevelProgress,
  calcXPProgress,
  XP_TIERS,
  ATTRIBUTES,
  RADAR_AXES,
  XP_RULES,
} from '../useGameStore';

// ── calcXpForNextLevel ────────────────────────────────────────────────────────

describe('calcXpForNextLevel', () => {
  test('level 1 returns 175 (100 + 50 + 25)', () => {
    expect(calcXpForNextLevel(1)).toBe(175);
  });

  test('level 2 returns 300 (100 + 100 + 100)', () => {
    expect(calcXpForNextLevel(2)).toBe(300);
  });

  test('clamps level to minimum 1', () => {
    expect(calcXpForNextLevel(0)).toBe(175);
    expect(calcXpForNextLevel(-5)).toBe(175);
    expect(calcXpForNextLevel(NaN)).toBe(175);
  });

  test('level 5 returns 975 (100 + 250 + 625)', () => {
    expect(calcXpForNextLevel(5)).toBe(975);
  });

  test('level 10 returns 3100 (100 + 500 + 2500)', () => {
    expect(calcXpForNextLevel(10)).toBe(3100);
  });
});

// ── calcLevel ─────────────────────────────────────────────────────────────────

describe('calcLevel', () => {
  test('0 XP = level 1', () => {
    expect(calcLevel(0)).toBe(1);
  });

  test('174 XP = level 1 (not enough for level 2)', () => {
    expect(calcLevel(174)).toBe(1);
  });

  test('175 XP = level 2 (exactly threshold)', () => {
    expect(calcLevel(175)).toBe(2);
  });

  test('299 XP = level 2 (below level 2 requirement of 300)', () => {
    expect(calcLevel(299)).toBe(2);
  });

  test('300 XP = level 3 (meets level 2 req, check level 3)', () => {
    expect(calcLevel(300)).toBe(3);
  });

  test('handles very large XP', () => {
    expect(calcLevel(100000)).toBeGreaterThan(20);
  });
});

// ── calcLevelProgress ─────────────────────────────────────────────────────────

describe('calcLevelProgress', () => {
  test('at 0 XP: level 1, 0 currentXP, 175 needed', () => {
    const result = calcLevelProgress(0);
    expect(result.level).toBe(1);
    expect(result.currentXP).toBe(0);
    expect(result.neededXP).toBe(175);
    expect(result.progress).toBe(0);
  });

  test('at 175 XP: level 2, reset progress', () => {
    const result = calcLevelProgress(175);
    expect(result.level).toBe(2);
    expect(result.currentXP).toBe(0);
    expect(result.neededXP).toBe(300);
  });

  test('progress never exceeds 100', () => {
    const result = calcLevelProgress(10000);
    expect(result.progress).toBeLessThanOrEqual(100);
  });

  test('progress is a whole number', () => {
    const result = calcLevelProgress(500);
    expect(Number.isInteger(result.progress)).toBe(true);
  });
});

// ── calcXPProgress (compat) ───────────────────────────────────────────────────

describe('calcXPProgress', () => {
  test('returns same shape as calcLevelProgress', () => {
    const result = calcXPProgress(500);
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('currentXP');
    expect(result).toHaveProperty('neededXP');
    expect(result).toHaveProperty('progress');
  });
});

// ── Constants ─────────────────────────────────────────────────────────────────

describe('constants', () => {
  test('XP_TIERS has all tiers', () => {
    expect(XP_TIERS.D).toBe(5);
    expect(XP_TIERS.C).toBe(30);
    expect(XP_TIERS.B).toBe(120);
    expect(XP_TIERS.A).toBe(500);
  });

  test('ATTRIBUTES has 5 attributes', () => {
    expect(Object.keys(ATTRIBUTES)).toHaveLength(5);
  });

  test('RADAR_AXES has 6 axes', () => {
    expect(RADAR_AXES).toHaveLength(6);
  });

  test('XP_RULES has STUDY_MINUTE rule', () => {
    expect(XP_RULES.STUDY_MINUTE.xp).toBe(1);
  });
});
