// Solo guarda la preferencia de finca seleccionada (no datos: esos viven en IndexedDB).
export function guardarFincaActiva(userId, farmId) {
  try {
    localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(farmId));
  } catch (error) {
    console.error('No se pudo guardar la finca seleccionada:', error);
  }
}

// Finca elegida la última vez (o '' si no hay o el almacenamiento está bloqueado).
export function leerFincaActiva(userId) {
  try {
    return localStorage.getItem(`cafesmart_finca_activa_${userId}`) || '';
  } catch {
    return '';
  }
}
