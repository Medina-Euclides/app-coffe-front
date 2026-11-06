// Formatos e íconos compartidos por las vistas de movimientos financieros.
import { Bean, Package, Plug, Receipt, Truck, UsersRound, Wrench } from 'lucide-react';

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
});

const categoryIcons = {
  labor: UsersRound,
  inputs: Package,
  tools_materials: Wrench,
  transport: Truck,
  services: Plug,
  other: Receipt,
};

export function getMovementIcon(movement) {
  if (movement.type === 'sale') return Bean;
  return categoryIcons[movement.category] || Receipt;
}

const shortDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function parse(value) {
  const key = String(value || '').slice(0, 10);
  if (!key) return null;
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function movementDate(value) {
  const date = parse(value);
  return date ? shortDate.format(date).replace(/\./g, '') : 'Sin fecha';
}

export function movementLongDate(value) {
  const date = parse(value);
  return date ? longDate.format(date) : 'Fecha sin registrar';
}
