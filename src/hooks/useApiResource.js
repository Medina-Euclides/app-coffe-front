// Carga cualquier dato de la API (una lista, un resumen o varios pedidos con Promise.all):
// data, loading, error, refetch. Vuelve a cargar al cambiar `key`, al llamar `refetch`
// y en segundo plano cuando la sincronización trae datos nuevos (DATA_EVENT).
// Con `enabled: false` no pide nada (p. ej. un formulario cerrado).
// `refreshOnSync: false` evita recargar con la sincronización (un formulario abierto no
// debe cambiar mientras se llena) y `onSuccess(data)` corre tras cada carga correcta
// (p. ej. para poner valores por defecto).
import { useCallback, useEffect, useRef, useState } from 'react';
import { DATA_EVENT } from '#services/syncService';

export function useApiResource(
  key,
  fetchFn,
  { initialData = null, enabled = true, refreshOnSync = true, onSuccess } = {},
) {
  const [data, setData] = useState(initialData);
  // Empieza en true: al habilitarse (p. ej. abrir un formulario) no se ve vacío antes de cargar.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  // Cada carga recibe un número; solo la más reciente puede escribir el estado.
  const requestId = useRef(0);

  // Sincronizar la función en una ref para no depender de ella en el efecto de carga.
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    onSuccessRef.current = onSuccess;
  }, [fetchFn, onSuccess]);

  // `background`: recarga por sincronización; mantiene los datos a la vista sin "Cargando…".
  const load = useCallback(async ({ background = false } = {}) => {
    const id = ++requestId.current;
    if (!background) setLoading(true);
    try {
      const result = await fetchFnRef.current();
      if (id !== requestId.current) return;
      setData(result);
      setError('');
      onSuccessRef.current?.(result);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error(`Error al cargar "${key}":`, err);
      setError(err?.message || 'No se pudieron cargar los datos.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [key]);

  // Carga inicial y al cambiar la clave (p. ej. otro usuario u otra finca).
  useEffect(() => {
    if (!enabled) return undefined;
    void load();
    return () => {
      // Invalida la respuesta pendiente al desmontar o cambiar de clave.
      requestId.current += 1;
    };
  }, [enabled, load]);

  // Recargar cuando la sincronización trae datos nuevos del servidor.
  useEffect(() => {
    if (!enabled || !refreshOnSync) return undefined;
    const reload = () => void load({ background: true });
    window.addEventListener(DATA_EVENT, reload);
    return () => window.removeEventListener(DATA_EVENT, reload);
  }, [enabled, load, refreshOnSync]);

  // refetch() muestra "Cargando…"; refetch({ background: true }) actualiza sin ocultar lo actual.
  // Devuelve la promesa de carga para poder agrupar varias recargas con Promise.all.
  const refetch = useCallback(
    (options) => {
      return load({ background: options?.background === true });
    },
    [load],
  );

  return { data, setData, loading: enabled && loading, error, refetch };
}
