import { leerLocal, guardarLocal } from '#lib/storage';

const RECOLECCION_DEFAULT = 'Recolección de café';

export function cargarCacheActividades(userId) {
  const cached = leerLocal(`cafesmart_actividades_${userId}`, []);
  if (!Array.isArray(cached)) return [];

  return cached
    .map((activity) => {
      if (typeof activity === 'string') {
        return {
          id: null,
          name: activity,
          description: '',
          is_harvest: activity === RECOLECCION_DEFAULT,
        };
      }
      if (!activity || typeof activity.name !== 'string') return null;
      return {
        ...activity,
        description: activity.description || '',
        is_harvest: Boolean(activity.is_harvest),
      };
    })
    .filter(Boolean);
}

export function guardarCacheActividades(userId, activities) {
  guardarLocal(`cafesmart_actividades_${userId}`, activities);
}
