// Registro de pesajes de recolección. Si el trabajador aún no tiene labor en el lote
// elegido, primero se crea esa labor (detalle) y luego el pesaje sobre ella.
import { api } from '#services/api';

const lotName = (lot) => lot.nombre || lot.name || 'Lote';

// Devuelve el pesaje creado, la labor sobre la que quedó y, si hubo que crearla,
// la labor nueva tal como la guarda la API (`createdDetail`).
export async function createHarvestRecord({ detail, worker, lot, kilograms, time }) {
  let detailForRecord = detail;
  let createdDetail = null;

  if (!detailForRecord) {
    const created = await api.workdayDetails.create({
      workday_worker: worker.participantId,
      activity_type: worker.activityTypeId,
      lot: lot.id,
    });
    createdDetail = {
      ...created,
      activity_type: created.activity_type ?? worker.activityTypeId,
      activity_name: created.activity_name || worker.activityName,
      activity_is_harvest: true,
      lot: lot.id,
      lot_name: lotName(lot),
      harvest_records: [],
    };
    detailForRecord = {
      ...worker,
      ...createdDetail,
      id: String(createdDetail.id),
      lotId: String(lot.id),
      lotName: lotName(lot),
      activityName: createdDetail.activity_name,
      activityTypeId: String(createdDetail.activity_type),
      existingRecords: [],
    };
  }

  const record = await api.harvestRecords.create({
    workday_detail: detailForRecord.id,
    quantity_kg: kilograms.toFixed(3),
    time: `${time}:00`,
  });
  return { record, detail: detailForRecord, createdDetail };
}

// Agrega una labor recién creada a la participación correspondiente (jornadas de la API).
export function addDetailToWorkdays(workdays, { workdayId, participantId }, newDetail) {
  return workdays.map((workday) =>
    String(workday.id) !== workdayId
      ? workday
      : {
          ...workday,
          participants: workday.participants.map((participation) =>
            String(participation.id) !== participantId
              ? participation
              : { ...participation, details: [...(participation.details || []), newDetail] },
          ),
        },
  );
}
