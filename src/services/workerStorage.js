import { guardarLocal } from '#lib/storage';

export function guardarCacheTrabajadores(userId, workers) {
  guardarLocal(`cafesmart_trabajadores_${userId}`, workers);
}
