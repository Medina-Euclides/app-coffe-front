// Convierte las jornadas de la API en participaciones, jornadas agrupadas y pesajes.
// Compartido por Jornadas, Pagos, Inicio y las notificaciones.
import { isPerKilogram as isPerKilogramMode } from '#lib/constants';
import { toDateKey } from '#lib/dates';
import { formatoFechaAnio } from '#lib/formatters';
import { getWorkerIdentification, getWorkerName } from './entities.js';

export { getWorkerName };

export { getWeekRange } from '#lib/dates';

export function asAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export function mapParticipant(workday, participant) {
  const details = Array.isArray(participant.details) ? participant.details : [];
  const worker =
    participant.worker && typeof participant.worker === 'object'
      ? participant.worker
      : null;
  const harvestRecords = details.flatMap((item) =>
    Array.isArray(item.harvest_records) ? item.harvest_records : [],
  ).filter((record) => record.settlement_status !== 'anulado');
  const rate = asAmount(participant.agreed_rate ?? workday.agreed_rate);
  const paymentMode = String(
    participant.payment_mode || workday.payment_mode || '',
  ).toLocaleLowerCase();
  const isPerKilogram = isPerKilogramMode(paymentMode);
  const activityNames = details
    .map((item) =>
      item.activity_name ||
      item.activity_type_name ||
      item.activity_type?.name ||
      '',
    )
    .filter(Boolean);
  const activityName =
    [...new Set(activityNames)].join(', ') ||
    participant.activity_name ||
    workday.activity_name ||
    'Actividad laboral';
  const isHarvest =
    isPerKilogram ||
    details.some(
      (item) =>
        item.activity_is_harvest ||
        item.activity_type?.is_harvest ||
        item.is_harvest ||
        (item.activity_name || '').toLocaleLowerCase().includes('recole'),
    );
  const totalKg = harvestRecords.reduce(
    (total, record) =>
      total + asAmount(record.quantity_kg ?? record.kilograms ?? record.kg),
    0,
  );
  const totalAmount = asAmount(
    participant.total_estimated ??
      participant.total_amount ??
      (isPerKilogram ? rate * totalKg : rate),
  );
  const lotNames = details
    .map((item) => item.lot_name || item.lot?.name || item.lot?.nombre)
    .filter(Boolean);
  const date = workday.date || workday.workday_date || workday.fecha;
  const workerId = worker?.id ?? participant.worker;
  const count = Number(participant.harvest_records_count ?? harvestRecords.length);

  return {
    id: participant.id ?? `${workday.id}-${workerId ?? activityName}`,
    workdayId: workday.id,
    farmId: workday.farm?.id ?? workday.farm,
    farmName:
      workday.farm_name ||
      workday.farm?.name ||
      workday.farm?.nombre ||
      '',
    workerId,
    settlementStatus: participant.settlement_status || 'pendiente',
    workdayStatus: workday.status || 'abierta',
    details,
    activityName,
    date,
    dateKey: toDateKey(date),
    identification:
      worker?.identification ||
      worker?.cedula ||
      participant.worker_identification ||
      '',
    isHarvest,
    isPerKilogram,
    paymentMode,
    kgCount: totalKg,
    lot: [...new Set(lotNames)].join(' / ') || participant.lot_name || '',
    paymentLabel: isPerKilogram ? 'Pago por kg' : 'Modalidad: Jornal',
    rate,
    totalAmount,
    weighingCount: Number.isFinite(count) ? count : 0,
    workerName:
      getWorkerName(worker) ||
      participant.worker_name ||
      participant.workerName ||
      '',
  };
}

export function mapWorkday(workday) {
  const participants = Array.isArray(workday.participants)
    ? workday.participants
    : workday.worker
      ? [workday]
      : [];
  return participants.map((participant) => {
    const participantWithDetails =
      Array.isArray(participant.details) || !Array.isArray(workday.details)
        ? participant
        : { ...participant, details: workday.details };
    return mapParticipant(workday, participantWithDetails);
  });
}

export function groupWorkdayParticipants(participants) {
  const grouped = new Map();
  for (const participant of participants) {
    const key = String(participant.workdayId || participant.id);
    const group = grouped.get(key) || {
      id: key,
      workdayId: key,
      farmId: participant.farmId,
      farmName: participant.farmName,
      date: participant.date,
      dateKey: participant.dateKey,
      status: participant.workdayStatus,
      participants: [],
    };
    group.participants.push(participant);
    grouped.set(key, group);
  }

  return [...grouped.values()].map((group) => {
    const entries = group.participants;
    const activeEntries = entries.filter(
      (entry) => entry.settlementStatus !== 'anulado',
    );
    const activityNames = [
      ...new Set(activeEntries.flatMap((entry) => entry.activityName.split(', '))),
    ];
    const lots = [...new Set(activeEntries.flatMap((entry) => entry.lot.split(' / ')).filter(Boolean))];
    const paymentModes = [...new Set(activeEntries.map((entry) => entry.isPerKilogram))];
    const rates = [
      ...new Set(
        activeEntries
          .map((entry) => `${entry.isPerKilogram ? 'kg' : 'jornal'}:${entry.rate}`)
          .filter((rate) => !rate.endsWith(':0')),
      ),
    ];
    const isPerKilogram = paymentModes.length === 1 && paymentModes[0];
    const totalKg = activeEntries.reduce((sum, entry) => sum + entry.kgCount, 0);

    return {
      ...group,
      activityName: activityNames.join(', ') || 'Actividad laboral',
      isHarvest: activeEntries.some((entry) => entry.isHarvest),
      isPerKilogram: Boolean(isPerKilogram),
      hasMixedPayment: paymentModes.length > 1 || rates.length > 1,
      rate: rates.length === 1 ? Number(rates[0].split(':')[1]) : 0,
      lot: lots.join(' / '),
      totalAmount: activeEntries.reduce((sum, entry) => sum + entry.totalAmount, 0),
      kgCount: totalKg,
      weighingCount: activeEntries.reduce((sum, entry) => sum + entry.weighingCount, 0),
      workerCount: activeEntries.length,
      editableParticipantCount: activeEntries.filter(
        (entry) => entry.settlementStatus === 'pendiente',
      ).length,
      participants: activeEntries,
      allParticipants: entries,
      status: group.status,
      workerNames: activeEntries.map((entry) => entry.workerName).filter(Boolean),
    };
  });
}

export function getHarvestRecords(participants) {
  return participants.flatMap((participant) =>
    (Array.isArray(participant.details) ? participant.details : []).flatMap((detail) =>
      (Array.isArray(detail.harvest_records) ? detail.harvest_records : [])
        .filter((record) => record.settlement_status !== 'anulado')
        .map((record) => ({
          id: String(record.id),
          date: participant.date,
          dateKey: participant.dateKey,
          time: String(record.time || ''),
          quantityKg: asAmount(record.quantity_kg ?? record.kilograms ?? record.kg),
          workerId: String(participant.workerId ?? participant.id),
          workerName: participant.workerName || 'Trabajador sin nombre',
          identification: participant.identification,
          farmName: participant.farmName,
          lotName: detail.lot_name || detail.lot?.name || detail.lot?.nombre || 'Lote sin nombre',
          activityName:
            detail.activity_name ||
            detail.activity_type_name ||
            detail.activity_type?.name ||
            'Recolección',
          paymentMode: participant.paymentMode,
        })),
    ),
  );
}

// Trabajador anidado de una participación (o null si solo llegó su id).
function getParticipationWorker(participation) {
  return participation.worker && typeof participation.worker === 'object'
    ? participation.worker
    : null;
}

// Labores de recolección abiertas y pendientes, hasta hoy, donde se puede registrar un pesaje.
export function getHarvestDetails(workdays, activities, today) {
  const harvestActivityIds = new Set(
    activities
      .filter((activity) => activity.is_harvest)
      .map((activity) => String(activity.id)),
  );

  return workdays.flatMap((workday) => {
    const date = workday.date || '';
    const dateKey = String(date).slice(0, 10);
    if (
      !workday.id ||
      !dateKey ||
      dateKey > today ||
      workday.status !== 'abierta'
    ) {
      return [];
    }

    return (Array.isArray(workday.participants) ? workday.participants : [])
      .filter(
        (participation) =>
          participation.settlement_status === 'pendiente' &&
          participation.worker?.is_active !== false,
      )
      .flatMap((participation) => {
        const worker = getParticipationWorker(participation);
        const workerId = worker?.id ?? participation.worker;
        const workerName =
          getWorkerName(worker) ||
          participation.worker_name ||
          participation.nombre_trabajador ||
          '';
        if (!workerId || !workerName) return [];

        const details = Array.isArray(participation.details)
          ? participation.details
          : [];
        return details.flatMap((detail) => {
          const activityTypeId =
            typeof detail.activity_type === 'object'
              ? detail.activity_type.id
              : detail.activity_type ?? detail.activity_type_id;
          if (
            !detail.id ||
            !(
              detail.activity_is_harvest === true ||
              detail.activity_type?.is_harvest === true ||
              harvestActivityIds.has(String(activityTypeId))
            )
          ) {
            return [];
          }

          const activity = activities.find(
            (item) => String(item.id) === String(activityTypeId),
          );
          return [
            {
              id: String(detail.id),
              workdayId: String(workday.id),
              farmId: String(
                workday.farm?.id ?? workday.farm_id ?? workday.farm ?? '',
              ),
              participantId: String(participation.id),
              workerId: String(workerId),
              workerName,
              workerIdentification:
                getWorkerIdentification(worker) || participation.worker_identification || '',
              activityTypeId: String(activityTypeId),
              lotId: String(
                typeof detail.lot === 'object'
                  ? detail.lot.id
                  : detail.lot ?? detail.lot_id ?? '',
              ),
              date,
              dateKey,
              workdayLabel: `${formatoFechaAnio(date)}${
                workday.farm_name ? ` · ${workday.farm_name}` : ''
              }`,
              activityName: detail.activity_name || activity?.name || 'Recolección',
              lotName: detail.lot_name || 'Lote sin nombre',
              farmName: workday.farm_name || '',
              paymentMode: participation.payment_mode,
              rate: Number(participation.agreed_rate) || 0,
              existingRecords: Array.isArray(detail.harvest_records)
                ? detail.harvest_records.filter(
                    (record) => record.settlement_status !== 'anulado',
                  )
                : [],
            },
          ];
        });
      });
  });
}

// Agrupa los pesajes por trabajador, del más reciente al más antiguo.
export function groupHarvestRecords(records) {
  const grouped = new Map();
  for (const record of records) {
    const key = record.workerId;
    const group = grouped.get(key) || {
      ...record,
      records: [],
    };
    group.records.push(record);
    grouped.set(key, group);
  }
  return [...grouped.values()]
    .map((group) => {
      const sortedRecords = [...group.records].sort(
        (first, second) =>
          second.dateKey.localeCompare(first.dateKey) ||
          second.time.localeCompare(first.time),
      );
      return {
        ...group,
        records: sortedRecords,
        latestRecord: sortedRecords[0],
        totalKilograms: sortedRecords.reduce((total, record) => total + record.quantityKg, 0),
      };
    })
    .sort(
      (first, second) =>
        second.latestRecord.dateKey.localeCompare(first.latestRecord.dateKey) ||
        second.latestRecord.time.localeCompare(first.latestRecord.time) ||
        first.workerName.localeCompare(second.workerName, 'es'),
    );
}
