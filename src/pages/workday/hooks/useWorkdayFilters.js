// Filtros de la página de jornadas (periodo, modalidad y búsqueda) y los totales
// que se muestran en el encabezado.
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { belongsToPeriod, PERIOD_LABELS } from '#lib/dates';
import { isPerKilogram } from '#lib/constants';
import { hoy } from '#lib/formatters';
import { getHarvestRecords, groupWorkdayParticipants } from '#lib/domain/workdays';
import { matchesSearch, sumBy } from '#lib/utils';

const getWorkdaySearchText = (workday) =>
  [
    workday.activityName,
    workday.lot,
    ...workday.allParticipants.flatMap((participant) => [
      participant.workerName,
      participant.identification,
    ]),
  ].join(' ');

const getHarvestSearchText = (record) =>
  [record.workerName, record.identification, record.lotName, record.farmName, record.activityName].join(' ');

const byNewest = (first, second) =>
  second.dateKey.localeCompare(first.dateKey) || (second.time || '').localeCompare(first.time || '');

export function useWorkdayFilters(workdays) {
  // Inicio puede abrir esta página en una pestaña y periodo concretos.
  const { state: navState } = useLocation();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState(navState?.period || 'today');
  const [modality, setModality] = useState(navState?.modality || 'all');
  const [section, setSection] = useState(navState?.section || 'workdays');
  const [todayKey] = useState(hoy);

  const filteredWorkdays = useMemo(() => {
    const inPeriod = workdays.filter((workday) => belongsToPeriod(workday.dateKey, period, todayKey));
    return groupWorkdayParticipants(inPeriod)
      .filter((workday) => {
        if (modality === 'jornal') return workday.allParticipants.some((entry) => !entry.isPerKilogram);
        if (modality === 'kilogram') return workday.allParticipants.some((entry) => entry.isPerKilogram);
        return true;
      })
      .filter((workday) => matchesSearch(getWorkdaySearchText(workday), search))
      .sort(byNewest);
  }, [modality, period, search, todayKey, workdays]);

  const harvestRecords = useMemo(() => getHarvestRecords(workdays), [workdays]);
  const filteredHarvestRecords = useMemo(
    () =>
      harvestRecords
        .filter((record) => belongsToPeriod(record.dateKey, period, todayKey))
        .filter((record) => {
          if (modality === 'jornal') return !isPerKilogram(record.paymentMode);
          if (modality === 'kilogram') return isPerKilogram(record.paymentMode);
          return true;
        })
        .filter((record) => matchesSearch(getHarvestSearchText(record), search))
        .sort(byNewest),
    [harvestRecords, modality, period, search, todayKey],
  );

  // Muestra todo, para que lo recién registrado se vea aunque esté fuera del filtro.
  const resetFilters = () => {
    setPeriod('all');
    setModality('all');
    setSearch('');
  };

  return {
    search,
    setSearch,
    period,
    setPeriod,
    modality,
    setModality,
    section,
    setSection,
    resetFilters,
    periodLabel: PERIOD_LABELS[period],
    filteredWorkdays,
    harvestRecords,
    filteredHarvestRecords,
    // Un jornal = una persona pagada por jornal un día; una jornada puede tener varios.
    jornalCount: sumBy(
      filteredWorkdays,
      (workday) => workday.participants.filter((entry) => !entry.isPerKilogram).length,
    ),
    calculatedTotal: sumBy(filteredWorkdays, (workday) => workday.totalAmount),
    totalHarvestKilograms: sumBy(filteredHarvestRecords, (record) => record.quantityKg),
  };
}
