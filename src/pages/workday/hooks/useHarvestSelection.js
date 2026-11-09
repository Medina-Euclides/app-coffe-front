// Selección encadenada del formulario de pesaje: jornada → trabajador → lote.
// Al cambiar la jornada o el trabajador se limpian las elecciones que dependen de ella.
import { useMemo, useState } from 'react';
import { getHarvestDetails } from '#lib/domain/workdays';

const byName = (first, second) =>
  (first.nombre || first.name || '').localeCompare(second.nombre || second.name || '', 'es');

// Primer elemento por cada clave, en el orden en que aparecen.
function uniqueBy(items, key) {
  const unique = new Map();
  for (const item of items) if (!unique.has(item[key])) unique.set(item[key], item);
  return [...unique.values()];
}

export function useHarvestSelection({ workdays, activities, lots, today, feedback }) {
  const [workdayId, setWorkdayId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [lotId, setLotId] = useState('');

  const harvestDetails = useMemo(
    () => getHarvestDetails(workdays, activities, today),
    [activities, today, workdays],
  );
  const harvestWorkdays = useMemo(
    () =>
      uniqueBy(harvestDetails, 'workdayId').sort((first, second) =>
        second.dateKey.localeCompare(first.dateKey),
      ),
    [harvestDetails],
  );
  const workers = useMemo(
    () =>
      uniqueBy(
        harvestDetails.filter((detail) => detail.workdayId === workdayId),
        'workerId',
      ).sort((first, second) => first.workerName.localeCompare(second.workerName, 'es')),
    [harvestDetails, workdayId],
  );

  const selectedWorkday = harvestWorkdays.find((workday) => workday.workdayId === workdayId);
  const selectedWorker = workers.find((worker) => worker.workerId === workerId);
  const availableLots = lots
    .filter(
      (lot) =>
        lot.is_active !== false && String(lot.fincaId ?? lot.id_farm) === selectedWorkday?.farmId,
    )
    .sort(byName);
  const selectedLot = availableLots.find((lot) => String(lot.id) === lotId);
  const selectedDetail = harvestDetails.find(
    (detail) =>
      detail.workdayId === workdayId && detail.workerId === workerId && detail.lotId === lotId,
  );

  const changeWorkday = (nextWorkdayId) => {
    setWorkdayId(nextWorkdayId);
    setWorkerId('');
    setLotId('');
    ['harvest-workday', 'harvest-worker', 'harvest-lot'].forEach(feedback.clearField);
    feedback.clearFormError();
  };

  const changeWorker = (nextWorkerId) => {
    setWorkerId(nextWorkerId);
    setLotId('');
    feedback.clearField('harvest-worker');
    feedback.clearField('harvest-lot');
    feedback.clearFormError();
  };

  return {
    harvestDetails,
    harvestWorkdays,
    workers,
    availableLots,
    workdayId,
    workerId,
    lotId,
    setLotId,
    changeWorkday,
    changeWorker,
    selectedWorkday,
    selectedWorker,
    selectedLot,
    selectedDetail,
  };
}
