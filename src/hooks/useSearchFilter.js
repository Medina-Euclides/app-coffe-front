// Filtra una lista por texto de búsqueda sobre los campos indicados.
import { useMemo, useState } from 'react';

export function useSearchFilter(items, getSearchText) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return items;
    return items.filter((item) => getSearchText(item).toLocaleLowerCase().includes(query));
  }, [items, search, getSearchText]);

  return { search, setSearch, filtered };
}
