// Página de pagos laborales: gestiona liquidaciones y registros de pago a trabajadores.
import { useEffect, useMemo, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import NoticeBanner from '#components/shared/NoticeBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import { DATA_EVENT } from '#services/syncService';
import ListFilters from '#components/shared/ListFilters';
import PaymentCard from './components/PaymentCard.jsx';
import PaymentDetailDialog from './components/PaymentDetailDialog.jsx';
import { buildSettleAndPay, mapPaymentData } from '#lib/domain/payments';
import { mergeById } from '#lib/domain/entities';
import { belongsToPeriod, PERIOD_LABELS } from '#lib/dates';
import { formatoDinero, hoy } from '#lib/formatters';
import PageTitle from '#components/shared/PageTitle';

function EmptyPayments({ hasSettlements, errorMessage, onRetry }) {
  const hasError = Boolean(errorMessage);
  return (
    <Card className="flex flex-col items-center gap-3 rounded-2xl border-border bg-card px-6 py-12 text-center shadow-none">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-tint text-primary">
        {hasError ? (
          <Search aria-hidden="true" className="size-6" />
        ) : (
          <UserRound aria-hidden="true" className="size-6" />
        )}
      </span>
      <div>
        <h2 className="font-semibold text-foreground">
          {hasError
            ? 'No se pudieron cargar los pagos'
            : hasSettlements
              ? 'No hay resultados para estos filtros'
              : 'No hay pagos en esta pestaña'}
        </h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {hasError
            ? errorMessage
            : hasSettlements
              ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
              : 'Para que una jornada aparezca como pendiente de pago, debe estar cerrada. Los pesajes y participaciones de pago por jornal de jornadas cerradas aparecerán aquí si aún no fueron incluidos en una liquidación.'}
        </p>
      </div>
      {hasError && (
        <Button
          className="rounded-xl border-border text-primary"
          onClick={onRetry}
          type="button"
          variant="outline"
        >
          Intentar de nuevo
        </Button>
      )}
    </Card>
  );
}

export default function PaymentPage() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [modality, setModality] = useState('all');
  const [tab, setTab] = useState('pending');
  const [retry, setRetry] = useState(0);
  const [todayKey] = useState(hoy);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [payingId, setPayingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [historyOffline, setHistoryOffline] = useState(false);

  // Recarga cuando la sincronización trae datos nuevos (p. ej. un pago offline ya enviado).
  useEffect(() => {
    const reload = () => setRetry((current) => current + 1);
    window.addEventListener(DATA_EVENT, reload);
    return () => window.removeEventListener(DATA_EVENT, reload);
  }, []);

  useEffect(() => {
    let active = true;
    // La caché local solo tiene lo pendiente de pago (y los pagos hechos sin conexión);
    // el historial de pagados se pide al servidor cuando hay conexión.
    Promise.all([
      api.payroll.settlements.list(),
      api.payroll.settlementWorkdays.list(),
      api.payroll.settlementHarvests.list(),
      api.workdays.list(),
      api.workers.list(),
      api.farms.list(),
      api.payroll.paidHistory(),
    ])
      .then(
        ([
          cachedSettlements,
          cachedWorkdayDetails,
          cachedHarvestDetails,
          workdays,
          workers,
          farms,
          paidHistory,
        ]) => {
          if (!active) return;
          const allSettlements = mergeById(cachedSettlements, paidHistory.items);
          setSettlements(
            mapPaymentData({
              settlements: allSettlements,
              workdayDetails: mergeById(
                cachedWorkdayDetails,
                allSettlements.flatMap((item) => item.workday_details || []),
              ),
              harvestDetails: mergeById(
                cachedHarvestDetails,
                allSettlements.flatMap((item) => item.harvest_details || []),
              ),
              workdays,
              workers,
              farms,
              payments: [],
            }),
          );
          setHistoryOffline(paidHistory.offline);
          setErrorMessage('');
        },
      )
      .catch((error) => {
        if (!active) return;
        console.error('Error al cargar pagos laborales:', error);
        setErrorMessage(error.message || 'No se pudieron cargar los pagos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

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
      setLoading(true);
      setRetry((current) => current + 1);
    } catch (error) {
      console.error('Error al registrar el pago laboral:', error);
      setActionError(
        error.message ||
          'No se pudo completar el pago. Actualiza la lista antes de volver a intentarlo.',
      );
      setPaymentTarget(null);
      setLoading(true);
      setRetry((current) => current + 1);
    } finally {
      setPayingId('');
    }
  };

  const query = search.trim().toLocaleLowerCase();
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
        .filter((settlement) => {
          if (!query) return true;
          return [
            settlement.workerName,
            settlement.identification,
            settlement.farmName,
          ]
            .join(' ')
            .toLocaleLowerCase()
            .includes(query);
        })
        .sort(
          (first, second) =>
            second.dateKey.localeCompare(first.dateKey) ||
            first.workerName.localeCompare(second.workerName, 'es'),
        ),
    [modality, period, query, settlements, tab, todayKey],
  );

  const total = filteredSettlements.reduce(
    (sum, settlement) => sum + settlement.total,
    0,
  );
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
              <p
                aria-live="polite"
                className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground"
                role="status"
              >
                Cargando pagos laborales…
              </p>
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
                onRetry={() => {
                  setLoading(true);
                  setRetry((current) => current + 1);
                }}
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
