// Filtra una lista por texto de búsqueda sobre los campos indicados.
// `getSearchText` debe ser estable (definida fuera del componente o con useCallback).
import { useMemo, useState } from 'react';
import { filterBySearch } from '#lib/utils';

export function useSearchFilter(items, getSearchText) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => filterBySearch(items, search, getSearchText),
    [items, search, getSearchText],
  );

  return { search, setSearch, filtered };
}
