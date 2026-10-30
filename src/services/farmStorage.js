import { guardarLocal } from '#lib/storage';

export function guardarCacheFincasYLotes(userId, farms, lots) {
  guardarLocal(`cafesmart_fincas_${userId}`, farms);
  guardarLocal(`cafesmart_lotes_${userId}`, lots);
}

export function guardarFincaActiva(userId, farmId) {
  try {
    localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(farmId));
  } catch (error) {
    console.error('No se pudo guardar la finca seleccionada:', error);
  }
}
