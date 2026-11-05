// Página de finanzas: registra ventas y gastos, muestra resumen y movimientos.
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  PlusCircle,
  Search,
} from 'lucide-react';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import { Input } from '#components/ui/input';
import { api } from '#services/api';
import MovementFormDialog from './components/MovementFormDialog.jsx';

const categories = {
  labor: 'Mano de obra',
  inputs: 'Insumos agrícolas',
  tools_materials: 'Herramientas y materiales',
  transport: 'Transporte',
  services: 'Servicios',
  other: 'Otros gastos',
};

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'sale', label: 'Ventas' },
  { value: 'expense', label: 'Gastos' },
];

const dateFilters = [
  { value: 'today', label: 'Hoy' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
];

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
});

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
  const dateKey = String(value || '').slice(0, 10);
  if (!dateKey) return 'Fecha sin registrar';
  const parsedDate = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return 'Fecha sin registrar';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

function getMovementFarmId(movement) {
  const farm = movement.farm ?? movement.farm_id;
  return farm && typeof farm === 'object' ? String(farm.id) : String(farm || '');
}

function mapMovements(sales, expenses, farms) {
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
    categoryLabel: categories[expense.category] || 'Otros gastos',
    isAutomatic: Boolean(expense.labor_payment),
  }));
  return [...mappedSales, ...mappedExpenses].sort((first, second) =>
    String(second.date).localeCompare(String(first.date)),
  );
}

function isInDateFilter(dateValue, dateFilter, today = new Date()) {
  const dateKey = String(dateValue || '').slice(0, 10);
  if (!dateKey) return false;
  if (dateFilter === 'today') return dateKey === localDateKey(today);

  const [year, month] = dateKey.split('-').map(Number);
  if (dateFilter === 'month') {
    return year === today.getFullYear() && month === today.getMonth() + 1;
  }
  return year === today.getFullYear();
}

function MovementCard({ movement, expanded, onToggle, onEdit }) {
  const isSale = movement.type === 'sale';

  return (
    <Card className="rounded-2xl border-[#ece9e3] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            className={
              isSale
                ? 'h-auto border-emerald-100 bg-emerald-50 px-2.5 py-1 text-emerald-800'
                : 'h-auto border-red-100 bg-red-50 px-2.5 py-1 text-red-700'
            }
            variant="outline"
          >
            {isSale ? (
              <ArrowUpCircle aria-hidden="true" />
            ) : (
              <ArrowDownCircle aria-hidden="true" />
            )}
            {isSale ? 'Venta de café' : `Gasto · ${movement.categoryLabel}`}
          </Badge>
          {movement.isAutomatic && (
            <Badge
              className="h-auto border-slate-200 bg-slate-50 px-2 py-1 text-slate-600"
              variant="outline"
            >
              Automático
            </Badge>
          )}
          <span className="text-xs text-[#8a8b83]">{formatDate(movement.date)}</span>
        </div>
        <span
          className={`shrink-0 text-right text-base font-semibold sm:text-lg ${
            isSale ? 'text-emerald-700' : 'text-red-600'
          }`}
        >
          {isSale ? '+' : '−'} {currencyFormatter.format(movement.amount)}
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-[#2d332d]">
            {movement.title || 'Movimiento financiero'}
          </h2>
          <p className="mt-1 text-xs text-[#8a8b83]">{movement.farmName}</p>
        </div>
        {isSale && (
          <span className="shrink-0 rounded-lg bg-[#f7f6f2] px-2.5 py-1 text-xs font-medium text-[#68766b]">
            {numberFormatter.format(Number(movement.quantity_kg) || 0)} kg
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-[#f0efeb] pt-2">
        <div className="flex items-center justify-between">
          <Button
            aria-expanded={expanded}
            className="h-8 px-1 text-xs text-[#68766b] hover:text-[#214b32]"
            onClick={onToggle}
            type="button"
            variant="ghost"
          >
            Ver detalle
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
          {!movement.isAutomatic && (
            <Button
              className="h-8 px-1 text-xs text-[#68766b] hover:text-[#214b32]"
              onClick={onEdit}
              type="button"
              variant="ghost"
            >
              <Pencil />
              Editar
            </Button>
          )}
        </div>
        {expanded && (
          <dl className="grid gap-x-4 gap-y-2 border-t border-[#f0efeb] pt-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[#8a8b83]">Finca</dt>
              <dd className="mt-0.5 font-medium text-[#36483a]">
                {movement.farmName}
              </dd>
            </div>
            {isSale ? (
              <>
                <div>
                  <dt className="text-xs text-[#8a8b83]">Precio por kg</dt>
                  <dd className="mt-0.5 font-medium text-[#36483a]">
                    {currencyFormatter.format(Number(movement.unit_price) || 0)}
                  </dd>
                </div>
                {movement.buyer && (
                  <div>
                    <dt className="text-xs text-[#8a8b83]">Comprador</dt>
                    <dd className="mt-0.5 font-medium text-[#36483a]">
                      {movement.buyer}
                    </dd>
                  </div>
                )}
              </>
            ) : (
              <div>
                <dt className="text-xs text-[#8a8b83]">Categoría</dt>
                <dd className="mt-0.5 font-medium text-[#36483a]">
                  {movement.categoryLabel}
                  {movement.isAutomatic && ' · registrado desde Pagos laborales'}
                </dd>
              </div>
            )}
            {isSale && movement.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#8a8b83]">Notas</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-[#36483a]">
                  {movement.notes}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </Card>
  );
}

export default function FinanceActivityPage({ usuario }) {
  const userId = usuario?.id || 'default';
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [movements, setMovements] = useState([]);
  const [loadedRequestKey, setLoadedRequestKey] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('month');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogType, setDialogType] = useState(null);
  const [movementToEdit, setMovementToEdit] = useState(null);
  const [expandedMovementId, setExpandedMovementId] = useState(null);
  const [today] = useState(() => new Date());
  const requestKey = `${userId}-${refreshKey}`;
  const loading = loadedRequestKey !== requestKey;

  useEffect(() => {
    let active = true;

    Promise.all([
      api.farms.list(),
      api.production.sales.list(),
      api.finance.expenses.list(),
    ])
      .then(([loadedFarms, sales, expenses]) => {
        if (!active) return;
        setError('');
        setFarms(loadedFarms);
        const savedFarmId = localStorage.getItem(
          `cafesmart_finca_activa_${userId}`,
        );
        setSelectedFarmId((current) => {
          if (current && loadedFarms.some((farm) => String(farm.id) === current)) {
            return current;
          }
          return loadedFarms.some((farm) => String(farm.id) === savedFarmId)
            ? savedFarmId
            : '';
        });
        setMovements(mapMovements(sales, expenses, loadedFarms));
      })
      .catch((loadError) => {
        if (!active) return;
        console.error('Error al cargar los movimientos financieros:', loadError);
        setError(
          loadError.message || 'No se pudieron cargar los movimientos financieros.',
        );
      })
      .finally(() => {
        if (active) setLoadedRequestKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, requestKey, userId]);

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return movements.filter((movement) => {
      if (selectedFarmId && movement.farmId !== String(selectedFarmId)) {
        return false;
      }
      if (typeFilter !== 'all' && movement.type !== typeFilter) return false;
      if (!isInDateFilter(movement.date, dateFilter, today)) return false;
      if (
        query &&
        ![
          movement.title,
          movement.buyer,
          movement.categoryLabel,
          ...(movement.type === 'sale' ? [movement.notes] : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase()
          .includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [dateFilter, movements, search, selectedFarmId, today, typeFilter]);

  const openNewMovement = (type) => {
    setMovementToEdit(null);
    setDialogType(type);
  };

  const closeDialog = (open) => {
    if (!open) {
      setDialogType(null);
      setMovementToEdit(null);
    }
  };

  const saveMovement = async (payload) => {
    try {
      if (dialogType === 'sale') {
        if (movementToEdit) {
          await api.production.sales.update(movementToEdit.id, payload);
        } else {
          await api.production.sales.create(payload);
        }
      } else if (movementToEdit) {
        if (movementToEdit.isAutomatic) {
          return 'Los gastos de mano de obra se administran desde Pagos laborales.';
        }
        await api.finance.expenses.update(movementToEdit.id, payload);
      } else {
        await api.finance.expenses.create(payload);
      }
      setRefreshKey((key) => key + 1);
      return '';
    } catch (saveError) {
      console.error('Error al guardar el movimiento financiero:', saveError);
      return saveError.message || 'No se pudo guardar el movimiento.';
    }
  };

  const selectedFarm = farms.find(
    (farm) => String(farm.id) === String(selectedFarmId),
  );
  const selectedDateFilter =
    dateFilters.find((item) => item.value === dateFilter)?.label || 'Este mes';
  const filteredSales = filteredMovements
    .filter((movement) => movement.type === 'sale')
    .reduce((total, movement) => total + movement.amount, 0);
  const filteredExpenses = filteredMovements
    .filter((movement) => movement.type === 'expense')
    .reduce((total, movement) => total + movement.amount, 0);
  const breadcrumbDate = new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
  }).format(today);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 border-b border-[#e9e7e1] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#92704f]">
            Finanzas · {breadcrumbDate}
            <span className="mx-2 text-emerald-700" aria-hidden="true">•</span>
            {selectedFarm?.nombre || 'Todas las fincas'}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#211f1c] sm:text-3xl">
            Movimientos financieros
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#77756f] sm:text-base">
            Registro simplificado de ventas de café y gastos operativos de la
            finca.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="h-11 rounded-xl border-[#e5e2dc] bg-white text-[#4c554d] hover:bg-[#f7f6f2]"
            onClick={() => openNewMovement('expense')}
            type="button"
            variant="outline"
          >
            <ArrowDownCircle />
            Registrar gasto
          </Button>
          <Button
            className="h-11 rounded-xl bg-[#214b32] text-white hover:bg-[#173d2b]"
            onClick={() => openNewMovement('sale')}
            type="button"
          >
            <PlusCircle />
            Registrar venta
          </Button>
        </div>
      </header>

      <section
        aria-label="Filtros de movimientos"
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        <div
          aria-label="Tipo de movimiento"
          className="inline-flex w-full rounded-xl bg-[#f0eee9] p-1 sm:w-fit"
          role="group"
        >
          {filters.map((filter) => (
            <button
              aria-pressed={typeFilter === filter.value}
              className={`min-h-9 flex-1 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none ${
                typeFilter === filter.value
                  ? 'bg-white text-[#262722] shadow-sm'
                  : 'text-[#65645f] hover:text-[#263b2c]'
              }`}
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <label className="sr-only" htmlFor="finance-search">
            Buscar por concepto, comprador o categoría
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#96958e]"
          />
          <Input
            className="h-11 rounded-xl border-[#e5e2dc] bg-white pl-10 text-sm shadow-sm placeholder:text-[#a3a198]"
            id="finance-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por concepto, comprador o categoría…"
            type="search"
            value={search}
          />
        </div>

        <label className="sr-only" htmlFor="finance-farm">
          Filtrar por finca
        </label>
        <select
          className="h-11 rounded-xl border border-[#e5e2dc] bg-white px-3 text-sm text-[#4c554d] shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#426b48]/30"
          id="finance-farm"
          onChange={(event) => {
            setSelectedFarmId(event.target.value);
            if (event.target.value) {
              localStorage.setItem(
                `cafesmart_finca_activa_${userId}`,
                event.target.value,
              );
            }
          }}
          value={selectedFarmId}
        >
          <option value="">Todas las fincas</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.nombre}
            </option>
          ))}
        </select>

        <div
          aria-label="Período"
          className="inline-flex rounded-xl bg-[#f0eee9] p-1"
          role="group"
        >
          {dateFilters.map((filter) => (
            <button
              aria-pressed={dateFilter === filter.value}
              className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-medium transition-colors ${
                dateFilter === filter.value
                  ? 'bg-white text-[#262722] shadow-sm'
                  : 'text-[#65645f] hover:text-[#263b2c]'
              }`}
              key={filter.value}
              onClick={() => setDateFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section
        aria-label={`Resumen ${selectedDateFilter.toLocaleLowerCase()}`}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Card className="flex flex-row items-center justify-between rounded-2xl border-[#e8eee8] bg-[#f5faf5] px-4 py-3 shadow-none">
          <span className="text-sm text-[#53665a]">Ventas · {selectedDateFilter.toLocaleLowerCase()}</span>
          <strong className="text-base text-emerald-700">
            {currencyFormatter.format(filteredSales)}
          </strong>
        </Card>
        <Card className="flex flex-row items-center justify-between rounded-2xl border-[#f1e7e4] bg-[#fff8f6] px-4 py-3 shadow-none">
          <span className="text-sm text-[#765b55]">Gastos · {selectedDateFilter.toLocaleLowerCase()}</span>
          <strong className="text-base text-red-600">
            {currencyFormatter.format(filteredExpenses)}
          </strong>
        </Card>
      </section>

      {error && (
        <div
          aria-live="assertive"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{error}</span>
          <Button
            className="h-9 rounded-lg"
            onClick={() => {
              setError('');
              setLoadedRequestKey('');
              setRefreshKey((key) => key + 1);
            }}
            type="button"
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      )}

      {loading ? (
        <p aria-live="polite" className="py-12 text-center text-sm text-[#68766b]" role="status">
          Cargando movimientos…
        </p>
      ) : filteredMovements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#dcdad3] bg-white px-5 py-14 text-center">
          <p className="font-medium text-[#36483a]">
            No hay movimientos para mostrar.
          </p>
          <p className="mt-1 text-sm text-[#77756f]">
            Prueba otros filtros o registra una venta o un gasto.
          </p>
        </div>
      ) : (
        <section
          aria-label="Movimientos financieros"
          className="grid gap-4 md:grid-cols-2"
        >
          {filteredMovements.map((movement) => (
            <MovementCard
              expanded={expandedMovementId === movement.id}
              key={`${movement.type}-${movement.id}`}
              movement={movement}
              onEdit={() => {
                setMovementToEdit(movement);
                setDialogType(movement.type);
              }}
              onToggle={() =>
                setExpandedMovementId((current) =>
                  current === movement.id ? null : movement.id,
                )
              }
            />
          ))}
        </section>
      )}

      {dialogType && (
        <MovementFormDialog
          farms={farms}
          key={`${dialogType}-${movementToEdit?.id || 'new'}`}
          movement={movementToEdit}
          onOpenChange={closeDialog}
          onSave={saveMovement}
          open={Boolean(dialogType)}
          selectedFarmId={selectedFarmId}
          type={dialogType}
        />
      )}
    </main>
  );
}
