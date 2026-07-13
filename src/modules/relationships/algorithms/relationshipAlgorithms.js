/**
 * relationshipAlgorithms.js
 *
 * Arquivo isolado com toda a lógica de análise de relacionamentos.
 * Evolua este arquivo livremente sem tocar nos componentes.
 *
 * Baseado em:
 * - 5 Linguagens do Amor (Gary Chapman)
 * - Teoria do Apego (Bowlby / Ainsworth)
 * - Círculos de Dunbar (Robin Dunbar)
 * - Reciprocidade Social (Cialdini)
 * - MBTI / tipologia de personalidade
 */

// ── Constantes de configuração ────────────────────────────────────────────────

export const RELATIONSHIP_LEVELS = [
  { min: 0,  max: 10,  label: 'Desconhecido',      emoji: '🌑', color: '#475569' },
  { min: 11, max: 20,  label: 'Conhecido',          emoji: '👋', color: '#64748B' },
  { min: 21, max: 35,  label: 'Colega',             emoji: '🤝', color: '#94A3B8' },
  { min: 36, max: 50,  label: 'Amigo',              emoji: '😊', color: '#38BDF8' },
  { min: 51, max: 65,  label: 'Amigo Próximo',      emoji: '☕', color: '#818CF8' },
  { min: 66, max: 78,  label: 'Confidente',         emoji: '💛', color: '#F59E0B' },
  { min: 79, max: 88,  label: 'Amigo Íntimo',       emoji: '🔥', color: '#F97316' },
  { min: 89, max: 95,  label: 'Pessoa de Confiança',emoji: '💜', color: '#A855F7' },
  { min: 96, max: 99,  label: 'Vínculo Profundo',   emoji: '❤️', color: '#EF4444' },
  { min: 100,max: 100, label: 'Alma Gêmea',         emoji: '⭐', color: '#F59E0B' },
]

export const CATEGORIES = [
  { id: 'partner',    label: 'Casal / Parceiro',     emoji: '❤️',  color: '#EF4444' },
  { id: 'family',     label: 'Família Próxima',      emoji: '👨‍👩‍👧', color: '#F97316' },
  { id: 'family_ext', label: 'Família Extensa',      emoji: '🏠',  color: '#FB923C' },
  { id: 'best_friend',label: 'Amigo Íntimo',         emoji: '⭐',  color: '#A855F7' },
  { id: 'friend',     label: 'Amigo',                emoji: '😄',  color: '#38BDF8' },
  { id: 'coworker',   label: 'Colega de Trabalho',   emoji: '🤝',  color: '#6366F1' },
  { id: 'mentor',     label: 'Mentor / Referência',  emoji: '🎓',  color: '#10B981' },
  { id: 'networking', label: 'Networking',            emoji: '🌱',  color: '#14B8A6' },
  { id: 'child',      label: 'Filho / Afilhado',     emoji: '👶',  color: '#F59E0B' },
  { id: 'community',  label: 'Comunidade / Espiritual', emoji: '🙏', color: '#8B5CF6' },
]

export const LOVE_LANGUAGES = [
  { id: 'words',    label: 'Palavras de Afirmação', emoji: '💬', desc: 'Elogios, incentivo verbal, expressar sentimentos' },
  { id: 'time',     label: 'Tempo de Qualidade',    emoji: '⏱️', desc: 'Atenção plena, presença, atividades juntos' },
  { id: 'gifts',    label: 'Presentes',             emoji: '🎁', desc: 'Gestos tangíveis, lembrar datas, surpresas' },
  { id: 'service',  label: 'Atos de Serviço',       emoji: '🛠️', desc: 'Ajuda prática, aliviar responsabilidades' },
  { id: 'touch',    label: 'Toque Físico',           emoji: '🤗', desc: 'Abraço, aperto de mão, presença física' },
]

export const ATTACHMENT_TYPES = [
  { id: 'secure',       label: 'Seguro',        emoji: '🟢', desc: 'Confortável com intimidade e autonomia. Comunicativo, estável.' },
  { id: 'anxious',      label: 'Ansioso',       emoji: '🟡', desc: 'Busca muita validação. Medo de abandono. Precisa de reassurance.' },
  { id: 'avoidant',     label: 'Evitativo',     emoji: '🔵', desc: 'Valoriza autonomia acima de tudo. Dificuldade com intimidade.' },
  { id: 'disorganized', label: 'Desorganizado', emoji: '🔴', desc: 'Misto de ansioso e evitativo. Comportamento imprevisível.' },
]

export const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
]

export const INTEREST_TAGS = [
  '🎮 Games', '📚 Leitura', '🎬 Cinema', '🎵 Música', '⚽ Esportes',
  '🍕 Gastronomia', '✈️ Viagens', '🎨 Arte', '💻 Tecnologia', '📈 Finanças',
  '🏋️ Academia', '🧘 Meditação', '🌿 Natureza', '🐾 Pets', '🎯 Empreendedorismo',
  '📸 Fotografia', '🍳 Culinária', '🎸 Instrumento', '✍️ Escrita', '🏃 Corrida',
  '🧩 Estratégia', '🌍 Política', '🔬 Ciência', '🎭 Teatro', '📱 Redes Sociais',
]

export const INTERACTION_TYPES = [
  // CONEXÃO
  { id: 'casual_chat',    group: 'Conexão',   label: 'Conversa casual',          emoji: '💬', points: 5  },
  { id: 'deep_talk',      group: 'Conexão',   label: 'Conversa profunda',        emoji: '🧠', points: 12 },
  { id: 'laughed',        group: 'Conexão',   label: 'Momento de risada',        emoji: '😂', points: 8  },
  { id: 'shared_secret',  group: 'Conexão',   label: 'Compartilhou algo íntimo', emoji: '🤫', points: 15 },
  // PRESENÇA
  { id: 'meetup',         group: 'Presença',  label: 'Encontro ao vivo',         emoji: '☕', points: 20 },
  { id: 'activity',       group: 'Presença',  label: 'Programa juntos',          emoji: '🎬', points: 18 },
  { id: 'sport',          group: 'Presença',  label: 'Atividade física juntos',  emoji: '🏃', points: 15 },
  // SUPORTE
  { id: 'listened',       group: 'Suporte',   label: 'Ouvi e apoiei',            emoji: '👂', points: 20 },
  { id: 'helped',         group: 'Suporte',   label: 'Ajudei com algo real',     emoji: '🤝', points: 25 },
  { id: 'crisis',         group: 'Suporte',   label: 'Presente em momento difícil', emoji: '🚨', points: 35 },
  // GENTILEZA
  { id: 'gift',           group: 'Gentileza', label: 'Presente / gesto',         emoji: '🎁', points: 18 },
  { id: 'called',         group: 'Gentileza', label: 'Liguei sem motivo',        emoji: '📞', points: 10 },
  { id: 'special_msg',    group: 'Gentileza', label: 'Mensagem especial',        emoji: '💌', points: 8  },
  { id: 'birthday',       group: 'Gentileza', label: 'Lembrei o aniversário',    emoji: '🎂', points: 20 },
  // CONFLITO
  { id: 'disagreement',   group: 'Conflito',  label: 'Desentendimento',          emoji: '😠', points: -10 },
  { id: 'hurt',           group: 'Conflito',  label: 'Mágoa causada',            emoji: '💔', points: -25 },
]

export const BADGES = [
  { id: 'birthday_star',  label: 'Aniversariante',      emoji: '🎂', desc: 'Faz aniversário este mês' },
  { id: 'streak_30',      label: 'Contato Consistente', emoji: '🔥', desc: 'Contato nos últimos 30 dias' },
  { id: 'soul_mate',      label: 'Alma Gêmea',          emoji: '⭐', desc: 'Relacionamento 100' },
  { id: 'mentor_badge',   label: 'Mentor',              emoji: '🎓', desc: 'Te ensina ou inspira' },
  { id: 'support',        label: 'Meu Apoio',           emoji: '💪', desc: 'Já esteve presente em momentos difíceis' },
  { id: 'new_bond',       label: 'Vínculo Novo',        emoji: '🌱', desc: 'Menos de 3 meses de amizade' },
  { id: 'long_time',      label: 'Amizade Antiga',      emoji: '🏛️', desc: 'Mais de 5 anos de amizade' },
  { id: 'influence',      label: 'Grande Influência',   emoji: '🧲', desc: 'Impacta muito sua vida' },
  { id: 'common_goal',    label: 'Meta em Comum',       emoji: '🎯', desc: 'Trabalham em algo juntos' },
  { id: 'cooling',        label: 'Esfriando',           emoji: '❄️', desc: 'Sem contato há mais de 30 dias' },
]

// ── Funções de nível ─────────────────────────────────────────────────────────

export function getLevel(score) {
  return RELATIONSHIP_LEVELS.find(l => score >= l.min && score <= l.max)
    || RELATIONSHIP_LEVELS[0]
}

export function getLevelColor(score) {
  return getLevel(score).color
}

// ── Decaimento automático ─────────────────────────────────────────────────────

/**
 * Calcula decaimento da pontuação com base nos dias sem contato.
 * Ajuste a curva aqui para calibrar o comportamento.
 *
 * @param {number} currentScore  - pontuação atual
 * @param {number} daysSinceLast - dias desde última interação
 * @returns {number} nova pontuação
 */
export function calcDecay(currentScore, daysSinceLast) {
  if (daysSinceLast <= 14) return currentScore            // 0-14 dias: sem decaimento
  if (daysSinceLast <= 30) return Math.max(0, currentScore - 2)   // 15-30: -2 pts
  if (daysSinceLast <= 60) return Math.max(0, currentScore - 5)   // 31-60: -5 pts
  if (daysSinceLast <= 90) return Math.max(0, currentScore - 10)  // 61-90: -10 pts
  return Math.max(0, currentScore - 20)                           // 90+: -20 pts
}

/**
 * Aplica o decaimento acumulado desde a última vez que o app calculou.
 * Chame isso ao abrir a página de relacionamentos.
 */
export function applyDecay(person) {
  if (!person.lastInteraction) return person.relationshipScore
  const days = Math.floor((Date.now() - new Date(person.lastInteraction)) / 86400000)
  return Math.max(0, calcDecay(person.relationshipScore, days))
}

// ── Estratégias baseadas no perfil ───────────────────────────────────────────

/**
 * Retorna estratégias de conexão baseadas no perfil da pessoa.
 * PRINCIPAL ARQUIVO A EVOLUIR — adicione novas regras aqui.
 *
 * @param {Object} person - objeto completo da pessoa
 * @returns {string[]} lista de estratégias
 */
export function getConnectionStrategies(person) {
  const strategies = []

  // ── Linguagem do amor ────────────────────────────────────────────
  if (person.loveLanguage === 'words') {
    strategies.push('💬 Diga algo genuíno sobre ela — elogio específico, não genérico')
    strategies.push('📢 Reconheça algo que ela fez recentemente')
  }
  if (person.loveLanguage === 'time') {
    strategies.push('⏱️ Esteja 100% presente — guarde o celular')
    strategies.push('🎯 Proponha fazer algo juntos, mesmo que simples')
  }
  if (person.loveLanguage === 'gifts') {
    strategies.push('🎁 Leve algo pequeno — não precisa ser caro, precisa ser pensado')
    strategies.push('📅 Lembre e mencione datas importantes para ela')
  }
  if (person.loveLanguage === 'service') {
    strategies.push('🛠️ Pergunte se tem algo em que pode ajudar de verdade')
    strategies.push('💡 Ofereça algo concreto, não só "me fala se precisar"')
  }
  if (person.loveLanguage === 'touch') {
    strategies.push('🤗 Um abraço sincero vale mais que mil palavras')
    strategies.push('🤝 Aperto de mão firme, contato visual — presença física importa')
  }

  // ── Tipo de apego ─────────────────────────────────────────────────
  if (person.attachmentType === 'anxious') {
    strategies.push('🟡 É ansioso — confirme presença e compromissos claramente')
    strategies.push('🔁 Responda mensagens com agilidade quando possível')
    strategies.push('❤️ Mostre que se importa de forma explícita, não assuma que ela sabe')
  }
  if (person.attachmentType === 'avoidant') {
    strategies.push('🔵 É evitativo — dê espaço, não force intimidade rápida')
    strategies.push('🎯 Conecte-se por atividades e projetos, não só por emoções')
    strategies.push('🚫 Evite cobranças sobre ausência ou falta de contato')
  }
  if (person.attachmentType === 'disorganized') {
    strategies.push('🔴 Tipo desorganizado — seja consistente e previsível')
    strategies.push('🧘 Mantenha calma em momentos de tensão — não reaja por impulso')
  }
  if (person.attachmentType === 'secure') {
    strategies.push('🟢 É seguro — pode ser direto e autêntico, ele/ela lida bem')
    strategies.push('🗣️ Boas conversas profundas funcionam bem aqui')
  }

  // ── Personalidade MBTI ─────────────────────────────────────────────
  const mbti = person.mbti || ''
  const isIntrovert = mbti.startsWith('I') || person.introvertExtrovert === 'introvert'
  const isExtrovert = mbti.startsWith('E') || person.introvertExtrovert === 'extrovert'
  const isFeeler    = mbti[2] === 'F'
  const isThinker   = mbti[2] === 'T'
  const isJudger    = mbti[3] === 'J'
  const isPerceiver = mbti[3] === 'P'

  if (isIntrovert) {
    strategies.push('🤫 É introvertido — prefere conversas 1:1 a grupos grandes')
    strategies.push('💭 Dê espaço para pensar antes de responder — não o pressione')
  }
  if (isExtrovert) {
    strategies.push('⚡ É extrovertido — adora trocar energia, seja animado')
    strategies.push('👥 Programas em grupo funcionam bem como ponto de encontro')
  }
  if (isFeeler) {
    strategies.push('❤️ Toma decisões com o coração — reconheça sentimentos antes de fatos')
    strategies.push('🌡️ Pergunte como está se sentindo, não só o que está fazendo')
  }
  if (isThinker) {
    strategies.push('🧠 É analítico — valorize dados, argumentos e lógica na conversa')
    strategies.push('📊 Vá direto ao ponto, ele/ela aprecia objetividade')
  }
  if (isJudger) {
    strategies.push('📅 Gosta de planos — combine com antecedência, não no último minuto')
  }
  if (isPerceiver) {
    strategies.push('🌊 É flexível — convites de última hora funcionam bem')
    strategies.push('🎲 Programas espontâneos são bem-vindos')
  }

  return strategies
}

/**
 * Gera tópicos de conversa baseados no perfil e histórico.
 *
 * @param {Object} person
 * @returns {string[]} tópicos sugeridos
 */
export function getConversationTopics(person) {
  const topics = []
  const days = person.lastInteraction
    ? Math.floor((Date.now() - new Date(person.lastInteraction)) / 86400000)
    : null

  // Baseado em interesses
  if (person.interests?.length > 0) {
    const interest = person.interests[Math.floor(Math.random() * person.interests.length)]
    topics.push(`Perguntar sobre: ${interest}`)
  }

  // Baseado em notas anteriores
  if (person.notes?.trim()) {
    topics.push(`Retomar: "${person.notes.slice(0, 60)}${person.notes.length > 60 ? '...' : ''}"`)
  }

  // Baseado no tempo sem contato
  if (days !== null) {
    if (days > 30) topics.push(`Faz ${days} dias — mencionar que estava com saudade`)
    if (days > 7)  topics.push('Perguntar o que aconteceu de novo na vida dela')
  }

  // Aniversário próximo
  if (person.birthday) {
    const bday = getBirthdayDaysLeft(person.birthday)
    if (bday !== null && bday <= 30 && bday > 0) {
      topics.push(`🎂 Aniversário em ${bday} dias — ótima oportunidade!`)
    }
    if (bday === 0) topics.push('🎂 HOJE é o aniversário dela — parabéns agora!')
  }

  // Genéricos de qualidade
  topics.push('O que está te animando mais ultimamente?')
  topics.push('Algum projeto ou plano novo em vista?')

  return topics.slice(0, 5) // máximo 5
}

/**
 * Gera um briefing completo para o modo Encontro ao Vivo.
 *
 * @param {Object} person
 * @returns {Object} { context, strategies, topics, quickActions }
 */
export function generateMeetingBriefing(person) {
  const days = person.lastInteraction
    ? Math.floor((Date.now() - new Date(person.lastInteraction)) / 86400000)
    : null

  const context = []
  if (days !== null) {
    if (days === 0) context.push('Vocês se viram hoje')
    else if (days === 1) context.push('Última interação: ontem')
    else context.push(`Última interação: há ${days} dias`)
  } else {
    context.push('Primeira interação registrada')
  }

  const bday = person.birthday ? getBirthdayDaysLeft(person.birthday) : null
  if (bday !== null && bday <= 7 && bday >= 0) {
    context.push(bday === 0 ? '🎂 HOJE É O ANIVERSÁRIO!' : `🎂 Aniversário em ${bday} dias`)
  }

  const level = getLevel(person.relationshipScore)
  context.push(`Nível de relacionamento: ${level.emoji} ${level.label}`)

  return {
    context,
    strategies: getConnectionStrategies(person),
    topics: getConversationTopics(person),
  }
}

// ── Círculos de Dunbar ────────────────────────────────────────────────────────

/**
 * Classifica pessoas nos círculos de Dunbar.
 * Baseado na pontuação de relacionamento.
 */
export function getDunbarCircles(people) {
  const sorted = [...people].sort((a, b) => b.relationshipScore - a.relationshipScore)
  return {
    intimate:    sorted.filter(p => p.relationshipScore >= 79).slice(0, 5),
    close:       sorted.filter(p => p.relationshipScore >= 51 && p.relationshipScore < 79).slice(0, 15),
    active:      sorted.filter(p => p.relationshipScore >= 21 && p.relationshipScore < 51).slice(0, 50),
    acquaintance:sorted.filter(p => p.relationshipScore < 21),
  }
}

// ── Alertas ───────────────────────────────────────────────────────────────────

export function getAlerts(people) {
  const now = Date.now()
  const cooling = people.filter(p => {
    if (!p.lastInteraction) return true
    const days = Math.floor((now - new Date(p.lastInteraction)) / 86400000)
    return days >= 30 && p.relationshipScore >= 36 // apenas amigos ou acima
  })
  const attention = people.filter(p => {
    if (!p.lastInteraction) return false
    const days = Math.floor((now - new Date(p.lastInteraction)) / 86400000)
    return days >= 14 && days < 30 && p.relationshipScore >= 36
  })
  const birthdays = people.filter(p => {
    const days = getBirthdayDaysLeft(p.birthday)
    return days !== null && days <= 30
  }).sort((a, b) => getBirthdayDaysLeft(a.birthday) - getBirthdayDaysLeft(b.birthday))

  return { cooling, attention, birthdays }
}

// ── Saúde social ──────────────────────────────────────────────────────────────

export function getSocialHealth(people) {
  if (!people.length) return { score: 0, label: 'Sem dados', color: '#94A3B8' }
  const avg = people.reduce((a, p) => a + p.relationshipScore, 0) / people.length
  const activeRecently = people.filter(p => {
    if (!p.lastInteraction) return false
    return Math.floor((Date.now() - new Date(p.lastInteraction)) / 86400000) <= 30
  }).length
  const pctActive = people.length > 0 ? (activeRecently / people.length) * 100 : 0
  const score = Math.round((avg * 0.6) + (pctActive * 0.4))
  let label, color
  if (score >= 70) { label = 'Excelente'; color = '#10B981' }
  else if (score >= 50) { label = 'Boa';    color = '#38BDF8' }
  else if (score >= 30) { label = 'Regular'; color = '#F59E0B' }
  else { label = 'Precisa de atenção'; color = '#EF4444' }
  return { score, label, color }
}

// ── Badges automáticos ────────────────────────────────────────────────────────

export function getAutoBadges(person) {
  const badges = [...(person.badges || [])]
  const days = person.lastInteraction
    ? Math.floor((Date.now() - new Date(person.lastInteraction)) / 86400000)
    : 999
  const bday = getBirthdayDaysLeft(person.birthday)

  if (bday !== null && bday <= 30 && !badges.includes('birthday_star')) badges.push('birthday_star')
  if (days <= 30 && !badges.includes('streak_30')) badges.push('streak_30')
  if (person.relationshipScore === 100 && !badges.includes('soul_mate')) badges.push('soul_mate')
  if (days >= 30 && person.relationshipScore >= 36 && !badges.includes('cooling')) badges.push('cooling')
  else {
    const idx = badges.indexOf('cooling')
    if (idx > -1) badges.splice(idx, 1)
  }

  return badges
}

// ── Utilitários ───────────────────────────────────────────────────────────────

export function getBirthdayDaysLeft(birthday) {
  if (!birthday) return null
  const today = new Date()
  const [, month, day] = birthday.split('-').map(Number)
  let next = new Date(today.getFullYear(), month - 1, day)
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return Math.floor((next - today) / 86400000)
}

export function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}
