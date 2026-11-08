// Página de jornadas laborales: lista, crea, edita y cierra jornadas de trabajadores.
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Search,
} from 'lucide-react';
import EmptyState from '#components/shared/EmptyState';
import LoadingState from '#components/shared/LoadingState';
import NoticeBanner from '#components/shared/NoticeBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import WorkdayCard from './components/WorkdayCard.jsx';
import ListFilters from '#components/shared/ListFilters';
import WorkdayFormDialog from './components/WorkdayFormDialog.jsx';
import AddWorkdayWorkersDialog from './components/AddWorkdayWorkersDialog.jsx';
import EditWorkdayLaborDialog from './components/EditWorkdayLaborDialog.jsx';
import HarvestRecordFormDialog from './components/HarvestRecordFormDialog.jsx';
import WorkdayHeader from './components/WorkdayHeader.jsx';
import HarvestWorkerCard from './components/HarvestWorkerCard.jsx';
import {
  addWorkersToWorkday as addWorkersToWorkdayRequest,
  createWorkdayWithWorkers,
} from '#lib/domain/workdayActions';
import {
  getHarvestRecords,
  groupWorkdayParticipants,
  mapParticipant,
  mapWorkday,
} from '#lib/domain/workdays';
import { belongsToPeriod, PERIOD_LABELS } from '#lib/dates';
import { isPerKilogram } from '#lib/constants';
import { formatoDinero, formatoKilos, hoy } from '#lib/formatters';
import { matchesSearch, sumBy } from '#lib/utils';
import ConfirmDialog from '#components/shared/ConfirmDialog';
import { useApiResource } from '#hooks/useApiResource';
import { useConfirm } from '#hooks/useConfirm';
import { useNotice } from '#hooks/useNotice';
import { notifyDataChanged } from '#hooks/usePendingWorkdays';

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

const fetchWorkdays = () => api.workdays.list().then((items) => items.flatMap(mapWorkday));


export default function WorkdayPage() {
  const {
    data: workdays,
    setData: setWorkdays,
    loading,
    error: loadError,
  } = useApiResource('workdays', fetchWorkdays, { initialData: [] });
  const [search, setSearch] = useState('');
  // Inicio puede abrir esta página en una pestaña y periodo concretos.
  const { state: navState } = useLocation();
  const [period, setPeriod] = useState(navState?.period || 'today');
  const [modality, setModality] = useState(navState?.modality || 'all');
  const [section, setSection] = useState(navState?.section || 'workdays');
  const [action, setAction] = useState('');
  const [workdayForAddingWorkers, setWorkdayForAddingWorkers] = useState(null);
  const [workdayForEditing, setWorkdayForEditing] = useState(null);
  const { notice, isError, show: showNotice, clear: clearNotice } = useNotice();
  const confirmer = useConfirm();
  const [busyAction, setBusyAction] = useState('');

  const [todayKey] = useState(hoy);
  const filteredWorkdays = useMemo(() => {
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
      .filter((workday) => matchesSearch(getWorkdaySearchText(workday), search))
      .sort((first, second) => second.dateKey.localeCompare(first.dateKey));
  }, [modality, period, search, todayKey, workdays]);

  // Un jornal = una persona pagada por jornal un día; una jornada puede tener varios.
  const jornalCount = sumBy(
    filteredWorkdays,
    (workday) => workday.participants.filter((entry) => !entry.isPerKilogram).length,
  );
  const calculatedTotal = sumBy(filteredWorkdays, (workday) => workday.totalAmount);
  const harvestRecords = useMemo(() => getHarvestRecords(workdays), [workdays]);
  const filteredHarvestRecords = harvestRecords
    .filter((record) =>
      belongsToPeriod(record.dateKey, period, todayKey),
    )
    .filter((record) => {
      if (modality === 'jornal') return !isPerKilogram(record.paymentMode);
      if (modality === 'kilogram') return isPerKilogram(record.paymentMode);
      return true;
    })
    .filter((record) => matchesSearch(getHarvestSearchText(record), search))
    .sort(
      (first, second) =>
        second.dateKey.localeCompare(first.dateKey) ||
        second.time.localeCompare(first.time),
    );
  const totalHarvestKilograms = sumBy(filteredHarvestRecords, (record) => record.quantityKg);
  const periodLabel = PERIOD_LABELS[period];

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
    showNotice('La jornada laboral se registró correctamente.');
  };

  const closeWorkday = async (workday) => {
    const confirmed = await confirmer.confirm({
      title: '¿Cerrar esta jornada?',
      description: 'Después de cerrarla no se podrán agregar ni modificar registros.',
      confirmLabel: 'Cerrar jornada',
    });
    if (!confirmed) return;

    setBusyAction(`close:${workday.id}`);
    clearNotice();
    try {
      await api.workdays.close(workday.id);
      setWorkdays((current) =>
        current.map((participant) =>
          String(participant.workdayId) === String(workday.id)
            ? { ...participant, workdayStatus: 'cerrada' }
            : participant,
        ),
      );
      showNotice('La jornada se cerró correctamente.');
      // La campanita de notificaciones baja su contador.
      notifyDataChanged();
    } catch (error) {
      console.error('Error al cerrar la jornada:', error);
      showNotice(error.message || 'No se pudo cerrar la jornada.', true);
    } finally {
      setBusyAction('');
    }
  };

  const addWorkersToWorkday = async (workday, context) => {
    if (workday.status !== 'abierta') {
      throw new Error('No se pueden agregar trabajadores a una jornada cerrada.');
    }

    const savedParticipants = await addWorkersToWorkdayRequest(workday, context);

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
    showNotice(
      `${savedParticipants.length} ${savedParticipants.length === 1 ? 'trabajador agregado' : 'trabajadores agregados'} a la jornada.`,
    );
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
      showNotice('La jornada y los datos de sus trabajadores se actualizaron.');
    } catch (error) {
      console.error('Error al actualizar jornada completa:', error);
      throw error;
    }
  };

  const cancelParticipation = async (participant) => {
    const confirmed = await confirmer.confirm({
      title: `¿Retirar a ${participant.workerName || 'este trabajador'} de la jornada?`,
      confirmLabel: 'Retirar',
    });
    if (!confirmed) return;

    setBusyAction(`cancel:${participant.id}`);
    clearNotice();
    try {
      await api.workdayWorkers.cancel(participant.id);
      setWorkdays((current) =>
        current.map((item) =>
          String(item.id) === String(participant.id)
            ? { ...item, settlementStatus: 'anulado' }
            : item,
        ),
      );
      showNotice(
        `${participant.workerName || 'El trabajador'} fue retirado de la jornada.`,
      );
    } catch (error) {
      console.error('Error al retirar al trabajador de la jornada:', error);
      showNotice(
        error.message || 'No se pudo retirar al trabajador de la jornada.',
        true,
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
    showNotice('El pesaje de recolección se registró correctamente.');
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
            ? formatoKilos(totalHarvestKilograms)
            : formatoDinero(calculatedTotal)
        }
        totalLabel={section === 'harvest' ? 'kg recolectados' : 'calculado'}
        onAddHarvest={() => setAction('pesaje')}
        onAddWorkday={() => setAction('jornada')}
        periodLabel={periodLabel}
      />

      <NoticeBanner isError={isError} message={notice} />
      <ConfirmDialog {...confirmer.dialogProps} />

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

        <ListFilters
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
            <LoadingState boxed>Cargando jornadas laborales…</LoadingState>
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
            <EmptyState
              description={
                loadError ||
                (workdays.length
                  ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
                  : 'Cuando registres una jornada, aquí podrás consultar su actividad, tarifa y valor estimado.')
              }
              icon={ClipboardList}
              title={
                loadError
                  ? 'No se pudieron cargar las jornadas'
                  : workdays.length
                    ? 'No hay resultados para estos filtros'
                    : 'Aún no hay jornadas laborales'
              }
            />
          )}
        </TabsContent>

        <TabsContent className="space-y-3" value="harvest">
          {loading ? (
            <LoadingState boxed>Cargando registros de recolección…</LoadingState>
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
            <EmptyState
              description={
                loadError ||
                (harvestRecords.length
                  ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
                  : 'Los pesajes registrados aparecerán aquí con su trabajador, lote, fecha y hora.')
              }
              icon={Search}
              title={
                loadError
                  ? 'No se pudieron cargar los pesajes'
                  : harvestRecords.length
                    ? 'No hay pesajes para estos filtros'
                    : 'Aún no hay registros de recolección'
              }
            />
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
