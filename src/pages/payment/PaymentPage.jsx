import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  LoaderCircle,
  MapPin,
  Search,
  UserRound,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import WorkdayFilters from '#pages/workday/components/WorkdayFilters.jsx';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const kilogramsFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 3,
});

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

function getDateKey(value) {
  return value ? String(value).slice(0, 10) : '';
}

function getLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value) {
  const dateKey = getDateKey(value);
  if (!dateKey) return 'Fecha sin registrar';
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Fecha sin registrar'
    : new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
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

function getPaymentMethodLabel(method) {
  return {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    otro: 'Otro',
  }[method] || method || 'Sin método registrado';
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

function PaymentCard({ settlement, onPay, paying }) {
  const [expanded, setExpanded] = useState(false);
  const isPaid = settlement.status === 'pagada';
  const isPending = settlement.status === 'pendiente';
  const paymentDay = isPaid ? settlement.paymentDate : settlement.endDate;
  const paymentDateLabel = isPaid
    ? 'Pagada el'
    : isPending
      ? 'Jornada finalizada'
      : settlement.status === 'abierta'
        ? 'Liquidación abierta'
        : 'Liquidada el';

  return (
    <Card className="gap-0 rounded-2xl border border-[#e8ebe6] bg-white py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0eb] px-4 py-3 sm:px-5">
        <span
          className={
            isPaid
              ? 'rounded-lg border border-[#c2ebdc] bg-[#effbf6] px-3 py-1.5 text-xs font-semibold text-[#19805d]'
              : 'rounded-lg border border-[#f1dfb8] bg-[#fff9eb] px-3 py-1.5 text-xs font-semibold text-[#936b18]'
          }
        >
          {isPaid
            ? 'Pago realizado'
            : isPending
              ? 'Pendiente de liquidar'
              : settlement.status === 'abierta'
                ? 'En liquidación'
                : 'Pendiente de pago'}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-[#748074]">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {paymentDateLabel}
          {!isPending && ` ${formatDate(paymentDay)}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#173d30] text-base font-semibold text-white"
        >
          {settlement.workerName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0] || '')
            .join('')
            .toLocaleUpperCase('es')}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-[#263b2c]">
            {settlement.workerName}
          </h2>
          {settlement.identification && (
            <p className="mt-1 text-sm text-[#899489]">
              C.C. {settlement.identification}
            </p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#748074]">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            {settlement.farmName}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xl font-bold tracking-tight text-[#183d2b] sm:text-2xl">
            {currencyFormatter.format(settlement.total)}
          </p>
          <p className="mt-0.5 text-xs text-[#899489]">
            {formatDate(settlement.startDate)} – {formatDate(settlement.endDate)}
          </p>
        </div>
        <Button
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Ocultar' : 'Ver'} detalles de pago de ${settlement.workerName}`}
          className="h-10 shrink-0 rounded-xl bg-[#f4f6f3] px-3 text-sm font-medium text-[#3e5848] hover:bg-[#eaf0e8]"
          onClick={() => setExpanded((current) => !current)}
          type="button"
          variant="ghost"
        >
          {expanded ? 'Ocultar detalle' : 'Ver detalle'}
          {expanded ? (
            <ChevronUp aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-[#edf0eb] bg-[#fbfcfa] px-4 py-3 sm:px-5">
          {isPaid && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#edf0eb] pb-3 text-sm text-[#52655a]">
              <span className="inline-flex items-center gap-1.5">
                <Banknote aria-hidden="true" className="size-4" />
                {getPaymentMethodLabel(settlement.paymentMethod)}
              </span>
              {settlement.notes && <span>{settlement.notes}</span>}
            </div>
          )}
          {settlement.items.length ? (
            <ul className="divide-y divide-[#edf0eb]">
              {settlement.items.map((item) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 text-sm"
                  key={`${item.type}-${item.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#34483a]">
                      {item.type === 'kilogram'
                        ? `${kilogramsFormatter.format(item.kilograms)} kg · ${item.lotName || 'Recolección'}`
                        : 'Jornada por jornal'}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#748074]">
                      <span>{formatDate(item.date)}</span>
                      {item.time && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 aria-hidden="true" className="size-3" />
                            {item.time.slice(0, 5)}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>
                        Tarifa{' '}
                        {currencyFormatter.format(item.rate)}
                        {item.type === 'kilogram' ? ' / kg' : ' / jornal'}
                      </span>
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-[#244b38]">
                    {currencyFormatter.format(item.amount)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-2 text-sm text-[#748074]">
              No hay detalles disponibles para esta liquidación.
            </p>
          )}
        </div>
      )}
      <div className="flex justify-end border-t border-[#edf0eb] px-4 py-3 sm:px-5">
        <Button
          className={
            isPaid
              ? 'min-w-28 rounded-xl bg-[#edf4eb] text-[#52715b]'
              : 'min-w-28 rounded-xl bg-[#173d30] text-white hover:bg-[#214b32]'
          }
          disabled={isPaid || paying || settlement.total <= 0}
          onClick={() => onPay(settlement)}
          type="button"
          variant={isPaid ? 'outline' : 'default'}
        >
          {paying ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : isPaid ? (
            'Pagado'
          ) : (
            'Pagar'
          )}
        </Button>
      </div>
    </Card>
  );
}

function EmptyPayments({ hasSettlements, errorMessage, onRetry }) {
  const hasError = Boolean(errorMessage);
  return (
    <Card className="flex flex-col items-center gap-3 rounded-2xl border-[#e7ebe4] bg-white px-6 py-12 text-center shadow-none">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4eb] text-[#315d3b]">
        {hasError ? (
          <Search aria-hidden="true" className="size-6" />
        ) : (
          <UserRound aria-hidden="true" className="size-6" />
        )}
      </span>
      <div>
        <h2 className="font-semibold text-[#263b2c]">
          {hasError
            ? 'No se pudieron cargar los pagos'
            : hasSettlements
              ? 'No hay resultados para estos filtros'
              : 'No hay pagos en esta pestaña'}
        </h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-[#748074]">
          {hasError
            ? errorMessage
            : hasSettlements
              ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
              : 'Para que una jornada aparezca como pendiente de pago, debe estar cerrada. Los pesajes y participaciones de pago por jornal de jornadas cerradas aparecerán aquí si aún no fueron incluidos en una liquidación.'}
        </p>
      </div>
      {hasError && (
        <Button
          className="rounded-xl border-[#dbe9dc] text-[#254d37]"
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
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [paymentNotes, setPaymentNotes] = useState('');
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
        payment_method: paymentMethod,
        notes: paymentNotes.trim(),
      });

      setPaymentTarget(null);
      setPaymentNotes('');
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
          <h1 className="text-balance text-2xl font-bold tracking-tight text-[#183d2b] sm:text-3xl">
            Pagos laborales
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-[#738076]">
            <span aria-hidden="true" className="size-2 rounded-full bg-[#57a276]" />
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

      {actionError && (
        <p
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {actionError}
        </p>
      )}

      <Tabs className="w-full gap-4" onValueChange={setTab} value={tab}>
        <TabsList className="grid h-auto w-full max-w-[535px] grid-cols-2 rounded-2xl bg-[#e9ede7] p-1">
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-[#69776d] data-active:bg-[#173d30] data-active:text-white data-active:shadow-none"
            value="pending"
          >
            Pendientes de pago
          </TabsTrigger>
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-[#69776d] data-active:bg-[#173d30] data-active:text-white data-active:shadow-none"
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
                className="rounded-2xl border border-[#e7ebe4] bg-white px-5 py-10 text-center text-sm text-[#748074]"
                role="status"
              >
                Cargando pagos laborales…
              </p>
            ) : filteredSettlements.length ? (
              filteredSettlements.map((settlement) => (
                <PaymentCard
                  key={settlement.id}
                  onPay={(target) => {
                    setPaymentMethod('efectivo');
                    setPaymentNotes('');
                    setActionError('');
                    setPaymentTarget(target);
                  }}
                  paying={payingId === settlement.id}
                  settlement={settlement}
                />
              ))
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

      <Dialog
        onOpenChange={(open) => {
          if (!open && !payingId) setPaymentTarget(null);
        }}
        open={Boolean(paymentTarget)}
      >
        <DialogContent className="rounded-2xl border-[#e4e9e1] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#183d2b]">
              Confirmar pago laboral
            </DialogTitle>
            <DialogDescription className="leading-5">
              Registra el pago de {paymentTarget?.workerName} por{' '}
              {currencyFormatter.format(paymentTarget?.total || 0)}. La
              liquidación pasará a la pestaña de pagos realizados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-[#244b38]"
                htmlFor="payment-method"
              >
                Método de pago
              </label>
              <Select
                onValueChange={setPaymentMethod}
                value={paymentMethod}
              >
                <SelectTrigger
                  className="h-11 w-full rounded-xl border-[#d1ddd2] bg-white"
                  id="payment-method"
                >
                  <SelectValue placeholder="Selecciona el método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-[#244b38]"
                htmlFor="payment-notes"
              >
                Nota (opcional)
              </label>
              <Input
                autoComplete="off"
                className="h-11 rounded-xl border-[#d1ddd2] bg-white"
                id="payment-notes"
                onChange={(event) => setPaymentNotes(event.target.value)}
                placeholder="Referencia o comentario del pago"
                value={paymentNotes}
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              className="rounded-xl text-[#68766b]"
              disabled={Boolean(payingId)}
              onClick={() => setPaymentTarget(null)}
              type="button"
              variant="ghost"
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl bg-[#173d30] px-5 text-white hover:bg-[#214b32]"
              disabled={Boolean(payingId) || !paymentTarget}
              onClick={handlePaySettlement}
              type="button"
            >
              {payingId ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Banknote aria-hidden="true" className="size-4" />
              )}
              {payingId ? 'Procesando pago…' : 'Confirmar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
