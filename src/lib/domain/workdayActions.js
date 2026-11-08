// Acciones de jornadas (crear, agregar trabajadores) compartidas por Jornadas e Inicio.
import { api } from '#services/api';
import { toDateKey } from '#lib/dates';
import { getReferenceId } from './entities.js';

// Deshace en orden inverso lo creado (labores, participaciones y la jornada) y relanza
// el error original. Las participaciones reactivadas se vuelven a anular, no se borran.
async function rollbackOrThrow(saveError, { details, participations, workday, message }) {
  const cleanupErrors = [];
  const attempt = async (fn) => {
    try {
      await fn();
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
  };
  for (const detail of [...details].reverse()) {
    await attempt(() => api.workdayDetails.delete(detail.id));
  }
  for (const { participation, wasCanceled } of [...participations].reverse()) {
    await attempt(() =>
      wasCanceled
        ? api.workdayWorkers.cancel(participation.id)
        : api.workdayWorkers.delete(participation.id),
    );
  }
  if (workday) await attempt(() => api.workdays.delete(workday.id));
  if (cleanupErrors.length) {
    console.error('Error al limpiar registros incompletos de la jornada:', cleanupErrors);
    throw new Error(
      `${saveError.message} No se pudieron limpiar todos los registros creados; ${message}`,
    );
  }
  throw saveError;
}

// Crea la jornada con sus trabajadores y labores por lote.
// Si algo falla, elimina lo que alcanzó a crear para no dejar jornadas a medias.
export async function createWorkdayWithWorkers(payload, context) {
  let createdWorkday;
  const createdParticipations = [];
  const createdDetails = [];
  const savedParticipants = [];
  try {
    createdWorkday = await api.workdays.create(payload);
    for (const worker of context.workers) {
      const participation = await api.workdayWorkers.create({
        workday: createdWorkday.id,
        worker: worker.id,
        payment_mode: context.paymentMode,
        agreed_rate: context.agreedRate,
      });
      createdParticipations.push(participation);

      const details = [];
      for (const lot of context.lots) {
        const createdDetail = await api.workdayDetails.create({
          workday_worker: participation.id,
          activity_type: context.activity.id,
          lot: lot.id,
        });
        createdDetails.push(createdDetail);
        details.push({
          ...createdDetail,
          activity_type: context.activity,
          activity_name:
            createdDetail.activity_name || context.activity.name,
          lot_name: createdDetail.lot_name || lot.nombre || lot.name,
          farm_name:
            createdDetail.farm_name ||
            context.farm.nombre ||
            context.farm.name ||
            '',
          harvest_records: createdDetail.harvest_records || [],
        });
      }
      savedParticipants.push({
        ...participation,
        worker,
        worker_name:
          participation.worker_name ||
          [worker.first_name, worker.last_name].filter(Boolean).join(' '),
        details,
      });
    }
  } catch (saveError) {
    await rollbackOrThrow(saveError, {
      details: createdDetails,
      participations: createdParticipations.map((participation) => ({ participation })),
      workday: createdWorkday,
      message: `verifica la jornada ${createdWorkday?.id || ''} antes de volver a intentarlo.`,
    });
  }

  return { createdWorkday, savedParticipants };
}

// Agrega (o reactiva) trabajadores en una jornada abierta con sus labores por lote.
// Si algo falla, deshace lo creado. Devuelve las participaciones guardadas.
export async function addWorkersToWorkday(workday, context) {
  const createdParticipations = [];
  const createdDetails = [];
  const savedParticipants = [];
  try {
    for (const worker of context.workers) {
      const wasCanceled = Boolean(worker.canceledParticipationId);
      const priorParticipant = wasCanceled
        ? workday.allParticipants.find(
            (participant) =>
              String(participant.id) ===
              String(worker.canceledParticipationId),
          )
        : null;
      const existingDetails = priorParticipant?.details || [];
      let participation;

      if (wasCanceled) {
        participation = await api.workdayWorkers.reactivate(
          worker.canceledParticipationId,
        );
        createdParticipations.push({ participation, wasCanceled: true });
        participation = await api.workdayWorkers.update(participation.id, {
          payment_mode: context.paymentMode,
          agreed_rate: context.agreedRate,
        });
      } else {
        participation = await api.workdayWorkers.create({
          workday: workday.id,
          worker: worker.id,
          payment_mode: context.paymentMode,
          agreed_rate: context.agreedRate,
        });
        createdParticipations.push({ participation, wasCanceled: false });
      }

      const details = [...existingDetails];
      for (const lot of context.lots) {
        const alreadyAssigned = existingDetails.some(
          (detail) =>
            String(getReferenceId(detail.activity_type)) === String(context.activity.id) &&
            String(getReferenceId(detail.lot)) === String(lot.id),
        );
        if (alreadyAssigned) continue;

        const createdDetail = await api.workdayDetails.create({
          workday_worker: participation.id,
          activity_type: context.activity.id,
          lot: lot.id,
        });
        createdDetails.push(createdDetail);
        details.push({
          ...createdDetail,
          activity_type: context.activity,
          activity_name:
            createdDetail.activity_name || context.activity.name,
          lot_name: createdDetail.lot_name || lot.nombre || lot.name,
          harvest_records: createdDetail.harvest_records || [],
        });
      }

      savedParticipants.push({
        ...participation,
        worker,
        worker_name:
          participation.worker_name ||
          [worker.first_name, worker.last_name].filter(Boolean).join(' '),
        payment_mode: context.paymentMode,
        agreed_rate: context.agreedRate,
        details,
      });
    }
  } catch (saveError) {
    await rollbackOrThrow(saveError, {
      details: createdDetails,
      participations: createdParticipations,
      message: 'verifica la jornada antes de volver a intentarlo.',
    });
  }

  return savedParticipants;
}

// Resumen mínimo (finca y fecha) para validar jornadas duplicadas en el formulario.
export function toExistingWorkdays(items) {
  return (items || []).map((workday) => ({
    farmId: workday.farm?.id ?? workday.farm,
    dateKey: toDateKey(workday.date || workday.workday_date || workday.fecha),
  }));
}
