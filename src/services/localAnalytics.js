// Analíticas calculadas en el dispositivo (sin conexión o con cambios aún sin sincronizar).
// Es un port de AnalyticsService.get_summary (backend: apps/analytics/services.py) sobre la
// caché de IndexedDB, que ya incluye lo registrado sin conexión. Devuelve la misma forma
// JSON que /analytics/summary/ para que la página no necesite saber de dónde vienen los datos.
import { readCache } from './offlineStore.js';

// Años que cubre el histórico (period="all"), contando el actual.
const HISTORY_YEARS = 5;

// Mismo orden y etiquetas que OperatingExpense.Category en el backend.
const EXPENSE_CATEGORIES = [
  ['labor', 'Mano de obra'],
  ['inputs', 'Insumos agrícolas'],
  ['tools_materials', 'Herramientas y materiales'],
  ['transport', 'Transporte'],
  ['services', 'Servicios'],
  ['other', 'Otros'],
];

const money = (value) => value.toFixed(2);
const kilograms = (value) => value.toFixed(3);
const num = (value) => Number(value) || 0;
const same = (a, b) => String(a) === String(b);
const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Fechas como 'YYYY-MM-DD' en hora local (igual que DateField en el backend).
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
const parseKey = (key) => {
  const [year, month, day] = String(key).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const minDate = (a, b) => (a < b ? a : b);
// Lunes = 0, como date.weekday() en Python.
const weekday = (date) => (date.getDay() + 6) % 7;

function periodStart(period, today) {
  if (period === 'week') return addDays(today, -weekday(today));
  if (period === 'month') return new Date(today.getFullYear(), today.getMonth(), 1);
  if (period === 'year') return new Date(today.getFullYear(), 0, 1);
  if (period === 'all') return new Date(today.getFullYear() - (HISTORY_YEARS - 1), 0, 1);
  throw new Error(`Período de analíticas no soportado: ${period}`);
}

const inRange = (key, start, end) => key >= dateKey(start) && key <= dateKey(end);

// Pesajes de actividades de recolección (sin anulados), con su fecha de jornada y lote.
function harvestRecords(workdays, lotFarm, farmIds) {
  const records = [];
  for (const workday of workdays) {
    for (const participant of workday.participants || []) {
      for (const detail of participant.details || []) {
        if (!detail.activity_is_harvest) continue;
        const farmId = lotFarm.get(String(detail.lot));
        if (!farmId || !farmIds.has(farmId)) continue;
        for (const record of detail.harvest_records || []) {
          if (record.settlement_status === 'anulado') continue;
          records.push({
            date: String(workday.date).slice(0, 10),
            lot: String(detail.lot),
            quantity: num(record.quantity_kg),
          });
        }
      }
    }
  }
  return records;
}

function productionSeries(records, period, today) {
  const start = periodStart(period, today);
  let bucketCount;
  let bucketIndex;
  if (period === 'week') {
    bucketCount = Math.round((today - start) / 86_400_000) + 1;
    bucketIndex = (date) => Math.round((date - start) / 86_400_000);
  } else if (period === 'month') {
    bucketCount = Math.floor((today.getDate() + 6) / 7);
    bucketIndex = (date) => Math.floor((date.getDate() - 1) / 7);
  } else if (period === 'year') {
    bucketCount = today.getMonth() + 1;
    bucketIndex = (date) => date.getMonth();
  } else {
    bucketCount = HISTORY_YEARS;
    bucketIndex = (date) => date.getFullYear() - start.getFullYear();
  }

  const totals = Array.from({ length: bucketCount }, () => 0);
  for (const record of records) {
    if (!inRange(record.date, start, today)) continue;
    totals[bucketIndex(parseKey(record.date))] += record.quantity;
  }

  const points = totals.map((total, index) => {
    let pointStart;
    let pointEnd;
    if (period === 'week') {
      pointStart = addDays(start, index);
      pointEnd = pointStart;
    } else if (period === 'month') {
      pointStart = addDays(start, index * 7);
      pointEnd = minDate(addDays(pointStart, 6), today);
    } else if (period === 'all') {
      pointStart = new Date(start.getFullYear() + index, 0, 1);
      pointEnd = minDate(new Date(pointStart.getFullYear(), 11, 31), today);
    } else {
      pointStart = new Date(start.getFullYear(), index, 1);
      pointEnd = minDate(new Date(start.getFullYear(), index + 1, 0), today);
    }
    return {
      start_date: dateKey(pointStart),
      end_date: dateKey(pointEnd),
      total_quantity_kg: kilograms(total),
    };
  });

  return {
    period,
    start_date: dateKey(start),
    end_date: dateKey(today),
    total_quantity_kg: kilograms(totals.reduce((sum, value) => sum + value, 0)),
    points,
  };
}

export async function computeLocalSummary({ farmId, period = 'month' } = {}) {
  const [farms, lots, expenses, sales, workdays] = await Promise.all(
    ['farms', 'lots', 'expenses', 'sales', 'workdays'].map(
      async (key) => (await readCache(key)) || [],
    ),
  );
  if (!farms.length) {
    throw new Error(
      'Sin conexión y sin datos guardados en este dispositivo. Conéctate una vez para descargarlos.',
    );
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = periodStart(period, today);
  const scopedFarms = farmId ? farms.filter((farm) => same(farm.id, farmId)) : farms;
  const farmIds = new Set(scopedFarms.map((farm) => String(farm.id)));
  const farmsById = new Map(farms.map((farm) => [String(farm.id), farm]));
  const lotFarm = new Map(lots.map((lot) => [String(lot.id), String(lot.id_farm)]));

  // Gastos por categoría y resumen financiero.
  const expenseTotals = new Map();
  for (const expense of expenses) {
    if (!farmIds.has(String(expense.farm))) continue;
    if (!inRange(String(expense.date).slice(0, 10), start, today)) continue;
    expenseTotals.set(
      expense.category,
      (expenseTotals.get(expense.category) || 0) + num(expense.amount),
    );
  }
  const expensesByCategory = EXPENSE_CATEGORIES.map(([category, label]) => ({
    category,
    label,
    total_amount: money(expenseTotals.get(category) || 0),
  }));
  const totalExpenses = [...expenseTotals.values()].reduce((sum, value) => sum + value, 0);
  const salesIncome = sales
    .filter(
      (sale) =>
        sale.is_active !== false &&
        farmIds.has(String(sale.farm)) &&
        inRange(String(sale.sale_date).slice(0, 10), start, today),
    )
    .reduce(
      (sum, sale) =>
        sum + (num(sale.total_amount) || num(sale.quantity_kg) * num(sale.unit_price)),
      0,
    );

  // Producción.
  const records = harvestRecords(workdays, lotFarm, farmIds);
  const byLot = new Map();
  for (const record of records) {
    if (!inRange(record.date, start, today)) continue;
    byLot.set(record.lot, (byLot.get(record.lot) || 0) + record.quantity);
  }
  const productionByLot = lots
    .filter((lot) => farmIds.has(String(lot.id_farm)))
    .map((lot) => ({ lot, farm: farmsById.get(String(lot.id_farm)) }))
    // Mismo orden que order_by('id_farm__name', 'name') en la base de datos (por código).
    .sort(
      (a, b) =>
        byCode(String(a.farm?.name || ''), String(b.farm?.name || '')) ||
        byCode(String(a.lot.name || ''), String(b.lot.name || '')),
    )
    .map(({ lot, farm }) => ({
      lot_id: lot.id,
      lot_name: lot.name,
      farm_id: lot.id_farm,
      farm_name: farm?.name || '',
      plant_count: lot.plant_count ?? null,
      total_quantity_kg: kilograms(byLot.get(String(lot.id)) || 0),
    }));

  const sumSince = (from) =>
    kilograms(
      records
        .filter((record) => inRange(record.date, from, today))
        .reduce((sum, record) => sum + record.quantity, 0),
    );
  const periodTotals = Object.fromEntries(
    ['week', 'month', 'year'].map((key) => {
      const from = periodStart(key, today);
      return [
        key,
        { start_date: dateKey(from), end_date: dateKey(today), total_quantity_kg: sumSince(from) },
      ];
    }),
  );

  const selectedFarm = farmId ? farmsById.get(String(farmId)) : null;
  return {
    farm_id: selectedFarm ? selectedFarm.id : null,
    farm_name: selectedFarm ? selectedFarm.name : null,
    period,
    expenses_by_category: expensesByCategory,
    financial_summary: {
      sales_income: money(salesIncome),
      total_expenses: money(totalExpenses),
      net_income: money(salesIncome - totalExpenses),
    },
    production_by_lot: productionByLot,
    production_by_period: periodTotals,
    production_series: productionSeries(records, period, today),
    _local: true,
  };
}
