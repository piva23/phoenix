// Cálculo de fase lunar por fórmula (sem necessidade de API paga).
// Referência: lua nova conhecida em 06/01/2000 18:14 UTC + ciclo sinódico médio.
const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();

const PHASES = [
  { max: 0.02, label: 'Lua Nova', icon: '🌑' },
  { max: 0.24, label: 'Crescente', icon: '🌒' },
  { max: 0.26, label: 'Quarto Crescente', icon: '🌓' },
  { max: 0.49, label: 'Crescente Gibosa', icon: '🌔' },
  { max: 0.51, label: 'Lua Cheia', icon: '🌕' },
  { max: 0.74, label: 'Minguante Gibosa', icon: '🌖' },
  { max: 0.76, label: 'Quarto Minguante', icon: '🌗' },
  { max: 0.99, label: 'Minguante', icon: '🌘' },
  { max: 1.01, label: 'Lua Nova', icon: '🌑' },
];

// Retorna { label, icon, illumination } para uma data qualquer.
export function getMoonPhase(date = new Date()) {
  const diffDays = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const phase = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const fraction = phase / SYNODIC_MONTH;
  const illumination = Math.round(
    ((1 - Math.cos(fraction * 2 * Math.PI)) / 2) * 100
  );
  const found = PHASES.find(p => fraction <= p.max) || PHASES[0];
  return { label: found.label, icon: found.icon, illumination };
}
