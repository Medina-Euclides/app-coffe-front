// Lista, crea y elimina tipos de actividad laboral del usuario.
import { useState } from 'react';
import ItemCard from '#components/shared/ItemCard';
import NoticeBanner from '#components/shared/NoticeBanner';
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
import { api } from '#services/api';
import { guardarCacheActividades } from '#services/activityStorage';
import { useApiList } from '#hooks/useApiList';
import { useSearchFilter } from '#hooks/useSearchFilter';
import { useNotice } from '#hooks/useNotice';
import { useDialog } from '#hooks/useDialog';

export default function ActividadesLaborales({ usuario }) {
  const userId = usuario?.id || 'default';
  const storageKey = `cafesmart_actividades_${userId}`;

  const { data: activities, setData, loading } = useApiList(
    storageKey,
    () => api.activities.list(),
    (key, result) => guardarCacheActividades(userId, result),
  );

  const { search, setSearch, filtered } = useSearchFilter(
    activities,
    (activity) => `${activity.name} ${activity.description}`,
  );

  const { notice, isError, show: setNotice } = useNotice();
  const {
    open: dialogOpen,
    item: activityToEdit,
    openWith: openEditActivityDialog,
    close: closeDialog,
  } = useDialog();
  const [activityToView, setActivityToView] = useState(null);

  const saveActivity = async (data) => {
    if (data.name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    if (
      activities.some(
        (activity) =>
          String(activity.id) !== String(activityToEdit?.id) &&
          activity.name.trim().toLocaleLowerCase() ===
            data.name.toLocaleLowerCase(),
      )
    ) {
      return 'Ya existe una actividad con ese nombre.';
    }

    if (activityToEdit && !activityToEdit.id) {
      return 'Esta actividad solo existe en la caché local. Conéctate y vuelve a cargarla antes de editar.';
    }

    try {
      const savedActivity = activityToEdit
        ? await api.activities.update(activityToEdit.id, data)
        : await api.activities.create(data);
      const nextActivities = activityToEdit
        ? activities.map((activity) =>
            String(activity.id) === String(savedActivity.id)
              ? savedActivity
              : activity,
          )
        : [...activities, savedActivity];
      setData(nextActivities);
      guardarCacheActividades(userId, nextActivities);
      setNotice(activityToEdit ? 'Actividad actualizada.' : 'Actividad agregada.', false);
      closeDialog();
      return '';
    } catch (err) {
      console.error('Error al guardar tipo de actividad:', err);
      return err.message || 'No se pudo guardar la actividad. Inténtalo de nuevo.';
    }
  };

  const deleteActivity = async (activity) => {
    if (!activity.id) {
      setNotice('Esta actividad solo existe en la caché local. No se puede borrar del servidor.', true);
      return;
    }
    if (
      !window.confirm(
        `¿Eliminar la actividad “${activity.name}”? Si ya está asociada a jornadas, el servidor impedirá eliminarla.`,
      )
    ) {
      return;
    }

    try {
      await api.activities.delete(activity.id);
      const nextActivities = activities.filter(
        (item) => String(item.id) !== String(activity.id),
      );
      setData(nextActivities);
      guardarCacheActividades(userId, nextActivities);
      if (String(activityToView?.id) === String(activity.id)) {
        setActivityToView(null);
      }
      setNotice('Actividad eliminada.', false);
    } catch (err) {
      console.error('Error al eliminar tipo de actividad:', err);
      setNotice(err.message || 'No se pudo eliminar la actividad.', true);
    }
  };

  const openNewActivityDialog = () => {
    openEditActivityDialog(null);
  };

  return (
    <>
      <ManagementPage
        actionLabel="Nueva actividad laboral"
        description="Administra los tipos de labor de tu productor. Marca cuáles son de recolección para habilitar el pago por kilogramo."
        onAction={openNewActivityDialog}
        onSearchChange={setSearch}
        searchLabel="actividades laborales"
        searchValue={search}
        title="Actividades laborales"
      >
        <NoticeBanner message={notice} isError={isError} />
        {loading ? (
          <p
            aria-live="polite"
            className="py-8 text-center text-sm text-[#68766b]"
            role="status"
          >
            Cargando actividades…
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState
            description={
              activities.length
                ? 'Prueba con otro término de búsqueda.'
                : isError
                  ? 'No se pudo consultar el catálogo del servidor.'
                  : 'Agrega los tipos de labores que organizas en tus fincas.'
            }
            title={
              activities.length
                ? 'No encontramos actividades'
                : isError
                  ? 'No se pudo cargar el catálogo'
                  : 'Aún no hay actividades'
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((activity) => {
              const isHarvest = activity.is_harvest;
              return (
                <ItemCard
                  key={activity.id || activity.name}
                  avatar={
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3e9] text-[#426b48]"
                    >
                      {activity.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  }
                  title={activity.name}
                  subtitle={
                    activity.description ||
                      (isHarvest
                        ? 'Pago por kilogramo recolectado.'
                        : 'Pago por jornada laboral.')
                  }
                  badge={isHarvest ? 'Recolección' : 'Labor por jornal'}
                  badgeProps={{
                    className: 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]',
                  }}
                  actions={[
                    {
                      label: 'Consultar',
                      onClick: setActivityToView,
                      item: activity,
                    },
                    {
                      label: 'Editar',
                      onClick: openEditActivityDialog,
                      item: activity,
                    },
                    {
                      label: 'Eliminar',
                      onClick: deleteActivity,
                      item: activity,
                      className: 'min-h-10 rounded-lg text-red-700 hover:bg-red-50',
                    },
                  ]}
                />
              );
            })}
          </div>
        )}
      </ManagementPage>

      {dialogOpen && (
        <ActivityFormDialog
          activity={activityToEdit}
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
          onSave={saveActivity}
          open={dialogOpen}
        />
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setActivityToView(null);
        }}
        open={Boolean(activityToView)}
      >
        <DialogContent className="rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-semibold text-[#183d2b]">
              {activityToView?.name}
            </DialogTitle>
            <DialogDescription>
              {activityToView?.is_harvest
                ? 'Recolección de café; puede liquidarse por kilogramo.'
                : 'Tipo de labor que se paga por jornal.'}
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-xl bg-[#f7f8f3] p-4 text-sm leading-6 text-[#58675a]">
            {activityToView?.description ||
              'La jornada laboral registra cuándo y quién ejecutó esta actividad.'}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
