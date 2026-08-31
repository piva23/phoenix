// Gemini AI Service — Sugestões inteligentes para o banco de questões
// Usa a API do Google Gemini para:
// 1. Sugerir mapeamento de matérias MAGO → matérias do ciclo
// 2. Analisar padrões de erro e sugerir foco de estudo

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey() {
  return process.env.REACT_APP_GEMINI_API_KEY || '';
}

function isAvailable() {
  return !!getApiKey();
}

// ── Levenshtein distance (fallback local) ──────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ── Local suggestion engine (no API needed) ────────────────────────────

function suggestLocal(magoMaterias, cycleSubjects) {
  const suggestions = [];

  for (const materia of magoMaterias) {
    const mLower = materia.toLowerCase();

    // 1. Exact match
    const exact = cycleSubjects.find(s => s.name.toLowerCase() === mLower);
    if (exact) {
      suggestions.push({ mago: materia, target: exact.id, targetName: exact.name, confidence: 'exact', score: 100 });
      continue;
    }

    // 2. Partial match (one contains the other)
    const partial = cycleSubjects.find(s => {
      const sLower = s.name.toLowerCase();
      return sLower.includes(mLower) || mLower.includes(sLower);
    });
    if (partial) {
      suggestions.push({ mago: materia, target: partial.id, targetName: partial.name, confidence: 'partial', score: 80 });
      continue;
    }

    // 3. Levenshtein distance
    let bestMatch = null;
    let bestScore = 0;
    for (const s of cycleSubjects) {
      const dist = levenshtein(mLower, s.name.toLowerCase());
      const maxLen = Math.max(mLower.length, s.name.toLowerCase().length);
      const score = Math.round((1 - dist / maxLen) * 100);
      if (score > bestScore && score >= 60) {
        bestScore = score;
        bestMatch = s;
      }
    }
    if (bestMatch) {
      suggestions.push({ mago: materia, target: bestMatch.id, targetName: bestMatch.name, confidence: 'similar', score: bestScore });
      continue;
    }

    // 4. No match — suggest creating new
    suggestions.push({ mago: materia, target: null, targetName: null, confidence: 'none', score: 0 });
  }

  return suggestions.sort((a, b) => b.score - a.score);
}

// ── Gemini API call ────────────────────────────────────────────────────

async function callGemini(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('[Gemini] Erro na chamada:', error);
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────

export const geminiService = {
  /** Verifica se a API está configurada */
  isAvailable,

  /**
   * Sugere mapeamento de matérias MAGO → matérias do ciclo
   * @param {string[]} magoMaterias - nomes das matérias do MAGO
   * @param {{ id: string, name: string }[]} cycleSubjects - matérias do ciclo
   * @returns {Promise<Array<{ mago: string, target: string|null, targetName: string|null, confidence: string, score: number }>>}
   */
  async suggestSubjectMapping(magoMaterias, cycleSubjects) {
    // Try Gemini first
    if (isAvailable()) {
      const prompt = `Analise o mapeamento entre matérias de um banco de questões (MAGO) e as matérias do ciclo de estudo do usuário.

Matérias MAGO: ${JSON.stringify(magoMaterias)}
Matérias do ciclo: ${JSON.stringify(cycleSubjects.map(s => ({ id: s.id, name: s.name })))}

Para cada matéria MAGO, sugira a melhor matéria do ciclo para vincular. Retorne um JSON array no formato:
[{ "mago": "nome da materia mago", "targetId": "id da materia do ciclo ou null", "confidence": "exact|partial|similar|none", "score": 0-100 }]

Se não houver correspondência, retorne targetId null. Seja preciso e considere sinônimos e variações comuns.`;

      const response = await callGemini(prompt);
      if (response) {
        try {
          // Extract JSON from response
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.map(item => ({
              mago: item.mago,
              target: item.targetId,
              targetName: cycleSubjects.find(s => s.id === item.targetId)?.name || null,
              confidence: item.confidence || 'ai',
              score: item.score || 50,
            }));
          }
        } catch (e) {
          console.warn('[Gemini] Erro ao parsear resposta:', e);
        }
      }
    }

    // Fallback: local engine
    return suggestLocal(magoMaterias, cycleSubjects);
  },

  /**
   * Analisa padrões de erro e sugere foco de estudo
   * @param {Array<{ questionId, correct, question }>} results - resultados da prática
   * @returns {Promise<{ weakTopics: string[], suggestions: string[], focusArea: string }>}
   */
  async analyzeErrorPatterns(results) {
    const wrong = results.filter(r => !r.correct && r.question);
    const correct = results.filter(r => r.correct && r.question);

    // Group by materia/topico
    const errorsByMateria = {};
    const errorsByTopico = {};
    for (const r of wrong) {
      const m = r.question.materia || 'Geral';
      const t = r.question.topico || 'Geral';
      errorsByMateria[m] = (errorsByMateria[m] || 0) + 1;
      errorsByTopico[t] = (errorsByTopico[t] || 0) + 1;
    }

    const weakTopics = Object.entries(errorsByTopico)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    const weakMaterias = Object.entries(errorsByMateria)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([materia]) => materia);

    // Try Gemini for richer analysis
    if (isAvailable() && wrong.length >= 3) {
      const prompt = `Analise os erros do usuário em questões de concurso e sugira plano de estudo.

Erros por matéria: ${JSON.stringify(errorsByMateria)}
Erros por tópico: ${JSON.stringify(errorsByTopico)}
Total de questões: ${results.length} (${correct.length} acertos, ${wrong.length} erros)

Sugira:
1. Áreas prioritárias de estudo (máx 3)
2. Tópicos específicos para revisar (máx 5)
3. Estratégia de estudo baseada nos padrões de erro

Retorne um JSON: { "focusArea": "...", "suggestions": ["...", "..."] }`;

      const response = await callGemini(prompt);
      if (response) {
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              weakTopics,
              focusArea: parsed.focusArea || weakMaterias[0] || '',
              suggestions: parsed.suggestions || [],
            };
          }
        } catch (e) {
          console.warn('[Gemini] Erro ao parsear análise:', e);
        }
      }
    }

    // Fallback
    return {
      weakTopics,
      focusArea: weakMaterias[0] || '',
      suggestions: [
        `Revise os tópicos: ${weakTopics.slice(0, 3).join(', ')}`,
        `Foque na matéria: ${weakMaterias[0] || 'Geral'}`,
        wrong.length > correct.length ? 'Pratique mais questões fáceis antes de avançar' : 'Continue praticando para fixar',
      ],
    };
  },
};
