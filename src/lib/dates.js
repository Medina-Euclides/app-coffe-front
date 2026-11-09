// Utilidades de fechas locales (YYYY-MM-DD) compartidas por toda la app.

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Convierte una fecha (string ISO, YYYY-MM-DD o Date) a la clave local YYYY-MM-DD.
export function toDateKey(value) {
  if (!value) return '';
  const date =
    typeof value === 'string' && DATE_KEY_RE.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Interpreta los 10 primeros caracteres como fecha local; null si no es válida.
export function parseLocalDate(value) {
  const key = String(value || '').slice(0, 10);
  if (!DATE_KEY_RE.test(key)) return null;
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Semana de lunes a domingo que contiene la fecha dada (YYYY-MM-DD).
export function getWeekRange(dateKey) {
  const base = new Date(`${dateKey}T12:00:00`);
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateKey(monday), end: toDateKey(sunday), monday, sunday };
}

// Texto para frases de resumen ("Total pagado hoy", "… en total").
export const PERIOD_LABELS = {
  today: 'hoy',
  week: 'esta semana',
  month: 'este mes',
  year: 'este año',
  all: 'en total',
};

// ¿La fecha (YYYY-MM-DD) cae en el periodo elegido respecto a hoy?
export function belongsToPeriod(dateKey, period, todayKey) {
  if (!period || period === 'all') return true;
  if (!dateKey) return false;
  if (period === 'today') return dateKey === todayKey;
  if (period === 'week') {
    const { start, end } = getWeekRange(todayKey);
    return dateKey >= start && dateKey <= end;
  }
  if (period === 'month') return dateKey.slice(0, 7) === todayKey.slice(0, 7);
  if (period === 'year') return dateKey.slice(0, 4) === todayKey.slice(0, 4);
  return true;
}

// Hora local actual en formato HH:MM (para campos <input type="time">).
export function currentTimeKey() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
