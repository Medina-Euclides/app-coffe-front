// Etiquetas, íconos, fechas y unidades de los movimientos financieros (ventas y gastos).
import { Bean, Package, Plug, Receipt, Truck, UsersRound, Wrench } from 'lucide-react';
import { EXPENSE_CATEGORIES, KG_PER_ARROBA } from '#lib/constants';
import { formatoFechaCorta, formatoFechaLarga } from '#lib/formatters';
import { api } from '#services/api';

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

function getMovementFarmId(movement) {
  const farm = movement.farm ?? movement.farm_id;
  return farm && typeof farm === 'object' ? String(farm.id) : String(farm || '');
}

// Ventas y gastos en una sola lista, del más reciente al más antiguo.
export function mapMovements(sales, expenses, farms) {
  const farmNames = new Map(farms.map((farm) => [String(farm.id), farm.nombre]));
  const mappedSales = sales.map((sale) => ({
    ...sale,
    type: 'sale',
    date: sale.sale_date,
    farmId: getMovementFarmId(sale),
    farmName: farmNames.get(getMovementFarmId(sale)) || '',
    title:
      sale.coffee_type === 'pasilla'
        ? 'Café pasilla'
        : 'Café pergamino seco',
    amount: Number(sale.total_amount) || 0,
  }));
  const mappedExpenses = expenses.map((expense) => ({
    ...expense,
    type: 'expense',
    farmId: getMovementFarmId(expense),
    farmName:
      expense.farm_name ||
      farmNames.get(getMovementFarmId(expense)) ||
      '',
    title: expense.concept,
    amount: Number(expense.amount) || 0,
    categoryLabel: expenseCategoryLabels[expense.category] || 'Otros gastos',
    isAutomatic: Boolean(expense.labor_payment),
  }));
  return [...mappedSales, ...mappedExpenses].sort((first, second) =>
    String(second.date).localeCompare(String(first.date)),
  );
}

export const EMPTY_FINANCE = { farms: [], movements: [] };

// Fincas y movimientos para la página de finanzas.
export const fetchFinanceData = async () => {
  const [farms, sales, expenses] = await Promise.all([
    api.farms.list(),
    api.production.sales.list(),
    api.finance.expenses.list(),
  ]);
  return { farms, movements: mapMovements(sales, expenses, farms) };
};

export const getMovementSearchText = (movement) =>
  [
    movement.title,
    movement.buyer,
    movement.categoryLabel,
    ...(movement.type === 'sale' ? [movement.notes] : []),
  ]
    .filter(Boolean)
    .join(' ');

// Crea o actualiza una venta o un gasto. Devuelve un mensaje si no se permite.
export async function saveMovementRequest(type, payload, movementToEdit) {
  if (type === 'sale') {
    return movementToEdit
      ? api.production.sales.update(movementToEdit.id, payload)
      : api.production.sales.create(payload);
  }
  if (movementToEdit) return api.finance.expenses.update(movementToEdit.id, payload);
  return api.finance.expenses.create(payload);
}
