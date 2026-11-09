// Carga de datos de Inicio: jornadas (para el resumen) y las demás fuentes de
// «Lo más reciente».
import { mapWorkday } from '#lib/domain/workdays';
import { api } from '#services/api';

// Fuentes extra de «Lo más reciente». Cada una puede fallar sola sin vaciar la lista.
const fuentesRecientes = {
  ventas: () => api.production.sales.list(),
  gastos: () => api.finance.expenses.list(),
  trabajadores: () => api.workers.list(),
  fincas: () => api.farms.list(),
  lotes: () => api.lots.list(),
};

export const cargarParticipaciones = () =>
  api.workdays.list().then((items) => items.flatMap(mapWorkday));

export async function cargarFuentesRecientes() {
  const nombres = Object.keys(fuentesRecientes);
  const resultados = await Promise.allSettled(nombres.map((nombre) => fuentesRecientes[nombre]()));
  return Object.fromEntries(
    nombres.map((nombre, i) => {
      const resultado = resultados[i];
      if (resultado.status === 'rejected') {
        console.error(`Error al cargar ${nombre} para lo más reciente:`, resultado.reason);
      }
      return [nombre, resultado.status === 'fulfilled' ? resultado.value : []];
    }),
  );
}
