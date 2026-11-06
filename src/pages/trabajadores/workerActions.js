// Validación y guardado de trabajadores, compartidos entre Trabajadores e Inicio.
import { api } from '#services/api';

// Nombre visible del trabajador, sin importar el formato en que llegó.
export function getWorkerDisplayName(worker) {
  return (
    worker.nombre ||
    worker.full_name ||
    [worker.first_name, worker.last_name].filter(Boolean).join(' ') ||
    'Sin nombre'
  );
}

// Devuelve el mensaje de error para mostrar en el formulario, o '' si los datos son válidos.
export function validateWorker(data, workers, editingId) {
  if (data.first_name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
  if (data.last_name.length < 2) return 'Escribe un apellido de al menos 2 caracteres.';
  if (
    data.identification &&
    workers.some(
      (worker) =>
        String(worker.id) !== String(editingId) &&
        String(worker.identification || '').trim().toLowerCase() ===
          data.identification.toLowerCase(),
    )
  ) {
    return 'Ya existe un trabajador con ese número de identificación.';
  }
  return '';
}

export function saveWorkerRequest(data, editingId) {
  const payload = {
    ...data,
    identification: data.identification || null,
    phone: data.phone || null,
  };
  return editingId
    ? api.workers.update(editingId, payload)
    : api.workers.create(payload);
}
