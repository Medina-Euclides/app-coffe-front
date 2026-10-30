import { useMemo, useState } from 'react';
import ActivityCard from './components/ActivityCard.jsx';
import ActivityFormDialog from './components/ActivityFormDialog.jsx';
import EmptyState from '#components/shared/EmptyState';
import ManagementPage from '#components/shared/ManagementPage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { ACTIVIDADES_INICIALES } from '#lib/constants';
import { leerLocal } from '#lib/storage';

function cargarActividades(clave) {
  const guardadas = leerLocal(clave, ACTIVIDADES_INICIALES);
  return Array.isArray(guardadas)
    ? guardadas.filter((activity) => typeof activity === 'string')
    : [];
}

export default function ActividadesLaborales({ usuario }) {
  const userId = usuario?.id || 'default';
  const storageKey = `cafesmart_actividades_${userId}`;
  const [activities, setActivities] = useState(() =>
    cargarActividades(storageKey),
  );
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState('');
  const [activityToView, setActivityToView] = useState('');
  const [notice, setNotice] = useState('');

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? activities.filter((activity) =>
          activity.toLocaleLowerCase().includes(query),
        )
      : activities;
  }, [activities, search]);

  const saveActivities = (nextActivities) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextActivities));
      setActivities(nextActivities);
      setNotice('Cambios guardados.');
      return true;
    } catch (error) {
      console.error('No se pudieron guardar las actividades:', error);
      setNotice('No se pudieron guardar los cambios. Revisa el espacio disponible en el dispositivo.');
      return false;
    }
  };

  const saveActivity = (name) => {
    if (name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    const alreadyExists = activities.some(
      (activity) =>
        activity.toLocaleLowerCase() === name.toLocaleLowerCase() &&
        activity !== activityToEdit,
    );
    if (alreadyExists) return 'Ya existe una actividad con ese nombre.';

    const nextActivities = activityToEdit
      ? activities.map((activity) =>
          activity === activityToEdit ? name : activity,
        )
      : [...activities, name];

    if (!saveActivities(nextActivities)) {
      return 'No se pudo guardar la actividad. Inténtalo de nuevo.';
    }
    setActivityToEdit('');
    return '';
  };

  const openNewActivityDialog = () => {
    setActivityToEdit('');
    setDialogOpen(true);
  };

  const openEditActivityDialog = (activity) => {
    setActivityToEdit(activity);
    setDialogOpen(true);
  };

  return (
    <>
      <ManagementPage
        actionLabel="Nueva actividad laboral"
        description="Organiza los tipos de labores que se realizan en tus fincas. Las jornadas registran cuándo y quién ejecutó cada actividad."
        onAction={openNewActivityDialog}
        onSearchChange={setSearch}
        searchLabel="actividades laborales"
        searchValue={search}
        title="Actividades laborales"
      >
        {notice && (
          <p
            aria-live="polite"
            className={`rounded-lg border px-3 py-2 text-sm ${
              notice.startsWith('No se pud')
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]'
            }`}
            role="status"
          >
            {notice}
          </p>
        )}
        {filteredActivities.length === 0 ? (
          <EmptyState
            description={
              activities.length
                ? 'Prueba con otro término de búsqueda.'
                : 'Agrega los tipos de labores que organizas en tus fincas.'
            }
            title={activities.length ? 'No encontramos actividades' : 'Aún no hay actividades'}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity}
                name={activity}
                onEdit={openEditActivityDialog}
                onView={setActivityToView}
              />
            ))}
          </div>
        )}
      </ManagementPage>

      {dialogOpen && (
        <ActivityFormDialog
          activity={activityToEdit}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setActivityToEdit('');
          }}
          onSave={saveActivity}
          open={dialogOpen}
        />
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setActivityToView('');
        }}
        open={Boolean(activityToView)}
      >
        <DialogContent className="rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-semibold text-[#183d2b]">
              {activityToView}
            </DialogTitle>
            <DialogDescription>
              Tipo de labor del catálogo
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-xl bg-[#f7f8f3] p-4 text-sm leading-6 text-[#58675a]">
            Esta actividad describe una labor que puedes asignar. La jornada laboral registra su ejecución por parte de un trabajador.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
