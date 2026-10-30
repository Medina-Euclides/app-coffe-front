import { useMemo, useState } from 'react';
import EmptyState from '../components/gestion-finca/EmptyState.jsx';
import ManagementPage from '../components/gestion-finca/ManagementPage.jsx';
import WorkerCard from '../components/workers/WorkerCard.jsx';
import WorkerFormDialog from '../components/workers/WorkerFormDialog.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.jsx';
import { leerLocal } from '../utils/storage.js';

function cargarTrabajadores(clave) {
  const guardados = leerLocal(clave, []);
  return Array.isArray(guardados) ? guardados : [];
}

export default function Workers({ usuario }) {
  const userId = usuario?.id || 'default';
  const storageKey = `cafesmart_trabajadores_${userId}`;
  const [workers, setWorkers] = useState(() => cargarTrabajadores(storageKey));
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState(null);
  const [workerToView, setWorkerToView] = useState(null);
  const [notice, setNotice] = useState('');

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return workers;
    return workers.filter((worker) =>
      `${worker.nombre || ''} ${worker.cedula || ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [search, workers]);

  const saveWorkers = (nextWorkers) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextWorkers));
      setWorkers(nextWorkers);
      setNotice('Cambios guardados.');
      return true;
    } catch (error) {
      console.error('No se pudieron guardar los trabajadores:', error);
      setNotice('No se pudieron guardar los cambios. Revisa el espacio disponible en el dispositivo.');
      return false;
    }
  };

  const saveWorker = ({ nombre, cedula }) => {
    if (nombre.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    if (!/^\d{1,20}$/.test(cedula)) {
      return 'Escribe un número de identificación válido, solo con números.';
    }
    if (
      workers.some(
        (worker) =>
          String(worker.id) !== String(workerToEdit?.id) &&
          String(worker.cedula || '').trim() === cedula,
      )
    ) {
      return 'Ya existe un trabajador con ese número de identificación.';
    }

    const nextWorkers = workerToEdit
      ? workers.map((worker) =>
          worker.id === workerToEdit.id
            ? { ...worker, nombre, cedula }
            : worker,
        )
      : [...workers, { id: Date.now(), nombre, cedula, estado: 'activo' }];

    if (!saveWorkers(nextWorkers)) {
      return 'No se pudo guardar el trabajador. Inténtalo de nuevo.';
    }
    setWorkerToEdit(null);
    return '';
  };

  const openNewWorkerDialog = () => {
    setWorkerToEdit(null);
    setDialogOpen(true);
  };

  const openEditWorkerDialog = (worker) => {
    setWorkerToEdit(worker);
    setDialogOpen(true);
  };

  const toggleWorkerStatus = (worker) => {
    const nextStatus =
      worker.estado === 'inactivo' ? 'activo' : 'inactivo';
    const nextWorkers = workers.map((item) =>
      item.id === worker.id ? { ...item, estado: nextStatus } : item,
    );
    if (saveWorkers(nextWorkers)) {
      setNotice(
        nextStatus === 'activo'
          ? `${worker.nombre} está activo nuevamente.`
          : `${worker.nombre} quedó inactivo. Sus registros históricos se conservan.`,
      );
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
        {filteredWorkers.length === 0 ? (
          <EmptyState
            description={
              workers.length
                ? 'Prueba con otro nombre o número de identificación.'
                : 'Agrega a las personas que realizan labores en tus fincas para tener su información a mano.'
            }
            title={workers.length ? 'No encontramos trabajadores' : 'Aún no hay trabajadores'}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredWorkers.map((worker) => (
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
            setDialogOpen(open);
            if (!open) setWorkerToEdit(null);
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
            <DialogTitle className="text-lg font-semibold text-[#183d2b]">
              {workerToView?.nombre}
            </DialogTitle>
            <DialogDescription>
              Información del trabajador
            </DialogDescription>
          </DialogHeader>
          {workerToView && (
            <dl className="space-y-3 rounded-xl bg-[#f7f8f3] p-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#748074]">
                  Identificación
                </dt>
                <dd className="mt-1 break-all font-medium text-[#294533]">
                  {workerToView.cedula || 'No registrada'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#748074]">
                  Estado
                </dt>
                <dd className="mt-1 font-medium text-[#294533]">
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
