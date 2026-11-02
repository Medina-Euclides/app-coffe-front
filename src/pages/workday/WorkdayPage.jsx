import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Search } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import WorkdayCard from './components/WorkdayCard.jsx';
import WorkdayFilters from './components/WorkdayFilters.jsx';
import WorkdayFormDialog from './components/WorkdayFormDialog.jsx';
import AddWorkdayWorkersDialog from './components/AddWorkdayWorkersDialog.jsx';
import EditWorkdayLaborDialog from './components/EditWorkdayLaborDialog.jsx';
import HarvestRecordFormDialog from './components/HarvestRecordFormDialog.jsx';
import WorkdayHeader from './components/WorkdayHeader.jsx';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
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
    <Card className="flex flex-col items-center gap-3 rounded-2xl border-[#e7ebe4] bg-white px-6 py-12 text-center shadow-none">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4eb] text-[#315d3b]">
        <ClipboardList aria-hidden="true" className="size-6" />
      </span>
      <div>
        <h2 className="font-semibold text-[#263b2c]">
          {hasError
            ? 'No se pudieron cargar las jornadas'
            : hasWorkdays
              ? 'No hay resultados para estos filtros'
              : 'Aún no hay jornadas laborales'}
        </h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-[#748074]">
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
  const periodLabel = {
    today: 'hoy',
    month: 'este mes',
    year: 'este año',
    all: 'en total',
  }[period];

  const saveWorkday = async (payload, context) => {
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
        if (String(workday.workdayId) !== detail.workdayId) return workday;

        const details = workday.details.map((item) =>
          String(item.id) === detail.id
            ? {
                ...item,
                harvest_records: [...(item.harvest_records || []), record],
              }
            : item,
        );

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
        calculatedTotal={currencyFormatter.format(calculatedTotal)}
        onAddHarvest={() => setAction('pesaje')}
        onAddWorkday={() => setAction('jornada')}
        visibleCount={filteredWorkdays.length}
        periodLabel={periodLabel}
      />

      {notice && (
        <p
          aria-live="polite"
          className="rounded-xl border border-[#dce8d9] bg-[#f0f5ed] px-4 py-3 text-sm text-[#315d3b]"
          role="status"
        >
          {notice}
        </p>
      )}
      {actionError && (
        <p
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
        <TabsList className="grid h-auto w-full max-w-[535px] grid-cols-2 rounded-2xl bg-[#e9ede7] p-1">
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-[#69776d] data-active:bg-[#173d30] data-active:text-white data-active:shadow-none"
            value="workdays"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
            Jornadas laborales
          </TabsTrigger>
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-[#69776d] data-active:bg-[#173d30] data-active:text-white data-active:shadow-none"
            value="harvest"
          >
            <ClipboardList aria-hidden="true" className="size-4" />
            Recolección
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="workdays">
          <WorkdayFilters
            modality={modality}
            onModalityChange={setModality}
            onPeriodChange={setPeriod}
            onSearchChange={setSearch}
            period={period}
            search={search}
          />

          {loading ? (
            <p
              aria-live="polite"
              className="rounded-2xl border border-[#e7ebe4] bg-white px-5 py-10 text-center text-sm text-[#748074]"
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

        <TabsContent value="harvest">
          <Card className="flex flex-col items-center gap-3 rounded-2xl border-[#e7ebe4] bg-white px-6 py-12 text-center shadow-none">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4eb] text-[#315d3b]">
              <Search aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h2 className="font-semibold text-[#263b2c]">
                Recolección
              </h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-[#748074]">
                Esta vista se desarrollará en el siguiente paso. Por ahora,
                puedes consultar aquí las jornadas y sus pesajes asociados.
              </p>
            </div>
            <Button
              className="mt-1 rounded-xl bg-[#173d30] px-4 text-white hover:bg-[#214b32]"
              onClick={() => setSection('workdays')}
              type="button"
            >
              Volver a jornadas laborales
            </Button>
          </Card>
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
