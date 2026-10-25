import { obtenerPendientes, limpiarPendientes, contarPendientes } from '../syncQueue';
import { api } from './api';

export async function sincronizarPendientes() {
  const pendientes = obtenerPendientes();

  if (pendientes.length === 0) {
    return { ok: true, enviados: 0, message: 'No hay registros pendientes por sincronizar.' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Sin conexión. No es posible sincronizar en este momento.');
  }

  try {
    const respuesta = await api.sync.enviarPendientes({ registros: pendientes });
    limpiarPendientes();
    return { ok: true, enviados: pendientes.length, respuesta };
  } catch (error) {
    throw new Error(error.message || 'Error al sincronizar con el servidor.');
  }
}

export function hayPendientes() {
  return contarPendientes() > 0;
}

export function cantidadPendientes() {
  return contarPendientes();
}
