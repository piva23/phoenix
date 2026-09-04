// Shared date/event helpers for calendar views

export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Start of week (Sunday) for a given date
export function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

// Build a 7-day array starting at the week's start
export function getWeekDates(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Hourly slots for the Day view (6h → 23h)
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 23;

export function getHourSlots() {
  const slots = [];
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    slots.push({ hour: h, label: `${String(h).padStart(2, '0')}:00` });
  }
  return slots;
}

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function formatLongDate(dateStr) {
  return parseDateStr(dateStr).toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatShortDate(dateStr) {
  return parseDateStr(dateStr).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
  });
}

// Parse HH:mm time into a number of minutes for positioning
export function timeToMinutes(time) {
  if (!time) return null;
  const m = String(time).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}