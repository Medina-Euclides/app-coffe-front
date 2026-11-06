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
    <Card className="rounded-2xl border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            className={
              isSale
                ? 'h-auto border-leaf/20 bg-leaf-soft px-2.5 py-1 text-leaf'
                : 'h-auto border-destructive/20 bg-destructive-soft px-2.5 py-1 text-destructive'
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
              className="h-auto border-border bg-muted px-2 py-1 text-muted-foreground"
              variant="outline"
            >
              Automático
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{formatDate(movement.date)}</span>
        </div>
        <span
          className={`shrink-0 text-right text-base font-semibold sm:text-lg ${
            isSale ? 'text-leaf' : 'text-destructive'
          }`}
        >
          {isSale ? '+' : '−'} {currencyFormatter.format(movement.amount)}
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-foreground">
            {movement.title || 'Movimiento financiero'}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{movement.farmName}</p>
        </div>
        {isSale && (
          <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {numberFormatter.format(Number(movement.quantity_kg) || 0)} kg
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-border/60 pt-2">
        <div className="flex items-center justify-between">
          <Button
            aria-expanded={expanded}
            className="h-8 px-1 text-xs text-muted-foreground hover:text-primary"
            onClick={onToggle}
            type="button"
            variant="ghost"
          >
            Ver detalle
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
          {!movement.isAutomatic && (
            <Button
              className="h-8 px-1 text-xs text-muted-foreground hover:text-primary"
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
          <dl className="grid gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Finca</dt>
              <dd className="mt-0.5 font-medium text-ink-soft">
                {movement.farmName}
              </dd>
            </div>
            {isSale ? (
              <>
                <div>
                  <dt className="text-xs text-muted-foreground">Precio por kg</dt>
                  <dd className="mt-0.5 font-medium text-ink-soft">
                    {currencyFormatter.format(Number(movement.unit_price) || 0)}
                  </dd>
                </div>
                {movement.buyer && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Comprador</dt>
                    <dd className="mt-0.5 font-medium text-ink-soft">
                      {movement.buyer}
                    </dd>
                  </div>
                )}
              </>
            ) : (
              <div>
                <dt className="text-xs text-muted-foreground">Categoría</dt>
                <dd className="mt-0.5 font-medium text-ink-soft">
                  {movement.categoryLabel}
                  {movement.isAutomatic && ' · registrado desde Pagos laborales'}
                </dd>
              </div>
            )}
            {isSale && movement.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Notas</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-ink-soft">
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
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-warning">
            Finanzas · {breadcrumbDate}
            <span className="mx-2 text-leaf" aria-hidden="true">•</span>
            {selectedFarm?.nombre || 'Todas las fincas'}
          </p>
          <h1 className="mt-2 text-4xl text-foreground sm:text-5xl">
            Movimientos financieros
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground sm:text-base">
            Registro simplificado de ventas de café y gastos operativos de la
            finca.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="h-11 rounded-xl border-border bg-card text-ink-soft hover:bg-muted"
            onClick={() => openNewMovement('expense')}
            type="button"
            variant="outline"
          >
            <ArrowDownCircle />
            Registrar gasto
          </Button>
          <Button
            className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
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
          className="inline-flex w-full rounded-xl bg-muted p-1 sm:w-fit"
          role="group"
        >
          {filters.map((filter) => (
            <button
              aria-pressed={typeFilter === filter.value}
              className={`min-h-9 flex-1 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none ${
                typeFilter === filter.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-ink-soft hover:text-foreground'
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
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-11 rounded-xl border-border bg-card pl-10 text-sm shadow-sm placeholder:text-subtle"
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
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-ink-soft shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
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
          className="inline-flex rounded-xl bg-muted p-1"
          role="group"
        >
          {dateFilters.map((filter) => (
            <button
              aria-pressed={dateFilter === filter.value}
              className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-medium transition-colors ${
                dateFilter === filter.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-ink-soft hover:text-foreground'
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
        <Card className="flex flex-row items-center justify-between rounded-2xl border-border/60 bg-muted px-4 py-3 shadow-none">
          <span className="text-sm text-ink-soft">Ventas · {selectedDateFilter.toLocaleLowerCase()}</span>
          <strong className="text-base text-leaf">
            {currencyFormatter.format(filteredSales)}
          </strong>
        </Card>
        <Card className="flex flex-row items-center justify-between rounded-2xl border-destructive/20 bg-destructive-soft px-4 py-3 shadow-none">
          <span className="text-sm text-muted-foreground">Gastos · {selectedDateFilter.toLocaleLowerCase()}</span>
          <strong className="text-base text-destructive">
            {currencyFormatter.format(filteredExpenses)}
          </strong>
        </Card>
      </section>

      {error && (
        <div
          aria-live="assertive"
          className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
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
        <p aria-live="polite" className="py-12 text-center text-sm text-muted-foreground" role="status">
          Cargando movimientos…
        </p>
      ) : filteredMovements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-card px-5 py-14 text-center">
          <p className="font-medium text-ink-soft">
            No hay movimientos para mostrar.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
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
