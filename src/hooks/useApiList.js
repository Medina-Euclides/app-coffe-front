// Carga una lista desde la API: data, loading, error, refetch.
// La copia local vive solo en IndexedDB (api.*.list usa cachedList); aquí no se guarda
// otra copia en localStorage para no duplicar información.
import { useApiResource } from './useApiResource.js';

const EMPTY = [];

export function useApiList(key, fetchFn, options) {
  return useApiResource(key, fetchFn, { initialData: EMPTY, ...options });
}
