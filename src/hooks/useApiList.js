// Carga una lista desde la API con caché en localStorage: data, loading, error, refetch.
import { useCallback, useEffect, useRef, useState } from 'react';
import { leerLocal } from '#lib/storage';

export function useApiList(storageKey, fetchFn, saveFn) {
  const [data, setData] = useState(() => leerLocal(storageKey, []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const active = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  const saveFnRef = useRef(saveFn);

  // Sincronizar las funciones en refs para no depender de ellas en el efecto de carga.
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    saveFnRef.current = saveFn;
  }, [fetchFn, saveFn]);

  const load = useCallback(async () => {
    active.current = true;
    setLoading(true);
    try {
      const result = await fetchFnRef.current();
      if (!active.current) return;
      setData(result);
      if (saveFnRef.current) saveFnRef.current(storageKey, result);
      setError('');
    } catch (err) {
      if (!active.current) return;
      setError(err.message || 'No se pudieron cargar los datos.');
    } finally {
      if (active.current) setLoading(false);
    }
  }, [storageKey]);

  // Carga inicial al montar (regla async-api-routes: iniciar promesa temprano).
  useEffect(() => {
    active.current = true;
    void load();
    return () => {
      active.current = false;
    };
  }, [load]);

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  return { data, setData, loading, error, refetch };
}
