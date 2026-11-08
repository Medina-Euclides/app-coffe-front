// Carga, filtra y gestiona trabajadores del usuario.
import { useMemo, useState } from 'react';
import EmptyState from '#components/shared/EmptyState';
import ManagementPage from '#components/shared/ManagementPage';
import NoticeBanner from '#components/shared/NoticeBanner';
import WorkerFormDialog from './components/WorkerFormDialog.jsx';
import WorkerCard from './components/WorkerCard.jsx';
import DetailDialog, { InfoField, InfoGrid } from '#components/shared/DetailDialog';
import IconBadge from '#components/shared/IconBadge';
import LoadingState from '#components/shared/LoadingState';
import { api } from '#services/api';
import { useCrudList } from '#hooks/useCrudList';
import { useSearchFilter } from '#hooks/useSearchFilter';
import { useNotice } from '#hooks/useNotice';
import { useDialog } from '#hooks/useDialog';
import {
  getWorkerDisplayName,
  normalizeWorker,
  saveWorkerRequest,
  validateWorker,
} from '#lib/domain/workers';

// Busca por nombre, apellido, identificación y teléfono (los datos antiguos traen `nombre`).
const getWorkerSearchText = (worker) =>
  [getWorkerDisplayName(worker), worker.identification, worker.phone].filter(Boolean).join(' ');

export default function Trabajadores({ usuario }) {
  const userId = usuario?.id || 'default';
  const storageKey = `workers:${userId}`;

  const { data: workersRaw, upsert, loading } = useCrudList(storageKey, api.workers.list);

  // Normaliza los trabajadores al esquema usado por la UI.
  const workers = useMemo(
    () => workersRaw.map(normalizeWorker),
    [workersRaw],
  );

  const { search, setSearch, filtered } = useSearchFilter(workers, getWorkerSearchText);

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
      upsert(await saveWorkerRequest(data, workerToEdit?.id));
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
      upsert(await api.workers.update(worker.id, { is_active: !isActive }));
      setNotice(
        !isActive
          ? `${getWorkerDisplayName(worker)} está activo nuevamente.`
          : `${getWorkerDisplayName(worker)} quedó inactivo. Sus registros históricos se conservan.`,
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
          <LoadingState>Cargando trabajadores…</LoadingState>
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
            {filtered.map((worker) => (
              <WorkerCard
                key={worker.id}
                onEdit={openEditWorkerDialog}
                onToggleStatus={toggleWorkerStatus}
                onView={setWorkerToView}
                worker={worker}
              />
            ))}
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

      <DetailDialog
        badge={
          workerToView && (
            <IconBadge
              name={getWorkerDisplayName(workerToView)}
              tone={workerToView.is_active === false ? 'muted' : 'primary'}
            />
          )
        }
        description="Información del trabajador"
        onOpenChange={() => setWorkerToView(null)}
        open={Boolean(workerToView)}
        title={workerToView ? getWorkerDisplayName(workerToView) : ''}
      >
        {workerToView && (
          <InfoGrid>
            <InfoField label="Cédula">{workerToView.identification || 'No registrada'}</InfoField>
            <InfoField label="Estado">{workerToView.is_active === false ? 'Inactivo' : 'Activo'}</InfoField>
            <InfoField label="Teléfono" wide>
              {workerToView.phone || 'No registrado'}
            </InfoField>
          </InfoGrid>
        )}
      </DetailDialog>
    </>
  );
}
