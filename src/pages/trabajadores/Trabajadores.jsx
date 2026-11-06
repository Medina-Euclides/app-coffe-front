// Carga, filtra y gestiona trabajadores del usuario.
import { useMemo, useState } from 'react';
import EmptyState from '#components/shared/EmptyState';
import ItemCard from '#components/shared/ItemCard';
import ManagementPage from '#components/shared/ManagementPage';
import NoticeBanner from '#components/shared/NoticeBanner';
import WorkerFormDialog from './components/WorkerFormDialog.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { api } from '#services/api';
import { guardarCacheTrabajadores } from '#services/workerStorage';
import { useApiList } from '#hooks/useApiList';
import { useSearchFilter } from '#hooks/useSearchFilter';
import { useNotice } from '#hooks/useNotice';
import { useDialog } from '#hooks/useDialog';
import { saveWorkerRequest, validateWorker } from './workerActions.js';

// Normaliza trabajadores del localStorage al esquema actual.
function normalizarTrabajador(worker) {
  if (worker.first_name && worker.last_name) return worker;
  const [firstName = '', ...lastNames] = String(worker.nombre || '')
    .trim()
    .split(/\s+/);
  return {
    ...worker,
    first_name: firstName,
    last_name: lastNames.join(' '),
    identification: worker.identification || worker.cedula || '',
    phone: worker.phone || '',
    is_active: worker.is_active ?? worker.estado !== 'inactivo',
  };
}

export default function Trabajadores({ usuario }) {
  const userId = usuario?.id || 'default';
  const storageKey = `cafesmart_trabajadores_${userId}`;

  const { data: workersRaw, setData, loading } = useApiList(
    storageKey,
    () => api.workers.list(),
    (key, result) => guardarCacheTrabajadores(userId, result)
  );

  // Normaliza los trabajadores al esquema usado por la UI.
  const workers = useMemo(
    () => workersRaw.map(normalizarTrabajador),
    [workersRaw],
  );

  const { search, setSearch, filtered } = useSearchFilter(
    workers,
    (worker) =>
      `${worker.nombre || ''} ${worker.identification || ''} ${worker.phone || ''}`
  );

  const { notice, isError, show: setNotice } = useNotice();
  const {
    open: dialogOpen,
    item: workerToEdit,
    openWith: openEditWorkerDialog,
    close: closeDialog,
  } = useDialog();
  const [workerToView, setWorkerToView] = useState(null);

  const saveWorker = async (data) => {
    const validationError = validateWorker(data, workers, workerToEdit?.id);
    if (validationError) return validationError;

    try {
      const savedWorker = await saveWorkerRequest(data, workerToEdit?.id);
      const nextWorkers = workerToEdit
        ? workers.map((worker) =>
            String(worker.id) === String(savedWorker.id)
              ? savedWorker
              : worker,
          )
        : [...workers, savedWorker];
      setData(nextWorkers);
      guardarCacheTrabajadores(userId, nextWorkers);
      setNotice(workerToEdit ? 'Trabajador actualizado.' : 'Trabajador agregado.', false);
      closeDialog();
      return '';
    } catch (err) {
      console.error('Error al guardar el trabajador:', err);
      setNotice(err.message || 'No se pudo guardar el trabajador. Inténtalo de nuevo.', true);
      return err.message || 'No se pudo guardar el trabajador. Inténtalo de nuevo.';
    }
  };

  const openNewWorkerDialog = () => {
    openEditWorkerDialog(null);
  };

  const toggleWorkerStatus = async (worker) => {
    const isActive = worker.is_active;
    try {
      const updatedWorker = await api.workers.update(worker.id, {
        is_active: !isActive,
      });
      const nextWorkers = workers.map((item) =>
        String(item.id) === String(updatedWorker.id) ? updatedWorker : item,
      );
      setData(nextWorkers);
      guardarCacheTrabajadores(userId, nextWorkers);
      setNotice(
        !isActive
          ? `${worker.nombre} está activo nuevamente.`
          : `${worker.nombre} quedó inactivo. Sus registros históricos se conservan.`,
        false,
      );
    } catch (err) {
      console.error('Error al actualizar estado del trabajador:', err);
      setNotice(err.message || 'No se pudo actualizar el estado del trabajador.', true);
    }
  };

  return (
    <>
      <ManagementPage
        actionLabel="Agregar trabajador"
        description="Registra y administra las personas que realizan labores en tus fincas."
        onAction={openNewWorkerDialog}
        onSearchChange={setSearch}
        searchLabel="trabajadores por nombre o identificación"
        searchValue={search}
        title="Trabajadores"
      >
        <NoticeBanner message={notice} isError={isError} />
        {loading ? (
          <p aria-live="polite" className="py-8 text-center text-sm text-muted-foreground" role="status">
            Cargando trabajadores…
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState
            description={
              workers.length || isError
                ? 'Prueba con otro nombre o número de identificación.'
                : 'Agrega a las personas que realizan labores en tus fincas para tener su información a mano.'
            }
            title={
              workers.length
                ? 'No encontramos trabajadores'
                : isError
                  ? 'No se pudo consultar la lista'
                  : 'Aún no hay trabajadores'
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((worker) => {
              const isActive = worker.is_active !== false;
              return (
                <ItemCard
                  key={worker.id}
                  avatar={
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tint text-sm font-bold text-primary"
                    >
                      {worker.nombre?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  }
                  title={worker.nombre || 'Sin nombre'}
                  subtitle={
                    <>
                      Identificación: {worker.identification || 'No registrada'}{' '}
                      {worker.phone && (
                        <>
                          <br />
                          Teléfono: {worker.phone}
                        </>
                      )}
                    </>
                  }
                  badge={isActive ? 'Activo' : 'Inactivo'}
                  badgeProps={{
                    className: isActive
                      ? 'shrink-0 border-border bg-tint text-primary'
                      : 'shrink-0 border-border bg-muted text-muted-foreground',
                  }}
                  actions={[
                    {
                      label: 'Consultar',
                      onClick: setWorkerToView,
                      item: worker,
                    },
                    {
                      label: 'Editar',
                      onClick: openEditWorkerDialog,
                      item: worker,
                    },
                    {
                      label: isActive ? 'Desactivar' : 'Activar',
                      onClick: toggleWorkerStatus,
                      item: worker,
                    },
                  ]}
                />
              );
            })}
          </div>
        )}
      </ManagementPage>

      {dialogOpen && (
        <WorkerFormDialog
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
          onSave={saveWorker}
          open={dialogOpen}
          worker={workerToEdit}
        />
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setWorkerToView(null);
        }}
        open={Boolean(workerToView)}
      >
        <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-2xl text-foreground">
              {workerToView?.nombre}
            </DialogTitle>
            <DialogDescription>
              Información del trabajador
            </DialogDescription>
          </DialogHeader>
          {workerToView && (
            <dl className="space-y-3 rounded-xl bg-muted p-4">
              <div>
                <dt className="text-sm text-muted-foreground">
                  Identificación
                </dt>
                <dd className="mt-1 break-all font-medium text-ink-soft">
                  {workerToView.cedula || 'No registrada'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Teléfono
                </dt>
                <dd className="mt-1 break-all font-medium text-ink-soft">
                  {workerToView.phone || 'No registrado'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Estado
                </dt>
                <dd className="mt-1 font-medium text-ink-soft">
                  {workerToView.estado === 'inactivo' ? 'Inactivo' : 'Activo'}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
