// Pagos laborales: arma las liquidaciones (pendientes, en curso y pagadas) a partir de
// jornadas, pesajes y liquidaciones de la API, y el pedido de "liquidar y pagar".
import { belongsToPeriod, toDateKey } from '#lib/dates';
import { hoy } from '#lib/formatters';
import { api } from '#services/api';
import { matchesSearch } from '#lib/utils';
import { getFarmId, getId, getWorkerId, getWorkerName, mergeById } from './entities.js';

export function getPaymentMethodLabel(method) {
  return {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    otro: 'Otro',
  }[method] || method || 'Sin método registrado';
}

// Detalles que se mandan al servidor y los que se usan para mostrar el pago en el
// dispositivo mientras se sincroniza.
export function buildSettleAndPay(target) {
  const toAdd = target.items.filter((item) => item.needsAdd);
  const daily = toAdd.filter((item) => item.type === 'jornal');
  const harvest = toAdd.filter((item) => item.type !== 'jornal');
  const existingSettlementId =
    target.status === 'pendiente' ? undefined : target.id;
  return {
    existingSettlementId,
    data: {
      worker: target.workerId,
      farm: target.farmId,
      start_date: toDateKey(target.startDate),
      end_date: toDateKey(target.endDate),
      workday_worker_ids: daily.map((item) => item.sourceId),
      harvest_record_ids: harvest.map((item) => item.sourceId),
      date: hoy(),
      amount_paid: target.total.toFixed(2),
      // Por ahora todos los pagos se registran en efectivo.
      payment_method: 'efectivo',
      notes: '',
    },
    preview: {
      workday_details: daily.map((item) => ({
        workday_worker: item.sourceId,
        applied_daily_rate: item.rate.toFixed(2),
        paid_amount: item.amount.toFixed(2),
      })),
      harvest_details: harvest.map((item) => ({
        harvest_record: item.sourceId,
        paid_kg: item.kilograms.toFixed(3),
        applied_kg_rate: item.rate.toFixed(2),
        paid_amount: item.amount.toFixed(2),
      })),
    },
  };
}

export function mapPaymentData({
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
          toDateKey(second.date).localeCompare(toDateKey(first.date)) ||
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
        dateKey: toDateKey(
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
      dateKey: toDateKey(item.date),
      total: 0,
      items: [],
      settlementId: '',
    };
    workerFarm.items.push(item);
    workerFarm.total += item.amount;
    if (toDateKey(item.date) < toDateKey(workerFarm.startDate)) {
      workerFarm.startDate = item.date;
    }
    if (toDateKey(item.date) > toDateKey(workerFarm.endDate)) {
      workerFarm.endDate = item.date;
      workerFarm.dateKey = toDateKey(item.date);
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
      toDateKey(pending.startDate) < toDateKey(settlement.startDate)
        ? pending.startDate
        : settlement.startDate;
    settlement.endDate =
      toDateKey(pending.endDate) > toDateKey(settlement.endDate)
        ? pending.endDate
        : settlement.endDate;
    settlement.dateKey = toDateKey(settlement.endDate);
    pendingByWorkerFarm.delete(key);
  }

  return [
    ...settledEntries,
    ...pendingByWorkerFarm.values(),
  ];
}


// Carga todo lo que necesita la página de pagos. La caché local solo tiene lo pendiente
// de pago (y los pagos hechos sin conexión); el historial de pagados se pide al servidor
// cuando hay conexión.
export async function fetchPaymentData() {
  const [
    cachedSettlements,
    cachedWorkdayDetails,
    cachedHarvestDetails,
    workdays,
    workers,
    farms,
    paidHistory,
  ] = await Promise.all([
    api.payroll.settlements.list(),
    api.payroll.settlementWorkdays.list(),
    api.payroll.settlementHarvests.list(),
    api.workdays.list(),
    api.workers.list(),
    api.farms.list(),
    api.payroll.paidHistory(),
  ]);
  const allSettlements = mergeById(cachedSettlements, paidHistory.items);
  return {
    settlements: mapPaymentData({
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
    historyOffline: paidHistory.offline,
  };
}

const PENDING_STATUSES = ['abierta', 'liquidada', 'pendiente'];

// ¿La liquidación va en la pestaña "Pagados" o en "Pendientes de pago"?
export const isInTab = (settlement, tab) =>
  tab === 'paid' ? settlement.status === 'pagada' : PENDING_STATUSES.includes(settlement.status);

// Liquidaciones de la pestaña que cumplen periodo, modalidad y búsqueda, de la más reciente.
export function filterSettlements(settlements, { tab, period, modality, search, todayKey }) {
  return settlements
    .filter((settlement) => isInTab(settlement, tab))
    // Una liquidación abierta sin detalles no tiene nada que pagar.
    .filter((settlement) => settlement.status !== 'abierta' || settlement.items.length > 0)
    .filter((settlement) => belongsToPeriod(settlement.dateKey, period, todayKey))
    .filter(
      (settlement) =>
        modality === 'all' || settlement.items.some((item) => item.type === modality),
    )
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
    );
}

// Motivo por el que no se puede pagar la liquidación, o '' si se puede.
export function getPaymentBlocker(target) {
  if (target.status === 'pendiente' && !target.farmId) {
    return 'No se pudo identificar la finca de la jornada. Actualiza la página; si el problema continúa, verifica que la jornada tenga una finca asociada.';
  }
  if (target.status === 'pendiente' && !target.workerId) {
    return 'No se pudo identificar al trabajador de la jornada. Actualiza la página; si el problema continúa, verifica que la jornada tenga un trabajador asociado.';
  }
  if (!Number.isFinite(target.total) || target.total <= 0) {
    return 'La liquidación no tiene un total válido para pagar.';
  }
  return '';
}
