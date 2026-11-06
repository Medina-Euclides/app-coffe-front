// Formatos compartidos por la página de pagos y sus componentes.
export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export const kilogramsFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 3,
});

export function getDateKey(value) {
  return value ? String(value).slice(0, 10) : '';
}

export function formatDate(value) {
  const dateKey = getDateKey(value);
  if (!dateKey) return 'Fecha sin registrar';
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Fecha sin registrar'
    : new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

export function getPaymentMethodLabel(method) {
  return {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    otro: 'Otro',
  }[method] || method || 'Sin método registrado';
}
