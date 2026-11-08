// Página de jornadas laborales: lista, crea, edita y cierra jornadas de trabajadores.
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Search,
} from 'lucide-react';
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
import HarvestWorkerCard from './components/HarvestWorkerCard.jsx';
import { createWorkdayWithWorkers } from './workdayActions.js';
import {
  getDateKey,
  getHarvestRecords,
  getWeekRange,
  groupWorkdayParticipants,
  mapParticipant,
  mapWorkday,
} from './utils/workdayMappers.js';
import { DATA_EVENT } from '#services/syncService';
import { notifyDataChanged } from '#hooks/usePendingWorkdays';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const kilogramsFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 3,
});

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

function belongsToPeriod(dateKey, period, todayKey) {
  if (period === 'all') return true;
  if (!dateKey) return false;
  if (period === 'today') return dateKey === todayKey;
  if (period === 'week') {
    const week = getWeekRange(todayKey);
    return dateKey >= week.start && dateKey <= week.end;
  }
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
  // Inicio puede abrir esta página en una pestaña y periodo concretos.
  const { state: navState } = useLocation();
  const [period, setPeriod] = useState(navState?.period || 'today');
  const [modality, setModality] = useState(navState?.modality || 'all');
  const [section, setSection] = useState(navState?.section || 'workdays');
  const [action, setAction] = useState('');
  const [workdayForAddingWorkers, setWorkdayForAddingWorkers] = useState(null);
  const [workdayForEditing, setWorkdayForEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  useEffect(() => {
    let active = true;
    const load = () =>
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

    load();
    // Recarga si los datos cambian fuera de esta página (p. ej. al cerrar una
    // jornada desde la campanita o al sincronizar).
    window.addEventListener(DATA_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(DATA_EVENT, load);
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

  // Un jornal = una persona pagada por jornal un día; una jornada puede tener varios.
  const jornalCount = filteredWorkdays.reduce(
    (total, workday) =>
      total + workday.participants.filter((entry) => !entry.isPerKilogram).length,
    0,
  );
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
    week: 'esta semana',
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
      // La campanita de notificaciones baja su contador.
      notifyDataChanged();
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
        secondaryCount={
          section === 'harvest'
            ? ''
            : `${jornalCount} ${jornalCount === 1 ? 'jornal' : 'jornales'}`
        }
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
            <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {groupHarvestRecords(filteredHarvestRecords).map((worker) => (
                <HarvestWorkerCard
                  key={worker.workerId}
                  periodLabel={periodLabel}
                  worker={worker}
                />
              ))}
            </div>
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
