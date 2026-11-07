// Solo guarda la preferencia de finca seleccionada (no datos: esos viven en IndexedDB).
export function guardarFincaActiva(userId, farmId) {
  try {
    localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(farmId));
  } catch (error) {
    console.error('No se pudo guardar la finca seleccionada:', error);
  }
}
