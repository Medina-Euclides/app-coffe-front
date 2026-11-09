// Página de finanzas: registra ventas y gastos, muestra resumen y movimientos.
import { useMemo, useState } from 'react';
import { ArrowDownCircle, PlusCircle, ReceiptText } from 'lucide-react';
import { Button } from '#components/ui/button';
import MovementFormDialog from './components/MovementFormDialog.jsx';
import MovementCard from './components/MovementCard.jsx';
import MovementDetailDialog from './components/MovementDetailDialog.jsx';
import {
  EMPTY_FINANCE,
  fetchFinanceData,
  getMovementSearchText,
  saveMovementRequest,
} from '#lib/domain/movements';
import { hoy } from '#lib/formatters';
import FinanceSummary from './components/FinanceSummary.jsx';
import MovementFilters from './components/MovementFilters.jsx';
import { DATE_FILTERS } from './financeFilters.js';
import { belongsToPeriod } from '#lib/dates';
import { guardarFincaActiva, leerFincaActiva } from '#services/farmStorage';
import { useApiResource } from '#hooks/useApiResource';
import { filterBySearch, sumBy } from '#lib/utils';
import EmptyState from '#components/shared/EmptyState';
import ErrorBanner from '#components/shared/ErrorBanner';
import LoadingState from '#components/shared/LoadingState';
import PageTitle from '#components/shared/PageTitle';

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
    if (dialogType === 'expense' && movementToEdit?.isAutomatic) {
      return 'Los gastos de mano de obra se administran desde Pagos laborales.';
    }
    try {
      await saveMovementRequest(dialogType, payload, movementToEdit);
      refetch();
      return '';
    } catch (saveError) {
      console.error('Error al guardar el movimiento financiero:', saveError);
      return saveError.message || 'No se pudo guardar el movimiento.';
    }
  };

  const selectedDateFilter =
    DATE_FILTERS.find((item) => item.value === dateFilter)?.label || 'Este mes';
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

      <MovementFilters
        dateFilter={dateFilter}
        farms={farms}
        onDateFilterChange={setDateFilter}
        onFarmChange={(farmId) => {
          setSelectedFarmId(farmId);
          if (farmId) guardarFincaActiva(userId, farmId);
        }}
        onSearchChange={setSearch}
        onTypeFilterChange={setTypeFilter}
        search={search}
        selectedFarmId={selectedFarmId}
        typeFilter={typeFilter}
      />

      <FinanceSummary
        expenses={filteredExpenses}
        periodLabel={selectedDateFilter.toLocaleLowerCase()}
        sales={filteredSales}
      />

      <ErrorBanner message={error} onRetry={refetch} />

      {loading ? (
        <LoadingState className="py-12">Cargando movimientos…</LoadingState>
      ) : filteredMovements.length === 0 ? (
        <EmptyState
          description="Prueba otros filtros o registra una venta o un gasto."
          icon={ReceiptText}
          title="No hay movimientos para mostrar"
        />
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
