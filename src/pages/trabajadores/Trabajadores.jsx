import { useEffect, useMemo, useState } from 'react';
import EmptyState from '#components/shared/EmptyState';
import ManagementPage from '#components/shared/ManagementPage';
import WorkerCard from './components/WorkerCard.jsx';
import WorkerFormDialog from './components/WorkerFormDialog.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { leerLocal } from '#lib/storage';
import { api } from '#services/api';
import { guardarCacheTrabajadores } from '#services/workerStorage';

function cargarTrabajadores(clave) {
  const guardados = leerLocal(clave, []);
  if (!Array.isArray(guardados)) return [];
  return guardados.map((worker) => {
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
  });
}

export default function Trabajadores({ usuario }) {
  const userId = usuario?.id || 'default';
  const storageKey = `cafesmart_trabajadores_${userId}`;
  const [workers, setWorkers] = useState(() => cargarTrabajadores(storageKey));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState(null);
  const [workerToView, setWorkerToView] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);

  useEffect(() => {
    let active = true;
    api.workers
      .list()
      .then((loadedWorkers) => {
        if (!active) return;
        setWorkers(loadedWorkers);
        guardarCacheTrabajadores(userId, loadedWorkers);
      })
      .catch((error) => {
        if (!active) return;
        console.error('Error al cargar trabajadores:', error);
        setNotice(error.message || 'No se pudieron cargar los trabajadores.');
        setNoticeIsError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return workers;
    return workers.filter((worker) =>
      `${worker.nombre || ''} ${worker.identification || ''} ${worker.phone || ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [search, workers]);

  const saveWorker = async (data) => {
    if (data.first_name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    if (data.last_name.length < 2) return 'Escribe un apellido de al menos 2 caracteres.';
    if (
      data.identification &&
      workers.some(
        (worker) =>
          String(worker.id) !== String(workerToEdit?.id) &&
          String(worker.identification || '').trim().toLowerCase() ===
            data.identification.toLowerCase(),
      )
    ) {
      return 'Ya existe un trabajador con ese número de identificación.';
    }

    const payload = {
      ...data,
      identification: data.identification || null,
      phone: data.phone || null,
    };
    try {
      const savedWorker = workerToEdit
        ? await api.workers.update(workerToEdit.id, payload)
        : await api.workers.create(payload);
      const nextWorkers = workerToEdit
        ? workers.map((worker) =>
            String(worker.id) === String(savedWorker.id)
              ? savedWorker
              : worker,
          )
        : [...workers, savedWorker];
      setWorkers(nextWorkers);
      guardarCacheTrabajadores(userId, nextWorkers);
      setNotice(workerToEdit ? 'Trabajador actualizado.' : 'Trabajador agregado.');
      setNoticeIsError(false);
      setWorkerToEdit(null);
      return '';
    } catch (error) {
      console.error('Error al guardar el trabajador:', error);
      return error.message || 'No se pudo guardar el trabajador. Inténtalo de nuevo.';
    }
  };

  const openNewWorkerDialog = () => {
    setWorkerToEdit(null);
    setDialogOpen(true);
  };

  const openEditWorkerDialog = (worker) => {
    setWorkerToEdit(worker);
    setDialogOpen(true);
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
      setWorkers(nextWorkers);
      guardarCacheTrabajadores(userId, nextWorkers);
      setNotice(
        !isActive
          ? `${worker.nombre} está activo nuevamente.`
          : `${worker.nombre} quedó inactivo. Sus registros históricos se conservan.`,
      );
      setNoticeIsError(false);
    } catch (error) {
      console.error('Error al actualizar estado del trabajador:', error);
      setNotice(error.message || 'No se pudo actualizar el estado del trabajador.');
      setNoticeIsError(true);
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
              noticeIsError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]'
            }`}
            role="status"
          >
            {notice}
          </p>
        )}
        {loading ? (
          <p aria-live="polite" className="py-8 text-center text-sm text-[#68766b]" role="status">
            Cargando trabajadores…
          </p>
        ) : filteredWorkers.length === 0 ? (
          <EmptyState
            description={
              workers.length || noticeIsError
                ? 'Prueba con otro nombre o número de identificación.'
                : 'Agrega a las personas que realizan labores en tus fincas para tener su información a mano.'
            }
            title={
              workers.length
                ? 'No encontramos trabajadores'
                : noticeIsError
                  ? 'No se pudo consultar la lista'
                  : 'Aún no hay trabajadores'
            }
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
                  Teléfono
                </dt>
                <dd className="mt-1 break-all font-medium text-[#294533]">
                  {workerToView.phone || 'No registrado'}
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
