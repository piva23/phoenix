// Question Adapter — MAGO Question Bank
// Lê questões da coleção 'questoes' no Firestore do projeto mago-question-admin
// Formato expandido para filtros avançados estilo QConcursos

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  query,
  collection,
  where,
  getDocs,
  limit as fsLimit,
} from 'firebase/firestore';

// ── Firebase init ──────────────────────────────────────────────────────

let _db = null;
let _initialized = false;

function initFirebase() {
  if (_initialized) return;
  _initialized = true;
  const config = {
    apiKey: process.env.REACT_APP_QUESTIONS_API_KEY,
    authDomain: process.env.REACT_APP_QUESTIONS_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_QUESTIONS_PROJECT_ID,
    storageBucket: process.env.REACT_APP_QUESTIONS_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_QUESTIONS_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_QUESTIONS_APP_ID,
  };
  if (!config.apiKey || !config.projectId) return;
  const app = initializeApp(config, 'mago-questions');
  _db = getFirestore(app);
}

function getDb() {
  if (!_initialized) initFirebase();
  return _db;
}

export function isQuestionsConfigured() {
  return !!(process.env.REACT_APP_QUESTIONS_API_KEY && process.env.REACT_APP_QUESTIONS_PROJECT_ID);
}

// ── Constants ──────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['ativa', 'gabarito_oficial', 'revisado', 'auditado'];
const LETTER_TO_INDEX = { A: 0, B: 1, C: 2, D: 3, E: 4 };

// ── Helpers ────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Firestore → Question (formato expandido) ───────────────────────────

function adaptToQuiz(q) {
  const sorted = [...(q.alternativas || [])]
    .sort((a, b) => (LETTER_TO_INDEX[a.id] || 0) - (LETTER_TO_INDEX[b.id] || 0));
  const letters = ['A', 'B', 'C', 'D', 'E'];

  return {
    id: q.id,
    enunciado: q.enunciado || '',
    alternativas: sorted.map((a, i) => `${letters[i]}) ${a.texto}`),
    gabarito: (q.gabarito || 'A').toUpperCase().trim(),
    // Campos principais
    materia: q.materia || 'Geral',
    topico: q.topico || '',
    subtopico: q.subtopico || null,
    assunto: q.assunto || '',
    // Metadados
    banca: q.banca || '',
    orgao: q.orgao || '',
    cargo: q.cargo || '',
    carreira: q.carreira || '',
    escolaridade: q.escolaridade || '',
    areaFormacao: q.areaFormacao || '',
    prova: q.prova || '',
    edital: q.edital || '',
    ano: q.ano || null,
    regiao: q.regiao || '',
    codigo: q.codigo || '',
    // Dificuldade e explicação
    dificuldade: q.dificuldade || null,
    explicacao: q.explicacao || '',
    tags: q.tags || [],
  };
}

// ── Query Firestore ────────────────────────────────────────────────────

async function fetchActive(maxCount = 500) {
  const db = getDb();
  if (!db || !isQuestionsConfigured()) return [];

  try {
    const q = query(
      collection(db, 'questoes'),
      where('status', 'in', ACTIVE_STATUSES),
      fsLimit(maxCount)
    );
    const snap = await getDocs(q);
    const out = [];
    snap.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      if (data.tipo === 'multipla_escolha' && !data.anulada) {
        out.push(data);
      }
    });
    return out;
  } catch (error) {
    console.error('[MAGO] Erro ao buscar questões:', error);
    return [];
  }
}

// ── Extração de valores únicos para filtros ────────────────────────────

function extractUniqueValues(rawDocs) {
  const maps = {
    materias: {},
    assuntos: {},
    bancas: {},
    anos: {},
    orgaos: {},
    cargos: {},
    escolaridades: {},
    areasFormacao: {},
    dificuldades: {},
  };

  for (const q of rawDocs) {
    if (q.materia) maps.materias[q.materia] = (maps.materias[q.materia] || 0) + 1;
    if (q.assunto) maps.assuntos[q.assunto] = (maps.assuntos[q.assunto] || 0) + 1;
    if (q.banca) maps.bancas[q.banca] = (maps.bancas[q.banca] || 0) + 1;
    if (q.ano) maps.anos[String(q.ano)] = (maps.anos[String(q.ano)] || 0) + 1;
    if (q.orgao) maps.orgaos[q.orgao] = (maps.orgaos[q.orgao] || 0) + 1;
    if (q.cargo) maps.cargos[q.cargo] = (maps.cargos[q.cargo] || 0) + 1;
    if (q.escolaridade) maps.escolaridades[q.escolaridade] = (maps.escolaridades[q.escolaridade] || 0) + 1;
    if (q.areaFormacao) maps.areasFormacao[q.areaFormacao] = (maps.areasFormacao[q.areaFormacao] || 0) + 1;
    if (q.dificuldade) maps.dificuldades[q.dificuldade] = (maps.dificuldades[q.dificuldade] || 0) + 1;
  }

  const toSorted = obj =>
    Object.entries(obj)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  return {
    materias: toSorted(maps.materias),
    assuntos: toSorted(maps.assuntos),
    bancas: toSorted(maps.bancas),
    anos: toSorted(maps.anos).sort((a, b) => Number(b.name) - Number(a.name)),
    orgaos: toSorted(maps.orgaos),
    cargos: toSorted(maps.cargos),
    escolaridades: toSorted(maps.escolaridades),
    areasFormacao: toSorted(maps.areasFormacao),
    dificuldades: toSorted(maps.dificuldades),
  };
}

// ── Public API ─────────────────────────────────────────────────────────

// Cache local para evitar queries repetidas ao Firestore
let _rawCache = null;
let _rawCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getRawDocs() {
  const now = Date.now();
  if (!_rawCache || (now - _rawCacheTime) > CACHE_TTL) {
    _rawCache = await fetchActive(1000);
    _rawCacheTime = now;
  }
  return _rawCache;
}

export const questionAdapter = {
  /** Buscar todas as questões ativas (formato QuizQuestion) */
  async fetchAll(count = 500) {
    const all = await getRawDocs();
    return all.slice(0, count).map(adaptToQuiz);
  },

  /** Quiz por matéria/tópico */
  async getQuizBySubject(subject, count = 20) {
    if (!subject || subject.trim() === '') return this.fetchAll(count);
    const all = await getRawDocs();
    const filtered = all.filter(q =>
      q.materia?.toLowerCase().includes(subject.toLowerCase()) ||
      q.topico?.toLowerCase().includes(subject.toLowerCase()) ||
      q.subtopico?.toLowerCase().includes(subject.toLowerCase()) ||
      q.assunto?.toLowerCase().includes(subject.toLowerCase())
    );
    return shuffle(filtered).slice(0, count).map(adaptToQuiz);
  },

  /** Quiz aleatório */
  async getRandomQuiz(count = 20) {
    const all = await getRawDocs();
    return shuffle(all).slice(0, count).map(adaptToQuiz);
  },

  /** Opções de filtro (valores únicos com contadores) */
  async getFilterOptions() {
    const all = await getRawDocs();
    return extractUniqueValues(all);
  },

  /** Busca com filtros complexos */
  async fetchWithFilters(filters = {}) {
    const all = await getRawDocs();
    let result = all;

    // Filtro por matérias (multi-select)
    if (filters.materias && filters.materias.length > 0) {
      const set = new Set(filters.materias.map(m => m.toLowerCase()));
      result = result.filter(q => set.has(q.materia?.toLowerCase()));
    }

    // Filtro por assuntos (multi-select)
    if (filters.assuntos && filters.assuntos.length > 0) {
      const set = new Set(filters.assuntos.map(a => a.toLowerCase()));
      result = result.filter(q =>
        set.has(q.assunto?.toLowerCase()) || set.has(q.topico?.toLowerCase())
      );
    }

    // Filtro por bancas (multi-select)
    if (filters.bancas && filters.bancas.length > 0) {
      const set = new Set(filters.bancas.map(b => b.toLowerCase()));
      result = result.filter(q => set.has(q.banca?.toLowerCase()));
    }

    // Filtro por anos (multi-select)
    if (filters.anos && filters.anos.length > 0) {
      const set = new Set(filters.anos.map(Number));
      result = result.filter(q => q.ano && set.has(q.ano));
    }

    // Filtro por dificuldades (multi-select)
    if (filters.dificuldades && filters.dificuldades.length > 0) {
      const set = new Set(filters.dificuldades);
      result = result.filter(q => q.dificuldade && set.has(q.dificuldade));
    }

    // Filtro por orgaos (multi-select)
    if (filters.orgaos && filters.orgaos.length > 0) {
      const set = new Set(filters.orgaos.map(o => o.toLowerCase()));
      result = result.filter(q => set.has(q.orgao?.toLowerCase()));
    }

    // Filtro por cargos (multi-select)
    if (filters.cargos && filters.cargos.length > 0) {
      const set = new Set(filters.cargos.map(c => c.toLowerCase()));
      result = result.filter(q => set.has(q.cargo?.toLowerCase()));
    }

    // Filtro por palavra-chave
    if (filters.keyword && filters.keyword.trim()) {
      const kw = filters.keyword.toLowerCase().trim();
      result = result.filter(q =>
        q.enunciado?.toLowerCase().includes(kw) ||
        q.topico?.toLowerCase().includes(kw) ||
        q.assunto?.toLowerCase().includes(kw) ||
        q.materia?.toLowerCase().includes(kw) ||
        (q.tags && q.tags.some(t => t.toLowerCase().includes(kw)))
      );
    }

    return result.map(adaptToQuiz);
  },

  /** Busca matérias únicas com contadores */
  async getSubjects() {
    const all = await getRawDocs();
    const map = {};
    for (const q of all) {
      const m = q.materia || 'Geral';
      map[m] = (map[m] || 0) + 1;
    }
    return Object.entries(map)
      .map(([materia, count]) => ({ materia, count }))
      .sort((a, b) => b.count - a.count);
  },

  /** Estatísticas do banco */
  async getStats() {
    const all = await getRawDocs();
    const porMateria = {};
    for (const q of all) {
      const m = q.materia || 'Geral';
      porMateria[m] = (porMateria[m] || 0) + 1;
    }
    return { total: all.length, porMateria };
  },

  /** Verifica se o banco tem questões */
  async isAvailable() {
    const all = await getRawDocs();
    return all.length > 0;
  },

  /** Limpar cache (para re-sync) */
  clearCache() {
    _rawCache = null;
    _rawCacheTime = 0;
  },
};
