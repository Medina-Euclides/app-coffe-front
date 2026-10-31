export function mapHarvestRecords(workdays) {
  return workdays.flatMap((workday) =>
    (workday.details || []).flatMap((detail) =>
      (detail.harvest_records || []).map((harvest) => ({
        id: harvest.id,
        workdayId: workday.id,
        workdayDetailId: detail.id,
        trabajadorId: workday.worker,
        trabajador: workday.worker_name,
        fecha: workday.date,
        modalidadPago: workday.payment_mode,
        tarifaAcordada: workday.agreed_rate,
        activityTypeId: detail.activity_type,
        actividad: detail.activity_name,
        loteId: detail.lot,
        lote: detail.lot_name,
        finca: detail.farm_name,
        kilogramos: String(harvest.quantity_kg),
        hora: harvest.time,
      })),
    ),
  );
}

export function mapWorkdayDetails(workdays) {
  return workdays
    .filter((workday) => workday.payment_mode === 'jornal')
    .flatMap((workday) =>
      (workday.details || []).map((detail) => ({
        id: detail.id,
        workdayId: workday.id,
        workdayDetailId: detail.id,
        trabajadorId: workday.worker,
        trabajador: workday.worker_name,
        fecha: workday.date,
        modalidadPago: workday.payment_mode,
        tarifaAcordada: workday.agreed_rate,
        estadoLiquidacion: workday.settlement_status,
        activityTypeId: detail.activity_type,
        actividad: detail.activity_name,
        loteId: detail.lot,
        lote: detail.lot_name,
        finca: detail.farm_name,
      })),
    );
}

export function formatOperationDate(date) {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export function currentOperationTime() {
  return new Date().toTimeString().slice(0, 5);
}
