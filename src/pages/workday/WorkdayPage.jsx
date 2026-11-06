// Página de jornadas laborales: lista, crea, edita y cierra jornadas de trabajadores.
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  MapPin,
  Search,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import NoticeBanner from '#components/shared/NoticeBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import WorkdayCard from './components/WorkdayCard.jsx';
import WorkdayFilters from './components/WorkdayFilters.jsx';
import WorkdayFormDialog from './components/WorkdayFormDialog.jsx';
import AddWorkdayWorkersDialog from './components/AddWorkdayWorkersDialog.jsx';
import EditWorkdayLaborDialog from './components/EditWorkdayLaborDialog.jsx';
import HarvestRecordFormDialog from './components/HarvestRecordFormDialog.jsx';
import WorkdayHeader from './components/WorkdayHeader.jsx';
import { createWorkdayWithWorkers } from './workdayActions.js';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const kilogramsFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 3,
});

function asAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function getWorkerName(worker) {
  if (typeof worker === 'string') return worker;
  if (!worker || typeof worker !== 'object') return '';
  return (
    worker.nombre ||
    worker.name ||
    worker.full_name ||
    [worker.first_name, worker.last_name].filter(Boolean).join(' ')
  );
}

function getDateKey(value) {
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

function mapParticipant(workday, participant) {
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
  const isPerKilogram = /kg|kilo|kilogram/.test(paymentMode);
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
    dateKey: getDateKey(date),
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

function mapWorkday(workday) {
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

function groupWorkdayParticipants(participants) {
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

function getHarvestRecords(participants) {
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

function groupHarvestRecords(records) {
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
        totalKilograms: sortedRecords.reduce(
          (total, record) => total + record.quantityKg,
          0,
        ),
      };
    })
    .sort(
      (first, second) =>
        second.latestRecord.dateKey.localeCompare(first.latestRecord.dateKey) ||
        second.latestRecord.time.localeCompare(first.latestRecord.time) ||
        first.workerName.localeCompare(second.workerName, 'es'),
    );
}

function formatHarvestDate(dateKey) {
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

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toLocaleUpperCase('es');
}

function HarvestRecordCard({ worker, periodLabel }) {
  const [expanded, setExpanded] = useState(false);
  const timeLabel = worker.latestRecord.time.slice(0, 5);
  return (
    <Card className="gap-0 rounded-2xl border border-border bg-card py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <span className="rounded-lg border border-leaf/30 bg-leaf-soft px-3 py-1.5 text-xs font-semibold text-leaf">
          {worker.records.length}{' '}
          {worker.records.length === 1 ? 'pesaje' : 'pesajes'} {periodLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock3 aria-hidden="true" className="size-3.5" />
          Último: {timeLabel || 'Hora sin registrar'}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
        >
          {getInitials(worker.workerName)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-foreground">
            {worker.workerName}
          </h2>
          {worker.identification && (
            <p className="mt-1 text-sm text-muted-foreground">
              C.C. {worker.identification}
            </p>
          )}
        </div>
        <div className="ml-auto text-right">
          <p className="cifra text-4xl text-foreground sm:text-5xl">
            {kilogramsFormatter.format(worker.totalKilograms)}
            <span className="ml-1 text-sm font-semibold">kg</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total recolectado {periodLabel}</p>
        </div>
        <Button
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Ocultar' : 'Ver'} pesajes de ${worker.workerName}`}
          className="h-10 shrink-0 rounded-xl bg-muted px-3 text-sm font-medium text-ink-soft hover:bg-muted"
          onClick={() => setExpanded((current) => !current)}
          type="button"
          variant="ghost"
        >
          {expanded ? 'Ocultar pesajes' : 'Ver pesajes'}
          {expanded ? (
            <ChevronUp aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>
      {expanded && (
        <div className="border-t border-border/60 bg-muted px-4 py-3 sm:px-5">
          <ul className="divide-y divide-border/60">
            {worker.records.map((record) => (
              <li
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 text-sm"
                key={record.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-soft">
                    {record.lotName}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatHarvestDate(record.dateKey)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{record.time.slice(0, 5) || 'Hora sin registrar'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden="true" className="size-3" />
                      {record.farmName || 'Finca sin nombre'}
                    </span>
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-primary">
                  {kilogramsFormatter.format(record.quantityKg)} kg
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function belongsToPeriod(dateKey, period, todayKey) {
  if (period === 'all') return true;
  if (!dateKey) return false;
  if (period === 'today') return dateKey === todayKey;
  if (period === 'month') return dateKey.slice(0, 7) === todayKey.slice(0, 7);
  return dateKey.slice(0, 4) === todayKey.slice(0, 4);
}

function WorkdayEmptyState({ hasWorkdays, errorMessage }) {
  const hasError = Boolean(errorMessage);
  return (
    <Card className="flex flex-col items-center gap-3 rounded-2xl border-border bg-card px-6 py-12 text-center shadow-none">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-tint text-primary">
        <ClipboardList aria-hidden="true" className="size-6" />
      </span>
      <div>
        <h2 className="font-semibold text-foreground">
          {hasError
            ? 'No se pudieron cargar las jornadas'
            : hasWorkdays
              ? 'No hay resultados para estos filtros'
              : 'Aún no hay jornadas laborales'}
        </h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {hasError
            ? errorMessage
            : hasWorkdays
              ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
              : 'Cuando registres una jornada, aquí podrás consultar su actividad, tarifa y valor estimado.'}
        </p>
      </div>
    </Card>
  );
}

export default function WorkdayPage() {
  const [workdays, setWorkdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('today');
  const [modality, setModality] = useState('all');
  const [section, setSection] = useState('workdays');
  const [action, setAction] = useState('');
  const [workdayForAddingWorkers, setWorkdayForAddingWorkers] = useState(null);
  const [workdayForEditing, setWorkdayForEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  useEffect(() => {
    let active = true;
    api.workdays
      .list()
      .then((items) => {
        if (active) setWorkdays(items.flatMap(mapWorkday));
      })
      .catch((error) => {
        if (!active) return;
        console.error('Error al cargar jornadas laborales:', error);
        setLoadError(error.message || 'No se pudieron cargar las jornadas.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const [todayKey] = useState(() => getDateKey(new Date()));
  const filteredWorkdays = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matchingParticipants = workdays
      .filter((workday) => belongsToPeriod(workday.dateKey, period, todayKey));
    return groupWorkdayParticipants(matchingParticipants)
      .filter((workday) => {
        if (modality === 'jornal') {
          return workday.allParticipants.some(
            (participant) => !participant.isPerKilogram,
          );
        }
        if (modality === 'kilogram') {
          return workday.allParticipants.some(
            (participant) => participant.isPerKilogram,
          );
        }
        return true;
      })
      .filter((workday) => {
        if (!query) return true;
        const searchableValues = [
          workday.activityName,
          workday.lot,
          ...workday.allParticipants.flatMap((participant) => [
            participant.workerName,
            participant.identification,
          ]),
        ];
        return searchableValues
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);
      })
      .sort((first, second) => second.dateKey.localeCompare(first.dateKey));
  }, [modality, period, search, todayKey, workdays]);

  const calculatedTotal = filteredWorkdays.reduce(
    (total, workday) => total + workday.totalAmount,
    0,
  );
  const harvestRecords = useMemo(() => getHarvestRecords(workdays), [workdays]);
  const query = search.trim().toLocaleLowerCase();
  const filteredHarvestRecords = harvestRecords
    .filter((record) =>
      belongsToPeriod(record.dateKey, period, todayKey),
    )
    .filter((record) => {
      if (modality === 'jornal') return !/kg|kilo|kilogram/.test(record.paymentMode);
      if (modality === 'kilogram') return /kg|kilo|kilogram/.test(record.paymentMode);
      return true;
    })
    .filter((record) => {
      if (!query) return true;
      return [
        record.workerName,
        record.identification,
        record.lotName,
        record.farmName,
        record.activityName,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query);
    })
    .sort(
      (first, second) =>
        second.dateKey.localeCompare(first.dateKey) ||
        second.time.localeCompare(first.time),
    );
  const totalHarvestKilograms = filteredHarvestRecords.reduce(
    (total, record) => total + record.quantityKg,
    0,
  );
  const periodLabel = {
    today: 'hoy',
    month: 'este mes',
    year: 'este año',
    all: 'en total',
  }[period];

  const saveWorkday = async (payload, context) => {
    const { createdWorkday, savedParticipants } =
      await createWorkdayWithWorkers(payload, context);

    setWorkdays((currentWorkdays) => [
      ...mapWorkday({
        ...createdWorkday,
        participants: savedParticipants,
        farm_name: context.farm.nombre || context.farm.name,
      }),
      ...currentWorkdays,
    ]);
    setPeriod('all');
    setModality('all');
    setSearch('');
    setNotice('La jornada laboral se registró correctamente.');
  };

  const closeWorkday = async (workday) => {
    if (
      !window.confirm(
        '¿Quieres cerrar esta jornada? Después de cerrarla no se podrán agregar ni modificar registros.',
      )
    ) {
      return;
    }

    setBusyAction(`close:${workday.id}`);
    setActionError('');
    setNotice('');
    try {
      await api.workdays.close(workday.id);
      setWorkdays((current) =>
        current.map((participant) =>
          String(participant.workdayId) === String(workday.id)
            ? { ...participant, workdayStatus: 'cerrada' }
            : participant,
        ),
      );
      setNotice('La jornada se cerró correctamente.');
    } catch (error) {
      console.error('Error al cerrar la jornada:', error);
      setActionError(error.message || 'No se pudo cerrar la jornada.');
    } finally {
      setBusyAction('');
    }
  };

  const addWorkersToWorkday = async (workday, context) => {
    if (workday.status !== 'abierta') {
      throw new Error('No se pueden agregar trabajadores a una jornada cerrada.');
    }

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
              String(
                typeof detail.activity_type === 'object'
                  ? detail.activity_type.id
                  : detail.activity_type,
              ) === String(context.activity.id) &&
              String(
                typeof detail.lot === 'object'
                  ? detail.lot.id
                  : detail.lot,
              ) === String(lot.id),
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
      const cleanupErrors = [];
      for (const detail of createdDetails.reverse()) {
        try {
          await api.workdayDetails.delete(detail.id);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      for (const { participation, wasCanceled } of createdParticipations.reverse()) {
        try {
          if (wasCanceled) {
            await api.workdayWorkers.cancel(participation.id);
          } else {
            await api.workdayWorkers.delete(participation.id);
          }
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      if (cleanupErrors.length) {
        console.error(
          'Error al limpiar participaciones incompletas:',
          cleanupErrors,
        );
        throw new Error(
          `${saveError.message} No se pudieron limpiar todos los registros creados; verifica la jornada antes de volver a intentarlo.`,
        );
      }
      throw saveError;
    }

    const mappedParticipants = mapWorkday({
      id: workday.id,
      farm: workday.farmId,
      farm_name: workday.farmName,
      date: workday.date,
      status: workday.status,
      participants: savedParticipants,
    });
    const mappedIds = new Set(
      mappedParticipants.map((participant) => String(participant.id)),
    );
    setWorkdays((current) => [
      ...mappedParticipants,
      ...current.filter(
        (participant) => !mappedIds.has(String(participant.id)),
      ),
    ]);
    setNotice(
      `${savedParticipants.length} ${savedParticipants.length === 1 ? 'trabajador agregado' : 'trabajadores agregados'} a la jornada.`,
    );
    setActionError('');
  };

  const updateWorkdayLabor = async (workday, data) => {
    if (workday.status !== 'abierta') {
      throw new Error('No se puede modificar una jornada cerrada.');
    }

    try {
      const updatedWorkday = await api.workdays.updateLabor(workday.id, data);
      const updatedParticipants = mapWorkday(updatedWorkday);
      setWorkdays((current) => [
        ...updatedParticipants,
        ...current.filter(
          (participant) =>
            String(participant.workdayId) !== String(workday.id),
        ),
      ]);
      setNotice('La jornada y los datos de sus trabajadores se actualizaron.');
      setActionError('');
    } catch (error) {
      console.error('Error al actualizar jornada completa:', error);
      throw error;
    }
  };

  const cancelParticipation = async (participant) => {
    if (
      !window.confirm(
        `¿Quieres retirar a ${participant.workerName || 'este trabajador'} de la jornada?`,
      )
    ) {
      return;
    }

    setBusyAction(`cancel:${participant.id}`);
    setActionError('');
    setNotice('');
    try {
      await api.workdayWorkers.cancel(participant.id);
      setWorkdays((current) =>
        current.map((item) =>
          String(item.id) === String(participant.id)
            ? { ...item, settlementStatus: 'anulado' }
            : item,
        ),
      );
      setNotice(
        `${participant.workerName || 'El trabajador'} fue retirado de la jornada.`,
      );
    } catch (error) {
      console.error('Error al retirar al trabajador de la jornada:', error);
      setActionError(
        error.message || 'No se pudo retirar al trabajador de la jornada.',
      );
    } finally {
      setBusyAction('');
    }
  };

  const saveHarvestRecord = (record, detail) => {
    setWorkdays((currentWorkdays) =>
      currentWorkdays.map((workday) => {
        if (
          String(workday.workdayId) !== detail.workdayId ||
          String(workday.workerId) !== detail.workerId
        ) {
          return workday;
        }

        const hasDetail = workday.details.some(
          (item) => String(item.id) === detail.id,
        );
        const details = hasDetail
          ? workday.details.map((item) =>
              String(item.id) === detail.id
                ? {
                    ...item,
                    harvest_records: [...(item.harvest_records || []), record],
                  }
                : item,
            )
          : [...workday.details, { ...detail, harvest_records: [record] }];

        return mapParticipant(
          {
            id: workday.workdayId,
            farm: workday.farmId,
            farm_name: workday.farmName,
            date: workday.date,
          },
          {
            id: workday.id,
            worker: workday.workerId,
            worker_name: workday.workerName,
            payment_mode: workday.isPerKilogram ? 'kg' : 'jornal',
            agreed_rate: workday.rate,
            details,
          },
        );
      }),
    );
    setPeriod('all');
    setModality('all');
    setSearch('');
    setNotice('El pesaje de recolección se registró correctamente.');
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <WorkdayHeader
        title={section === 'harvest' ? 'Recolección de café' : 'Jornadas Laborales'}
        visibleCount={
          section === 'harvest'
            ? filteredHarvestRecords.length
            : filteredWorkdays.length
        }
        itemLabel={section === 'harvest' ? 'pesaje' : 'jornada'}
        countVerb={section === 'harvest' ? 'visualizados' : 'visualizadas'}
        calculatedTotal={
          section === 'harvest'
            ? kilogramsFormatter.format(totalHarvestKilograms)
            : currencyFormatter.format(calculatedTotal)
        }
        totalLabel={section === 'harvest' ? 'kg recolectados' : 'calculado'}
        onAddHarvest={() => setAction('pesaje')}
        onAddWorkday={() => setAction('jornada')}
        periodLabel={periodLabel}
      />

      <NoticeBanner message={notice} />
      {actionError && (
        <p
          aria-live="assertive"
          className="rounded-xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {actionError}
        </p>
      )}

      <Tabs
        className="w-full gap-4"
        onValueChange={setSection}
        value={section}
      >
        <TabsList className="grid h-auto w-full max-w-[535px] grid-cols-2 rounded-2xl bg-muted p-1">
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-muted-foreground data-active:bg-primary-hover data-active:text-primary-foreground data-active:shadow-none"
            value="workdays"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
            Jornadas laborales
          </TabsTrigger>
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-muted-foreground data-active:bg-primary-hover data-active:text-primary-foreground data-active:shadow-none"
            value="harvest"
          >
            <ClipboardList aria-hidden="true" className="size-4" />
            Recolección
          </TabsTrigger>
        </TabsList>

        <WorkdayFilters
          modality={modality}
          onModalityChange={setModality}
          onPeriodChange={setPeriod}
          onSearchChange={setSearch}
          period={period}
          search={search}
          searchPlaceholder={
            section === 'harvest'
              ? 'Buscar por trabajador, lote o finca…'
              : 'Buscar por trabajador o CC…'
          }
        />

        <TabsContent className="space-y-4" value="workdays">
          {loading ? (
            <p
              aria-live="polite"
              className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground"
              role="status"
            >
              Cargando jornadas laborales…
            </p>
          ) : filteredWorkdays.length ? (
            <div className="space-y-3">
              {filteredWorkdays.map((workday) => (
                <WorkdayCard
                  busyAction={busyAction}
                  key={workday.id}
                  onAddWorkers={() => setWorkdayForAddingWorkers(workday)}
                  onCancelParticipation={cancelParticipation}
                  onClose={closeWorkday}
                  onEdit={() => setWorkdayForEditing(workday)}
                  workday={workday}
                />
              ))}
            </div>
          ) : (
            <WorkdayEmptyState
              errorMessage={loadError}
              hasWorkdays={workdays.length > 0}
            />
          )}
        </TabsContent>

        <TabsContent className="space-y-3" value="harvest">
          {loading ? (
            <p
              aria-live="polite"
              className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground"
              role="status"
            >
              Cargando registros de recolección…
            </p>
          ) : filteredHarvestRecords.length ? (
            groupHarvestRecords(filteredHarvestRecords).map((worker) => (
              <HarvestRecordCard
                key={worker.workerId}
                periodLabel={periodLabel}
                worker={worker}
              />
            ))
          ) : (
            <Card className="flex flex-col items-center gap-3 rounded-2xl border-border bg-card px-6 py-12 text-center shadow-none">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-tint text-primary">
                <Search aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">
                  {loadError
                    ? 'No se pudieron cargar los pesajes'
                    : harvestRecords.length
                    ? 'No hay pesajes para estos filtros'
                    : 'Aún no hay registros de recolección'}
                </h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  {loadError
                    ? loadError
                    : harvestRecords.length
                    ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
                    : 'Los pesajes registrados aparecerán aquí con su trabajador, lote, fecha y hora.'}
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {action === 'jornada' && (
        <WorkdayFormDialog
          existingWorkdays={workdays}
          onOpenChange={(open) => !open && setAction('')}
          onSave={saveWorkday}
          open
        />
      )}

      {workdayForAddingWorkers && (
        <AddWorkdayWorkersDialog
          onOpenChange={(open) =>
            !open && setWorkdayForAddingWorkers(null)
          }
          onSave={(context) =>
            addWorkersToWorkday(workdayForAddingWorkers, context)
          }
          open
          workday={workdayForAddingWorkers}
        />
      )}

      {workdayForEditing && (
        <EditWorkdayLaborDialog
          onOpenChange={(open) => !open && setWorkdayForEditing(null)}
          onSave={(data) => updateWorkdayLabor(workdayForEditing, data)}
          open
          workday={workdayForEditing}
        />
      )}

      {action === 'pesaje' && (
        <HarvestRecordFormDialog
          onOpenChange={(open) => !open && setAction('')}
          onSave={saveHarvestRecord}
          open
        />
      )}
    </section>
  );
}
