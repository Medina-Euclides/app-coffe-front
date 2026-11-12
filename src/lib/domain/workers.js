// Nombre, validación y guardado de trabajadores (Trabajadores, Inicio, Configuración, Jornadas).
import { api } from '#services/api';
import { validateCedula, validatePersonName, validatePhone } from '#lib/validation';
import { getWorkerName } from './entities.js';

export { getWorkerName, getWorkerLabel, getWorkerIdentification } from './entities.js';

// Nombre visible del trabajador, sin importar el formato en que llegó.
export const getWorkerDisplayName = (worker) => getWorkerName(worker) || 'Sin nombre';

// Separa un nombre completo antiguo: la primera palabra es el nombre y el resto el apellido.
export function splitFullName(fullName = '') {
  const [firstName = '', ...lastNames] = String(fullName || '').trim().split(/\s+/);
  return { firstName, lastName: lastNames.join(' ') };
}

// Lleva un trabajador (incluso de datos antiguos con `nombre`, `cedula`, `estado`)
// al esquema de la API que usa la UI.
export function normalizeWorker(worker) {
  if (worker.first_name && worker.last_name) return worker;
  const { firstName, lastName } = splitFullName(worker.nombre);
  return {
    ...worker,
    first_name: firstName,
    last_name: lastName,
    identification: worker.identification || worker.cedula || '',
    phone: worker.phone || '',
    is_active: worker.is_active ?? worker.estado !== 'inactivo',
  };
}

// Devuelve el mensaje de error para mostrar en el formulario, o '' si los datos son válidos.
export function validateWorker(data, workers, editingId) {
  if (!data.first_name) return 'Escribe el nombre del trabajador.';
  if (!data.last_name) return 'Escribe el apellido del trabajador.';
  const fieldError =
    validatePersonName(data.first_name, { label: 'nombre' }) ||
    validatePersonName(data.last_name, { label: 'apellido' }) ||
    validateCedula(data.identification) ||
    validatePhone(data.phone);
  if (fieldError) return fieldError;
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
