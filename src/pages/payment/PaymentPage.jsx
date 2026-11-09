// Página de pagos laborales: liquidaciones pendientes y pagadas, y el pago en efectivo.
import { useMemo, useState } from 'react';
import LoadingState from '#components/shared/LoadingState';
import NoticeBanner from '#components/shared/NoticeBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import ListFilters from '#components/shared/ListFilters';
import PaymentCard from './components/PaymentCard.jsx';
import EmptyPayments from './components/EmptyPayments.jsx';
import PaymentDetailDialog from './components/PaymentDetailDialog.jsx';
import { usePaySettlement } from './hooks/usePaySettlement.js';
import { fetchPaymentData, filterSettlements, isInTab } from '#lib/domain/payments';
import { useApiResource } from '#hooks/useApiResource';
import { PERIOD_LABELS } from '#lib/dates';
import { formatoDinero, hoy } from '#lib/formatters';
import { sumBy } from '#lib/utils';
import PageTitle from '#components/shared/PageTitle';

const EMPTY_PAYMENTS = { settlements: [], historyOffline: false };


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
  const payment = usePaySettlement({
    onPaid: () => {
      setTab('paid');
      refetch();
    },
    onFailed: refetch,
  });

  const filteredSettlements = useMemo(
    () => filterSettlements(settlements, { tab, period, modality, search, todayKey }),
    [modality, period, search, settlements, tab, todayKey],
  );

  const total = sumBy(filteredSettlements, (settlement) => settlement.total);
  const periodLabel = PERIOD_LABELS[period];
  const hasSettlementsInTab = settlements.some((settlement) => isInTab(settlement, tab));

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

      <NoticeBanner message={payment.error} isError />
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
                    onOpen={payment.open}
                    settlement={settlement}
                  />
                ))}
              </div>
            ) : (
              <EmptyPayments
                errorMessage={errorMessage}
                hasSettlements={hasSettlementsInTab}
                onRetry={refetch}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <PaymentDetailDialog
        onOpenChange={payment.close}
        onPay={payment.pay}
        paying={payment.paying}
        settlement={payment.target}
      />
    </section>
  );
}
