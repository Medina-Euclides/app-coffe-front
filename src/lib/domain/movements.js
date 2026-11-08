// Etiquetas, íconos, fechas y unidades de los movimientos financieros (ventas y gastos).
import { Bean, Package, Plug, Receipt, Truck, UsersRound, Wrench } from 'lucide-react';
import { EXPENSE_CATEGORIES, KG_PER_ARROBA } from '#lib/constants';
import { formatoFechaCorta, formatoFechaLarga } from '#lib/formatters';

export { KG_PER_ARROBA };

// En listas que mezclan ventas y gastos, "Otros" se lee mejor como "Otros gastos".
export const expenseCategoryLabels = {
  ...Object.fromEntries(EXPENSE_CATEGORIES.map(({ value, label }) => [value, label])),
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

export const movementDate = (value) => formatoFechaCorta(value, 'Sin fecha');
export const movementLongDate = (value) => formatoFechaLarga(value, 'Fecha sin registrar');

// Conversión kg ↔ arrobas (el backend guarda siempre kilos y precio por kilo).

const round2 = (value) => Math.round(value * 100) / 100;

export const kgToArrobas = (kg) => round2(Number(kg) / KG_PER_ARROBA);
export const arrobasToKg = (arrobas) => round2(Number(arrobas) * KG_PER_ARROBA);
export const pricePerKgToArroba = (price) => round2(Number(price) * KG_PER_ARROBA);
export const pricePerArrobaToKg = (price) => round2(Number(price) / KG_PER_ARROBA);
