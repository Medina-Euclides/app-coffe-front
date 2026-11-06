// Página de pagos laborales: gestiona liquidaciones y registros de pago a trabajadores.
import { useEffect, useMemo, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import NoticeBanner from '#components/shared/NoticeBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import WorkdayFilters from '#pages/workday/components/WorkdayFilters.jsx';
import PaymentCard from './components/PaymentCard.jsx';
import PaymentDetailDialog from './components/PaymentDetailDialog.jsx';
import { currencyFormatter, getDateKey } from './utils/paymentFormat.js';
import PageTitle from '#components/shared/PageTitle';

function getId(value) {
  if (value && typeof value === 'object') return String(value.id ?? '');
  return value == null ? '' : String(value);
}

function getFarmId(record) {
  const farmValues = [
    record?.farm,
    record?.farm_id,
    record?.farmId,
    record?.id_farm,
  ];
  for (const farm of farmValues) {
    if (farm && typeof farm === 'object') {
      const id = farm.id ?? farm.pk ?? farm.uuid;
      if (id) return String(id);
    } else if (farm != null && String(farm)) {
      return String(farm);
    }
  }
  return '';
}

function getWorkerId(participant) {
  const workerValues = [
    participant?.worker,
    participant?.worker_id,
    participant?.workerId,
    participant?.id_worker,
  ];
  for (const worker of workerValues) {
    if (worker && typeof worker === 'object') {
      const id = worker.id ?? worker.pk ?? worker.uuid ?? worker.worker_id;
      if (id) return String(id);
    } else if (worker != null && String(worker)) {
      return String(worker);
    }
  }
  return '';
}

function getLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWorkerName(worker) {
  if (!worker) return '';
  return (
    worker.nombre ||
    worker.name ||
    worker.full_name ||
    [worker.first_name, worker.last_name].filter(Boolean).join(' ')
  );
}

function mapPaymentData({
  settlements,
  workdayDetails,
  harvestDetails,
  workdays,
  workers,
  farms,
  payments,
}) {
  const workersById = new Map(
    workers.map((worker) => [String(worker.id), worker]),
  );
  const farmsById = new Map(farms.map((farm) => [String(farm.id), farm]));
  const participantById = new Map();
  const harvestRecordById = new Map();

  for (const workday of workdays) {
    for (const participant of workday.participants || []) {
      const workerId = getWorkerId(participant);
      participantById.set(String(participant.id), {
        ...participant,
        workday,
        worker: workersById.get(workerId) || participant.worker,
      });
      for (const detail of participant.details || []) {
        for (const record of detail.harvest_records || []) {
          harvestRecordById.set(String(record.id), {
            ...record,
            detail,
            participant,
            workday,
          });
        }
      }
    }
  }

  const workdayDetailsBySettlement = new Map();
  for (const detail of workdayDetails) {
    const settlementId = getId(detail.settlement);
    workdayDetailsBySettlement.set(settlementId, [
      ...(workdayDetailsBySettlement.get(settlementId) || []),
      detail,
    ]);
  }

  const harvestDetailsBySettlement = new Map();
  for (const detail of harvestDetails) {
    const settlementId = getId(detail.settlement);
    harvestDetailsBySettlement.set(settlementId, [
      ...(harvestDetailsBySettlement.get(settlementId) || []),
      detail,
    ]);
  }

  const paymentsBySettlement = new Map(
    payments.map((payment) => [getId(payment.settlement), payment]),
  );

  const settledWorkdayIds = new Set(
    workdayDetails.map((detail) => getId(detail.workday_worker)),
  );
  const settledHarvestIds = new Set(
    harvestDetails.map((detail) => getId(detail.harvest_record)),
  );

  const settledEntries = settlements
    .filter((settlement) => settlement.status !== 'anulada')
    .map((settlement) => {
      const workerId = getId(settlement.worker);
      const farmId = getFarmId(settlement);
      const worker = workersById.get(workerId);
      const farm = farmsById.get(farmId);
      const dailyItems = (
        workdayDetailsBySettlement.get(String(settlement.id)) || []
      ).map((item) => {
        const participant = participantById.get(getId(item.workday_worker));
        const workday = participant?.workday;
        return {
          id: String(item.id),
          sourceId: getId(item.workday_worker),
          type: 'jornal',
          needsAdd: false,
          date: workday?.date || '',
          time: '',
          amount: Number(item.paid_amount) || 0,
          rate: Number(item.applied_daily_rate) || 0,
          kilograms: 0,
          lotName: '',
          farmName: farm?.name || '',
        };
      });
      const harvestItems = (
        harvestDetailsBySettlement.get(String(settlement.id)) || []
      ).map((item) => {
        const harvest = harvestRecordById.get(getId(item.harvest_record));
        const workday = harvest?.workday;
        return {
          id: String(item.id),
          sourceId: getId(item.harvest_record),
          type: 'kilogram',
          needsAdd: false,
          date: workday?.date || '',
          time: String(harvest?.time || ''),
          amount: Number(item.paid_amount) || 0,
          rate: Number(item.applied_kg_rate) || 0,
          kilograms: Number(item.paid_kg) || 0,
          lotName:
            harvest?.detail?.lot_name ||
            harvest?.detail?.lot?.name ||
            harvest?.detail?.lot?.nombre ||
            '',
          farmName: farm?.name || '',
        };
      });
      const items = [...dailyItems, ...harvestItems].sort(
        (first, second) =>
          getDateKey(second.date).localeCompare(getDateKey(first.date)) ||
          second.time.localeCompare(first.time),
      );
      const payment =
        settlement.payment || paymentsBySettlement.get(String(settlement.id));

      return {
        id: String(settlement.id),
        workerId,
        farmId,
        status: settlement.status,
        workerName:
          getWorkerName(worker) || settlement.worker_name || 'Trabajador',
        identification: worker?.identification || '',
        farmName: farm?.name || farm?.nombre || settlement.farm_name || 'Finca',
        startDate: settlement.start_date,
        endDate: settlement.end_date,
        dateKey: getDateKey(
          payment?.date || settlement.paid_at || settlement.end_date,
        ),
        total:
          Number(
            payment?.amount_paid ??
              (settlement.status === 'abierta'
                ? items.reduce((sum, item) => sum + item.amount, 0)
                : settlement.total_calculated),
          ) || 0,
        paymentDate: payment?.date || settlement.paid_at || '',
        paymentMethod: payment?.payment_method || '',
        notes: payment?.notes || '',
        items,
      };
    });

  const pendingByWorkerFarm = new Map();
  const appendPendingItem = ({
    workerId,
    worker,
    farmId,
    farmName,
    item,
  }) => {
    const key = `${workerId}:${farmId}`;
    const workerFarm = pendingByWorkerFarm.get(key) || {
      id: `pending:${key}`,
      workerId,
      farmId,
      status: 'pendiente',
      workerName: getWorkerName(worker) || 'Trabajador',
      identification: worker?.identification || '',
      farmName: farmName || 'Finca',
      startDate: item.date,
      endDate: item.date,
      dateKey: getDateKey(item.date),
      total: 0,
      items: [],
      settlementId: '',
    };
    workerFarm.items.push(item);
    workerFarm.total += item.amount;
    if (getDateKey(item.date) < getDateKey(workerFarm.startDate)) {
      workerFarm.startDate = item.date;
    }
    if (getDateKey(item.date) > getDateKey(workerFarm.endDate)) {
      workerFarm.endDate = item.date;
      workerFarm.dateKey = getDateKey(item.date);
    }
    pendingByWorkerFarm.set(key, workerFarm);
  };

  for (const workday of workdays) {
    if (workday.status !== 'cerrada') continue;
    const farmId = getFarmId(workday);
    const farm = farmsById.get(farmId);
    const farmName =
      workday.farm_name || farm?.name || farm?.nombre || 'Finca';

    for (const participant of workday.participants || []) {
      if (participant.settlement_status !== 'pendiente') continue;
      const participantId = getId(participant);
      const workerId = getWorkerId(participant);
      const worker = workersById.get(workerId) || participant.worker;
      const paymentMode = participant.payment_mode;
      const isPerKilogram = paymentMode === 'kg';

      if (!isPerKilogram && !settledWorkdayIds.has(participantId)) {
        const rate = Number(participant.agreed_rate) || 0;
        appendPendingItem({
          workerId,
          worker,
          farmId,
          farmName,
          item: {
            id: participantId,
            sourceId: participantId,
            type: 'jornal',
            needsAdd: true,
            date: workday.date,
            time: '',
            amount: rate,
            rate,
            kilograms: 0,
            lotName: '',
            farmName,
          },
        });
      }

      if (!isPerKilogram) continue;
      for (const detail of participant.details || []) {
        for (const record of detail.harvest_records || []) {
          const recordId = getId(record);
          if (
            !recordId ||
            record.settlement_status !== 'registrado' ||
            settledHarvestIds.has(recordId)
          ) {
            continue;
          }
          const kilograms = Number(record.quantity_kg) || 0;
          const rate = Number(participant.agreed_rate) || 0;
          appendPendingItem({
            workerId,
            worker,
            farmId,
            farmName,
            item: {
              id: recordId,
              sourceId: recordId,
              type: 'kilogram',
              needsAdd: true,
              date: workday.date,
              time: String(record.time || ''),
              amount: kilograms * rate,
              rate,
              kilograms,
              lotName:
                detail.lot_name ||
                detail.lot?.name ||
                detail.lot?.nombre ||
                'Lote',
              farmName,
            },
          });
        }
      }
    }
  }

  for (const settlement of settledEntries) {
    if (settlement.status !== 'abierta') continue;
    const key = `${settlement.workerId}:${settlement.farmId}`;
    const pending = pendingByWorkerFarm.get(key);
    if (!pending) continue;

    settlement.items.push(...pending.items);
    settlement.total += pending.total;
    settlement.startDate =
      getDateKey(pending.startDate) < getDateKey(settlement.startDate)
        ? pending.startDate
        : settlement.startDate;
    settlement.endDate =
      getDateKey(pending.endDate) > getDateKey(settlement.endDate)
        ? pending.endDate
        : settlement.endDate;
    settlement.dateKey = getDateKey(settlement.endDate);
    pendingByWorkerFarm.delete(key);
  }

  return [
    ...settledEntries,
    ...pendingByWorkerFarm.values(),
  ];
}

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
  const [todayKey] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [payingId, setPayingId] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.payroll.settlements.list(),
      api.payroll.settlementWorkdays.list(),
      api.payroll.settlementHarvests.list(),
      api.workdays.list(),
      api.workers.list(),
      api.farms.list(),
      api.payroll.payments.list(),
    ])
      .then(
        ([
          loadedSettlements,
          workdayDetails,
          harvestDetails,
          workdays,
          workers,
          farms,
          payments,
        ]) => {
          if (!active) return;
          setSettlements(
            mapPaymentData({
              settlements: loadedSettlements,
              workdayDetails,
              harvestDetails,
              workdays,
              workers,
              farms,
              payments,
            }),
          );
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

    setPayingId(paymentTarget.id);
    setActionError('');
    try {
      let settlementId = paymentTarget.id;
      let settlementToClose = paymentTarget;

      if (paymentTarget.status === 'pendiente') {
        const createdSettlement = await api.payroll.settlements.create({
          worker: paymentTarget.workerId,
          farm: paymentTarget.farmId,
          start_date: paymentTarget.startDate,
          end_date: paymentTarget.endDate,
        });
        settlementId = String(createdSettlement.id);
        settlementToClose = createdSettlement;
      }

      if (
        paymentTarget.status === 'pendiente' ||
        paymentTarget.status === 'abierta'
      ) {
        for (const item of paymentTarget.items) {
          if (!item.needsAdd) continue;
          if (item.type === 'jornal') {
            await api.payroll.settlements.addWorkday({
              settlement_id: settlementId,
              workday_worker_id: item.sourceId,
            });
          } else {
            await api.payroll.settlements.addHarvest({
              settlement_id: settlementId,
              harvest_record_id: item.sourceId,
            });
          }
        }
        settlementToClose = await api.payroll.settlements.close(settlementId);
      }

      const amount =
        paymentTarget.status === 'liquidada'
          ? paymentTarget.total
          : Number(settlementToClose.total_calculated);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          'El backend no devolvió un total válido para registrar el pago.',
        );
      }

      await api.payroll.settlements.pay({
        settlement_id: settlementId,
        date: getLocalDate(),
        amount_paid: amount.toFixed(2),
        // Por ahora todos los pagos se registran en efectivo.
        payment_method: 'efectivo',
        notes: '',
      });

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
        .filter((settlement) => {
          if (period === 'all') return true;
          if (!settlement.dateKey) return false;
          if (period === 'today') return settlement.dateKey === todayKey;
          if (period === 'month') {
            return settlement.dateKey.slice(0, 7) === todayKey.slice(0, 7);
          }
          return settlement.dateKey.slice(0, 4) === todayKey.slice(0, 4);
        })
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
  const periodLabel = {
    today: 'hoy',
    month: 'este mes',
    year: 'este año',
    all: 'en total',
  }[period];
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
            <span>{currencyFormatter.format(total)} total</span>
          </p>
        </div>
      </header>

      <NoticeBanner message={actionError} isError />

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

        <WorkdayFilters
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
