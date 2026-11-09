// Resumen de la semana en Inicio: rango legible, «Hoy/Ayer/día» y kilos y jornales.
import { getHarvestRecords, groupWorkdayParticipants } from '#lib/domain/workdays';
import { sumBy } from '#lib/utils';

const formatoDiaSemana = new Intl.DateTimeFormat('es-CO', { weekday: 'long' });
const formatoDiaMes = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' });

// «2 – 8 de noviembre» o «30 de octubre – 5 de noviembre».
export function rangoLegible({ monday, sunday }) {
  const mismoMes = monday.getMonth() === sunday.getMonth();
  const inicio = mismoMes ? monday.getDate() : formatoDiaMes.format(monday);
  return `${inicio} – ${formatoDiaMes.format(sunday)}`;
}

// «Hoy», «Ayer» o el nombre del día; con hora si el pesaje la tiene.
export function cuando(dateKey, hoyKey, ayerKey, hora = '') {
  const dia =
    dateKey === hoyKey
      ? 'Hoy'
      : dateKey === ayerKey
        ? 'Ayer'
        : formatoDiaSemana.format(new Date(`${dateKey}T12:00:00`));
  const hhmm = hora.slice(0, 5);
  return hhmm ? `${dia}, ${hhmm}` : dia;
}

// Kilos y jornales de la semana a partir de las jornadas.
export function resumirSemana(participaciones, semana) {
  const enSemana = participaciones.filter(
    (p) =>
      p.settlementStatus !== 'anulado' &&
      p.dateKey >= semana.start &&
      p.dateKey <= semana.end,
  );
  // Igual que Analíticas: solo pesajes de actividades de recolección.
  const pesajes = getHarvestRecords(enSemana.filter((p) => p.isHarvest));
  const jornales = enSemana.filter((p) => !p.isPerKilogram);
  const jornadasJornal = groupWorkdayParticipants(jornales);

  return {
    kilos: sumBy(pesajes, (pesaje) => pesaje.quantityKg),
    pesajes: pesajes.length,
    jornales: jornales.length,
    jornadas: jornadasJornal.length,
  };
}
