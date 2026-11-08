export { cn } from "cn"

// Suma el valor que devuelve `fn` para cada elemento de la lista.
export function sumBy(list, fn) {
  return (list || []).reduce((total, item) => total + (Number(fn(item)) || 0), 0);
}

// El usuario pidió reducir animaciones en su sistema.
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

// ¿El texto contiene la búsqueda? (sin distinguir mayúsculas; búsqueda vacía = sí).
export function matchesSearch(text, query) {
  const normalized = String(query || '').trim().toLocaleLowerCase();
  return !normalized || String(text || '').toLocaleLowerCase().includes(normalized);
}

// Filtra por texto sobre lo que devuelve `getSearchText` para cada elemento.
export function filterBySearch(items, query, getSearchText) {
  if (!String(query || '').trim()) return items;
  return items.filter((item) => matchesSearch(getSearchText(item), query));
}
