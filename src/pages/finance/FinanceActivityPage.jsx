// Página de finanzas: registra ventas y gastos, muestra resumen y movimientos.
import { useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  PlusCircle,
  Search,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import { Input } from '#components/ui/input';
import { api } from '#services/api';
import MovementFormDialog from './components/MovementFormDialog.jsx';
import MovementCard from './components/MovementCard.jsx';
import MovementDetailDialog from './components/MovementDetailDialog.jsx';
import { expenseCategoryLabels } from '#lib/domain/movements';
import { belongsToPeriod } from '#lib/dates';
import { formatoDinero, hoy } from '#lib/formatters';
import { guardarFincaActiva, leerFincaActiva } from '#services/farmStorage';
import { useApiResource } from '#hooks/useApiResource';
import { filterBySearch, sumBy } from '#lib/utils';
import PageTitle from '#components/shared/PageTitle';
import SegmentedControl from '#components/shared/SegmentedControl';

const categories = expenseCategoryLabels;

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

const EMPTY_FINANCE = { farms: [], movements: [] };

const fetchFinanceData = async () => {
  const [farms, sales, expenses] = await Promise.all([
    api.farms.list(),
    api.production.sales.list(),
    api.finance.expenses.list(),
  ]);
  return { farms, movements: mapMovements(sales, expenses, farms) };
};

const getMovementSearchText = (movement) =>
  [
    movement.title,
    movement.buyer,
    movement.categoryLabel,
    ...(movement.type === 'sale' ? [movement.notes] : []),
  ]
    .filter(Boolean)
    .join(' ');

export default function FinanceActivityPage({ usuario }) {
  const userId = usuario?.id || 'default';
  const {
    data: { farms, movements },
    loading,
    error,
    refetch,
  } = useApiResource(`finance:${userId}`, fetchFinanceData, { initialData: EMPTY_FINANCE });
  // Finca elegida aquí o la última activa; si ya no existe, se muestran todas.
  const [chosenFarmId, setSelectedFarmId] = useState(() => leerFincaActiva(userId));
  const selectedFarmId = farms.some((farm) => String(farm.id) === String(chosenFarmId))
    ? String(chosenFarmId)
    : '';
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('month');
  const [search, setSearch] = useState('');
  const [dialogType, setDialogType] = useState(null);
  const [movementToEdit, setMovementToEdit] = useState(null);
  const [movementToView, setMovementToView] = useState(null);
  const [todayKey] = useState(hoy);

  const filteredMovements = useMemo(() => {
    const matching = movements.filter(
      (movement) =>
        (!selectedFarmId || movement.farmId === selectedFarmId) &&
        (typeFilter === 'all' || movement.type === typeFilter) &&
        belongsToPeriod(String(movement.date || '').slice(0, 10), dateFilter, todayKey),
    );
    return filterBySearch(matching, search, getMovementSearchText);
  }, [dateFilter, movements, search, selectedFarmId, todayKey, typeFilter]);

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
      refetch();
      return '';
    } catch (saveError) {
      console.error('Error al guardar el movimiento financiero:', saveError);
      return saveError.message || 'No se pudo guardar el movimiento.';
    }
  };

  const selectedDateFilter =
    dateFilters.find((item) => item.value === dateFilter)?.label || 'Este mes';
  const filteredSales = sumBy(
    filteredMovements.filter((movement) => movement.type === 'sale'),
    (movement) => movement.amount,
  );
  const filteredExpenses = sumBy(
    filteredMovements.filter((movement) => movement.type === 'expense'),
    (movement) => movement.amount,
  );

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <PageTitle>
            Movimientos financieros
          </PageTitle>
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
        <SegmentedControl label="Tipo de movimiento" onChange={setTypeFilter} options={filters} value={typeFilter} />

        <div className="relative min-w-0 flex-1">
          <label className="sr-only" htmlFor="finance-search">
            Buscar por concepto, comprador o categoría
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-12 rounded-xl border-border bg-card pl-10 text-base shadow-sm placeholder:text-subtle"
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
          className="h-12 rounded-xl border border-border bg-card px-3 text-base text-ink-soft shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          id="finance-farm"
          onChange={(event) => {
            setSelectedFarmId(event.target.value);
            if (event.target.value) {
              guardarFincaActiva(userId, event.target.value);
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

        <SegmentedControl label="Período" onChange={setDateFilter} options={dateFilters} value={dateFilter} />
      </section>

      <section
        aria-label={`Resumen ${selectedDateFilter.toLocaleLowerCase()}`}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Card className="flex flex-row items-center justify-between rounded-2xl border-border/60 bg-muted px-4 py-3 shadow-none">
          <span className="text-sm text-ink-soft">Ventas · {selectedDateFilter.toLocaleLowerCase()}</span>
          <strong className="text-base text-leaf">
            {formatoDinero(filteredSales)}
          </strong>
        </Card>
        <Card className="flex flex-row items-center justify-between rounded-2xl border-destructive/20 bg-destructive-soft px-4 py-3 shadow-none">
          <span className="text-sm text-muted-foreground">Gastos · {selectedDateFilter.toLocaleLowerCase()}</span>
          <strong className="text-base text-destructive">
            {formatoDinero(filteredExpenses)}
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
            onClick={refetch}
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
          className="grid gap-2.5 md:grid-cols-2"
        >
          {filteredMovements.map((movement) => (
            <MovementCard
              key={`${movement.type}-${movement.id}`}
              movement={movement}
              onOpen={setMovementToView}
            />
          ))}
        </section>
      )}

      <MovementDetailDialog
        movement={movementToView}
        onEdit={(movement) => {
          setMovementToView(null);
          setMovementToEdit(movement);
          setDialogType(movement.type);
        }}
        onOpenChange={() => setMovementToView(null)}
      />

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
    </section>
  );
}
