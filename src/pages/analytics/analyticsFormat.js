// Periodos, colores y etiquetas de fechas de la página de analíticas.
import { parseLocalDate } from '#lib/dates';
import { formatoFechaAnio, formatoFechaCorta } from '#lib/formatters';

// Etiquetas cortas para que los cuatro botones quepan en el celular; el rango de
// fechas debajo del filtro aclara qué se está viendo. `produccion` completa la
// frase «Producción de…» bajo el título del gráfico.
export const periods = [
  { value: 'week', label: 'Semana', produccion: 'esta semana' },
  { value: 'month', label: 'Mes', produccion: 'este mes' },
  { value: 'year', label: 'Año', produccion: 'este año' },
  { value: 'all', label: 'Histórico', produccion: 'los últimos 5 años' },
];

export const categoryColors = {
  labor: 'var(--chart-1)',
  inputs: 'var(--chart-4)',
  tools_materials: 'var(--chart-3)',
  transport: 'var(--chart-2)',
  services: 'var(--chart-5)',
  other: 'var(--subtle)',
};

const weekdayShort = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
const monthShort = new Intl.DateTimeFormat('es-CO', { month: 'short' });

export function formatBucket(point, period) {
  const start = parseLocalDate(point.start_date);
  const end = parseLocalDate(point.end_date);
  if (!start || !end) return '';

  if (period === 'week') {
    return weekdayShort.format(start);
  }
  if (period === 'all') return String(start.getFullYear());
  if (period === 'year') {
    return monthShort.format(start);
  }
  return `${String(start.getDate()).padStart(2, '0')}–${String(
    end.getDate(),
  ).padStart(2, '0')}`;
}

export function formatPeriodRange(series) {
  if (!series) return '';
  return `${formatoFechaCorta(series.start_date, '')} – ${formatoFechaAnio(series.end_date, '')}`;
}
