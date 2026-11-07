// Carga una lista desde la API: data, loading, error, refetch.
// La copia local vive solo en IndexedDB (api.*.list usa cachedList); aquí no se guarda
// otra copia en localStorage para no duplicar información.
import { useCallback, useEffect, useRef, useState } from 'react';
import { DATA_EVENT } from '#services/syncService';

export function useApiList(key, fetchFn) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const active = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  // Sincronizar la función en una ref para no depender de ella en el efecto de carga.
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const load = useCallback(async () => {
    active.current = true;
    setLoading(true);
    try {
      const result = await fetchFnRef.current();
      if (!active.current) return;
      setData(result);
      setError('');
    } catch (err) {
      if (!active.current) return;
      setError(err.message || 'No se pudieron cargar los datos.');
    } finally {
      if (active.current) setLoading(false);
    }
  }, []);

  // Carga inicial al montar y al cambiar la clave (p. ej. otro usuario).
  useEffect(() => {
    active.current = true;
    void load();
    return () => {
      active.current = false;
    };
  }, [load, key]);

  // Recargar cuando la sincronización trae datos nuevos del servidor.
  useEffect(() => {
    const reload = () => void load();
    window.addEventListener(DATA_EVENT, reload);
    return () => window.removeEventListener(DATA_EVENT, reload);
  }, [load]);

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  return { data, setData, loading, error, refetch };
}
