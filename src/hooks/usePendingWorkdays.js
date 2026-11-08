// Jornadas olvidadas: abiertas y de un día anterior. Alimenta la campanita de
// notificaciones. Se usa una sola vez (en AppLayout) y se pasa a las campanitas,
// para no duplicar pedidos ni listeners.
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '#services/api';
import { DATA_EVENT } from '#services/syncService';
import { hoy } from '#lib/formatters';
import {
  groupWorkdayParticipants,
  mapWorkday,
} from '#pages/workday/utils/workdayMappers.js';

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

export function usePendingWorkdays() {
  const [pending, setPending] = useState([]);
  const { pathname } = useLocation();

  const reload = useCallback(
    () =>
      api.workdays
        .list()
        .then((items) => setPending(findPending(items)))
        // Sin conexión ni copia local: la campanita simplemente no avisa.
        .catch((error) => console.error('Error al revisar jornadas pendientes:', error)),
    [],
  );

  // Al entrar a otra página se revisa de nuevo (p. ej. tras crear o cerrar jornadas).
  useEffect(() => {
    reload();
  }, [pathname, reload]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    window.addEventListener(DATA_EVENT, reload);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(DATA_EVENT, reload);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  const close = useCallback(async (workday) => {
    await api.workdays.close(workday.id);
    setPending((current) => current.filter((item) => item.id !== workday.id));
    notifyDataChanged();
  }, []);

  return { pending, reload, close };
}
