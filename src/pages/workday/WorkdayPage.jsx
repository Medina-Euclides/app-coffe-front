// Página de jornadas laborales: lista, crea, edita y cierra jornadas de trabajadores,
// y muestra los pesajes de recolección por trabajador.
import { useState } from 'react';
import { CalendarDays, ClipboardList } from 'lucide-react';
import ConfirmDialog from '#components/shared/ConfirmDialog';
import ListFilters from '#components/shared/ListFilters';
import NoticeBanner from '#components/shared/NoticeBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { useApiResource } from '#hooks/useApiResource';
import { useConfirm } from '#hooks/useConfirm';
import { useNotice } from '#hooks/useNotice';
import { mapWorkday } from '#lib/domain/workdays';
import { formatoDinero, formatoKilos, plural } from '#lib/formatters';
import { api } from '#services/api';
import AddWorkdayWorkersDialog from './components/AddWorkdayWorkersDialog.jsx';
import EditWorkdayLaborDialog from './components/EditWorkdayLaborDialog.jsx';
import HarvestRecordFormDialog from './components/HarvestRecordFormDialog.jsx';
import HarvestTab from './components/HarvestTab.jsx';
import WorkdayFormDialog from './components/WorkdayFormDialog.jsx';
import WorkdayHeader from './components/WorkdayHeader.jsx';
import WorkdaysTab from './components/WorkdaysTab.jsx';
import { useWorkdayActions } from './hooks/useWorkdayActions.js';
import { useWorkdayFilters } from './hooks/useWorkdayFilters.js';

const fetchWorkdays = () => api.workdays.list().then((items) => items.flatMap(mapWorkday));

export default function WorkdayPage() {
  const {
    data: workdays,
    setData: setWorkdays,
    loading,
    error: loadError,
  } = useApiResource('workdays', fetchWorkdays, { initialData: [] });
  const filters = useWorkdayFilters(workdays);
  const {
    search,
    setSearch,
    period,
    setPeriod,
    modality,
    setModality,
    section,
    setSection,
    periodLabel,
    filteredWorkdays,
    harvestRecords,
    filteredHarvestRecords,
    jornalCount,
    calculatedTotal,
    totalHarvestKilograms,
  } = filters;
  const [action, setAction] = useState('');
  const [workdayForAddingWorkers, setWorkdayForAddingWorkers] = useState(null);
  const [workdayForEditing, setWorkdayForEditing] = useState(null);
  const { notice, isError, show: showNotice, clear: clearNotice } = useNotice();
  const confirmer = useConfirm();
  const actions = useWorkdayActions({
    setWorkdays,
    confirmer,
    showNotice,
    clearNotice,
    onSaved: filters.resetFilters,
  });

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
        secondaryCount={section === 'harvest' ? '' : plural(jornalCount, 'jornal', 'jornales')}
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
          <WorkdaysTab
            busyAction={actions.busyAction}
            hasWorkdays={workdays.length > 0}
            loadError={loadError}
            loading={loading}
            onAddWorkers={setWorkdayForAddingWorkers}
            onCancelParticipation={actions.cancelParticipation}
            onClose={actions.closeWorkday}
            onEdit={setWorkdayForEditing}
            workdays={filteredWorkdays}
          />
        </TabsContent>

        <TabsContent className="space-y-3" value="harvest">
          <HarvestTab
            hasRecords={harvestRecords.length > 0}
            loadError={loadError}
            loading={loading}
            periodLabel={periodLabel}
            records={filteredHarvestRecords}
          />
        </TabsContent>
      </Tabs>

      {action === 'jornada' && (
        <WorkdayFormDialog
          existingWorkdays={workdays}
          onOpenChange={(open) => !open && setAction('')}
          onSave={actions.saveWorkday}
          open
        />
      )}

      {workdayForAddingWorkers && (
        <AddWorkdayWorkersDialog
          onOpenChange={(open) =>
            !open && setWorkdayForAddingWorkers(null)
          }
          onSave={(context) =>
            actions.addWorkersToWorkday(workdayForAddingWorkers, context)
          }
          open
          workday={workdayForAddingWorkers}
        />
      )}

      {workdayForEditing && (
        <EditWorkdayLaborDialog
          onOpenChange={(open) => !open && setWorkdayForEditing(null)}
          onSave={(data) => actions.updateWorkdayLabor(workdayForEditing, data)}
          open
          workday={workdayForEditing}
        />
      )}

      {action === 'pesaje' && (
        <HarvestRecordFormDialog
          onOpenChange={(open) => !open && setAction('')}
          onSave={actions.saveHarvestRecord}
          open
        />
      )}
    </section>
  );
}
