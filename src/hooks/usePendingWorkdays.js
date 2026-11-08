// Jornadas olvidadas: abiertas y de un día anterior. Alimenta la campanita de
// notificaciones. Se usa una sola vez (en AppLayout) y se pasa a las campanitas,
// para no duplicar pedidos ni listeners.
import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '#services/api';
import { DATA_EVENT } from '#services/syncService';
import { useApiResource } from './useApiResource.js';
import { hoy } from '#lib/formatters';
import { groupWorkdayParticipants, mapWorkday } from '#lib/domain/workdays';

function findPending(items) {
  const todayKey = hoy();
  return groupWorkdayParticipants(items.flatMap(mapWorkday))
    .filter((workday) => workday.status === 'abierta' && workday.dateKey < todayKey)
    .sort((first, second) => first.dateKey.localeCompare(second.dateKey));
}

// Avisa al resto de la app (página de Jornadas, analíticas…) que hubo cambios.
export function notifyDataChanged() {
  window.dispatchEvent(new CustomEvent(DATA_EVENT));
}

const EMPTY = [];
const fetchPending = () =>
  api.workdays
    .list()
    .then(findPending)
    // Sin conexión ni copia local: la campanita simplemente no avisa.
    .catch((error) => {
      console.error('Error al revisar jornadas pendientes:', error);
      return EMPTY;
    });

export function usePendingWorkdays() {
  const { pathname } = useLocation();
  // Al entrar a otra página se revisa de nuevo (p. ej. tras crear o cerrar jornadas);
  // también al sincronizar (DATA_EVENT, dentro de useApiResource).
  const { data: pending, setData: setPending, refetch } = useApiResource(
    `pending-workdays:${pathname}`,
    fetchPending,
    { initialData: EMPTY },
  );
  const reload = useCallback(() => refetch({ background: true }), [refetch]);

  // Al volver a la app desde otra pestaña o aplicación.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload]);

  const close = useCallback(
    async (workday) => {
      await api.workdays.close(workday.id);
      setPending((current) => current.filter((item) => item.id !== workday.id));
      notifyDataChanged();
    },
    [setPending],
  );

  return { pending, reload, close };
}
