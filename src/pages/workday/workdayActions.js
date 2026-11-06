// Acciones de jornadas compartidas entre la página de jornadas e Inicio.
import { api } from '#services/api';

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
    const cleanupErrors = [];
    for (const detail of createdDetails.reverse()) {
      try {
        await api.workdayDetails.delete(detail.id);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    for (const participation of createdParticipations.reverse()) {
      try {
        await api.workdayWorkers.delete(participation.id);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    try {
      if (createdWorkday) await api.workdays.delete(createdWorkday.id);
    } catch (cleanupError) {
      cleanupErrors.push(cleanupError);
    }
    if (cleanupErrors.length) {
      console.error('Error al limpiar una jornada incompleta:', cleanupErrors);
      throw new Error(
        `${saveError.message} No se pudieron limpiar todos los registros creados; verifica la jornada ${createdWorkday?.id || ''} antes de volver a intentarlo.`,
      );
    }
    throw saveError;
  }

  return { createdWorkday, savedParticipants };
}

function toDateKey(value) {
  if (!value) return '';
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Resumen mínimo (finca y fecha) para validar jornadas duplicadas en el formulario.
export function toExistingWorkdays(items) {
  return (items || []).map((workday) => ({
    farmId: workday.farm?.id ?? workday.farm,
    dateKey: toDateKey(workday.date || workday.workday_date || workday.fecha),
  }));
}
