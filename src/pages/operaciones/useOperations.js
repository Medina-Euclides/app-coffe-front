import { useEffect, useMemo, useState } from 'react';
import { api } from '#services/api';
import { mapHarvestRecords, mapWorkdayDetails } from './operationsData.js';

export default function useOperations({ isHarvest, userId }) {
  const [harvestRecords, setHarvestRecords] = useState([]);
  const [workdays, setWorkdays] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [lots, setLots] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadState, setLoadState] = useState({ userId: null, loading: true });
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [lotFilter, setLotFilter] = useState('');

  const loading = loadState.userId !== userId || loadState.loading;
  const records = useMemo(
    () => (isHarvest ? harvestRecords : mapWorkdayDetails(workdays)),
    [harvestRecords, isHarvest, workdays],
  );
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const searchableText = isHarvest
        ? `${record.trabajador} ${record.lote} ${record.finca} ${record.kilogramos}`
        : `${record.trabajador} ${record.lote} ${record.finca} ${record.actividad}`;
      const matchesSearch = searchableText.toLocaleLowerCase().includes(query);
      const matchesLot =
        !lotFilter || String(record.loteId) === String(lotFilter);
      return matchesSearch && matchesLot;
    });
  }, [isHarvest, lotFilter, records, search]);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.workdays.list(),
      api.workers.list(),
      api.lots.list(),
      api.activities.list(),
    ])
      .then(([loadedWorkdays, loadedWorkers, loadedLots, loadedActivities]) => {
        if (!active) return;
        setLoadError('');
        setWorkdays(loadedWorkdays);
        setHarvestRecords(mapHarvestRecords(loadedWorkdays));
        setWorkers(loadedWorkers.filter((worker) => worker.is_active));
        setLots(loadedLots.filter((lot) => lot.is_active));
        setActivities(
          isHarvest
            ? loadedActivities.filter((activity) => activity.is_harvest)
            : loadedActivities,
        );
      })
      .catch((error) => {
        if (!active) return;
        console.error('Error al cargar datos de operaciones:', error);
        setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoadState({ userId, loading: false });
      });

    return () => {
      active = false;
    };
  }, [isHarvest, userId]);

  const refreshWorkdays = async () => {
    try {
      const loadedWorkdays = await api.workdays.list();
      setWorkdays(loadedWorkdays);
      setHarvestRecords(mapHarvestRecords(loadedWorkdays));
      setLoadError('');
    } catch (error) {
      console.error('Error al actualizar las jornadas laborales:', error);
      setLoadError(error.message);
    }
  };

  const saveOperation = async (record, { activity, date, lot, row }) => {
    if (record && record.modalidadPago === 'jornal') {
      await api.workdayDetails.update(record.workdayDetailId, {
        activity_type: activity,
        lot,
      });
      return;
    }
    if (record) {
      await api.harvestRecords.update(record.id, {
        quantity_kg: row.amount,
        time: row.time,
      });
      return;
    }

    const existingWorkday = workdays.find(
      (workday) =>
        String(workday.worker) === String(row.worker) && workday.date === date,
    );
    let workday = existingWorkday;
    let createdWorkday = false;
    let detail;

    if (existingWorkday) {
      const expectedPaymentMode = isHarvest ? 'kg' : 'jornal';
      if (existingWorkday.payment_mode !== expectedPaymentMode) {
        throw new Error(
          `Ya existe una jornada para este trabajador y fecha con modalidad ${
            expectedPaymentMode === 'kg' ? 'por jornal' : 'por kilogramo'
          }.`,
        );
      }
      if (Number(existingWorkday.agreed_rate) !== Number(row.agreedRate)) {
        throw new Error(
          'La tarifa debe coincidir con la acordada en la jornada existente.',
        );
      }
    } else {
      workday = await api.workdays.create({
        worker: row.worker,
        date,
        payment_mode: isHarvest ? 'kg' : 'jornal',
        agreed_rate: row.agreedRate,
      });
      createdWorkday = true;
    }

    try {
      detail = await api.workdayDetails.create({
        workday: workday.id,
        activity_type: activity,
        lot,
      });
      if (isHarvest) {
        await api.harvestRecords.create({
          workday_detail: detail.id,
          quantity_kg: row.amount,
          time: row.time,
        });
      }
    } catch (error) {
      const cleanupErrors = [];
      if (detail?.id) {
        try {
          await api.workdayDetails.delete(detail.id);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError.message);
        }
      }
      if (createdWorkday && workday?.id) {
        try {
          await api.workdays.delete(workday.id);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError.message);
        }
      }
      if (cleanupErrors.length) {
        throw new Error(
          `${error.message} No se pudieron limpiar todos los datos parciales: ${cleanupErrors.join(' ')}`,
          { cause: error },
        );
      }
      throw error;
    }
  };

  const defaultAgreedRate =
    localStorage.getItem(
      `cafesmart_tarifa_${isHarvest ? 'kg' : 'jornal'}_${userId}`,
    ) || (isHarvest ? '1000' : '50000');

  return {
    activities,
    defaultAgreedRate,
    filteredRecords,
    loadError,
    loading,
    lots,
    lotFilter,
    records,
    refreshWorkdays,
    saveOperation,
    search,
    setLotFilter,
    setSearch,
    workers,
  };
}
