// Lista de la API con ayudas para reflejar al instante lo que se crea, edita o borra,
// sin esperar a recargar todo. Comparte la API de useApiList (data, loading, error, refetch).
import { useCallback } from 'react';
import { useApiList } from './useApiList.js';

const sameId = (a, b) => String(a) === String(b);

export function useCrudList(key, fetchFn, options) {
  const list = useApiList(key, fetchFn, options);
  const { setData } = list;

  // Reemplaza el elemento con el mismo id o lo agrega al final si es nuevo.
  const upsert = useCallback(
    (item) =>
      setData((current) =>
        current.some((entry) => sameId(entry.id, item.id))
          ? current.map((entry) => (sameId(entry.id, item.id) ? item : entry))
          : [...current, item],
      ),
    [setData],
  );

  const remove = useCallback(
    (id) => setData((current) => current.filter((entry) => !sameId(entry.id, id))),
    [setData],
  );

  return { ...list, upsert, remove };
}
