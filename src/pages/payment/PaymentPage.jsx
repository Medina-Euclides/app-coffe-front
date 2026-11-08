// Página de pagos laborales: gestiona liquidaciones y registros de pago a trabajadores.
import { useMemo, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { Button } from '#components/ui/button';
import EmptyState from '#components/shared/EmptyState';
import LoadingState from '#components/shared/LoadingState';
import NoticeBanner from '#components/shared/NoticeBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import ListFilters from '#components/shared/ListFilters';
import PaymentCard from './components/PaymentCard.jsx';
import PaymentDetailDialog from './components/PaymentDetailDialog.jsx';
import { buildSettleAndPay, fetchPaymentData } from '#lib/domain/payments';
import { useApiResource } from '#hooks/useApiResource';
import { belongsToPeriod, PERIOD_LABELS } from '#lib/dates';
import { formatoDinero, hoy } from '#lib/formatters';
import { matchesSearch, sumBy } from '#lib/utils';
import PageTitle from '#components/shared/PageTitle';

const EMPTY_PAYMENTS = { settlements: [], historyOffline: false };

function EmptyPayments({ hasSettlements, errorMessage, onRetry }) {
  const hasError = Boolean(errorMessage);
  return (
    <EmptyState
      action={
        hasError && (
          <Button
            className="h-11 rounded-xl border-border text-primary"
            onClick={() => onRetry()}
            type="button"
            variant="outline"
          >
            Intentar de nuevo
          </Button>
        )
      }
      description={
        hasError
          ? errorMessage
          : hasSettlements
            ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
            : 'Para que una jornada aparezca como pendiente de pago, debe estar cerrada. Los pesajes y participaciones de pago por jornal de jornadas cerradas aparecerán aquí si aún no fueron incluidos en una liquidación.'
      }
      icon={hasError ? Search : UserRound}
      title={
        hasError
          ? 'No se pudieron cargar los pagos'
          : hasSettlements
            ? 'No hay resultados para estos filtros'
            : 'No hay pagos en esta pestaña'
      }
    />
  );
}

export default function PaymentPage() {
  const {
    data: { settlements, historyOffline },
    loading,
    error: errorMessage,
    refetch,
  } = useApiResource('payments', fetchPaymentData, { initialData: EMPTY_PAYMENTS });
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [modality, setModality] = useState('all');
  const [tab, setTab] = useState('pending');
  const [todayKey] = useState(hoy);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [payingId, setPayingId] = useState('');
  const [actionError, setActionError] = useState('');

  const handlePaySettlement = async () => {
    if (!paymentTarget || payingId) return;

    if (paymentTarget.status === 'pendiente' && !paymentTarget.farmId) {
      setActionError(
        'No se pudo identificar la finca de la jornada. Actualiza la página; si el problema continúa, verifica que la jornada tenga una finca asociada.',
      );
      setPaymentTarget(null);
      return;
    }
    if (paymentTarget.status === 'pendiente' && !paymentTarget.workerId) {
      setActionError(
        'No se pudo identificar al trabajador de la jornada. Actualiza la página; si el problema continúa, verifica que la jornada tenga un trabajador asociado.',
      );
      setPaymentTarget(null);
      return;
    }

    if (!Number.isFinite(paymentTarget.total) || paymentTarget.total <= 0) {
      setActionError('La liquidación no tiene un total válido para pagar.');
      setPaymentTarget(null);
      return;
    }

    setPayingId(paymentTarget.id);
    setActionError('');
    try {
      // Una sola operación atómica: crear/completar la liquidación, cerrarla y pagarla.
      // Sin conexión queda en la cola y se aplica igual al sincronizar.
      await api.payroll.settleAndPay(buildSettleAndPay(paymentTarget));

      setPaymentTarget(null);
      setTab('paid');
      refetch();
    } catch (error) {
      console.error('Error al registrar el pago laboral:', error);
      setActionError(
        error.message ||
          'No se pudo completar el pago. Actualiza la lista antes de volver a intentarlo.',
      );
      setPaymentTarget(null);
      refetch();
    } finally {
      setPayingId('');
    }
  };

  const filteredSettlements = useMemo(
    () =>
      settlements
        .filter((settlement) =>
          tab === 'paid'
            ? settlement.status === 'pagada'
            : ['abierta', 'liquidada', 'pendiente'].includes(settlement.status),
        )
        .filter(
          (settlement) =>
            settlement.status !== 'abierta' || settlement.items.length > 0,
        )
        .filter((settlement) => belongsToPeriod(settlement.dateKey, period, todayKey))
        .filter((settlement) => {
          if (modality === 'all') return true;
          return settlement.items.some((item) => item.type === modality);
        })
        .filter((settlement) =>
          matchesSearch(
            [settlement.workerName, settlement.identification, settlement.farmName].join(' '),
            search,
          ),
        )
        .sort(
          (first, second) =>
            second.dateKey.localeCompare(first.dateKey) ||
            first.workerName.localeCompare(second.workerName, 'es'),
        ),
    [modality, period, search, settlements, tab, todayKey],
  );

  const total = sumBy(filteredSettlements, (settlement) => settlement.total);
  const periodLabel = PERIOD_LABELS[period];
  const tabSettlements = settlements.filter((settlement) =>
    tab === 'paid'
      ? settlement.status === 'pagada'
      : ['abierta', 'liquidada', 'pendiente'].includes(settlement.status),
  );

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <PageTitle>
            Pagos laborales
          </PageTitle>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span aria-hidden="true" className="size-2 rounded-full bg-leaf" />
            <span>
              {filteredSettlements.length}{' '}
              {filteredSettlements.length === 1 ? 'liquidación' : 'liquidaciones'}{' '}
              {tab === 'paid' ? 'pagadas' : 'pendientes'} {periodLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatoDinero(total)} total</span>
          </p>
        </div>
      </header>

      <NoticeBanner message={actionError} isError />
      {tab === 'paid' && historyOffline && (
        <NoticeBanner message="Sin conexión: solo se muestran los pagos hechos en este dispositivo. El historial completo de pagos necesita conexión." />
      )}

      <Tabs className="w-full gap-4" onValueChange={setTab} value={tab}>
        <TabsList className="grid h-auto w-full max-w-[535px] grid-cols-2 rounded-2xl bg-muted p-1">
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-muted-foreground data-active:bg-primary-hover data-active:text-primary-foreground data-active:shadow-none"
            value="pending"
          >
            Pendientes de pago
          </TabsTrigger>
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-muted-foreground data-active:bg-primary-hover data-active:text-primary-foreground data-active:shadow-none"
            value="paid"
          >
            Pagados
          </TabsTrigger>
        </TabsList>

        <ListFilters
          modality={modality}
          onModalityChange={setModality}
          onPeriodChange={setPeriod}
          onSearchChange={setSearch}
          period={period}
          search={search}
          searchPlaceholder="Buscar por trabajador, cédula o finca…"
        />

        {(['pending', 'paid']).map((tabValue) => (
          <TabsContent className="space-y-3" key={tabValue} value={tabValue}>
            {loading ? (
              <LoadingState boxed>Cargando pagos laborales…</LoadingState>
            ) : filteredSettlements.length ? (
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSettlements.map((settlement) => (
                  <PaymentCard
                    key={settlement.id}
                    onOpen={(target) => {
                      setActionError('');
                      setPaymentTarget(target);
                    }}
                    settlement={settlement}
                  />
                ))}
              </div>
            ) : (
              <EmptyPayments
                errorMessage={errorMessage}
                hasSettlements={tabSettlements.length > 0}
                onRetry={refetch}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <PaymentDetailDialog
        onOpenChange={() => setPaymentTarget(null)}
        onPay={handlePaySettlement}
        paying={Boolean(payingId)}
        settlement={paymentTarget}
      />
    </section>
  );
}
