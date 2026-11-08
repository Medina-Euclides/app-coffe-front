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

export const expenseCategoryLabels = {
  labor: 'Mano de obra',
  inputs: 'Insumos agrícolas',
  tools_materials: 'Herramientas y materiales',
  transport: 'Transporte',
  services: 'Servicios',
  other: 'Otros gastos',
};

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

// Una arroba de café son 12,5 kg. El backend guarda siempre kilos y precio por kilo.
export const KG_PER_ARROBA = 12.5;

const round2 = (value) => Math.round(value * 100) / 100;

export const kgToArrobas = (kg) => round2(Number(kg) / KG_PER_ARROBA);
export const arrobasToKg = (arrobas) => round2(Number(arrobas) * KG_PER_ARROBA);
export const pricePerKgToArroba = (price) => round2(Number(price) * KG_PER_ARROBA);
export const pricePerArrobaToKg = (price) => round2(Number(price) / KG_PER_ARROBA);
