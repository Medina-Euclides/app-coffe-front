export { cn } from "cn"

// Suma el valor que devuelve `fn` para cada elemento de la lista.
export function sumBy(list, fn) {
  return (list || []).reduce((total, item) => total + (Number(fn(item)) || 0), 0);
}

// El usuario pidió reducir animaciones en su sistema.
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
