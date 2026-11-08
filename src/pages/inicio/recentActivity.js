// «Lo más reciente» de Inicio: todo lo que el productor registró en la semana
// (pesajes, jornadas, ventas, gastos, pagos, trabajadores, fincas y lotes),
// ordenado del más nuevo al más viejo y con la página a la que lleva cada uno.
import {
  Banknote,
  Cherry,
  ClipboardList,
  HandCoins,
  Mountain,
  ReceiptText,
  Sprout,
  UserPlus,
} from 'lucide-react';
import { toDateKey } from '#lib/dates';
import { formatoDinero, formatoKilos, formatoNumero, plural } from '#lib/formatters';
import { getHarvestRecords, groupWorkdayParticipants } from '#lib/domain/workdays';
import { expenseCategoryLabels, kgToArrobas } from '#lib/domain/movements';

const destinos = {
  pesaje: { ruta: '/jornada-laboral', state: { section: 'harvest', period: 'week' } },
  jornada: { ruta: '/jornada-laboral', state: { section: 'workdays', period: 'week' } },
  movimiento: { ruta: '/movimientos-financieros' },
  pago: { ruta: '/pagos-laborales' },
  trabajador: { ruta: '/gestion/trabajadores' },
  finca: { ruta: '/fincas' },
};

// Fecha y hora locales de un created_at (ISO en UTC). Vacío si no hay fecha válida.
function momentoLocal(iso) {
  if (!iso) return { dateKey: '', hora: '' };
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return { dateKey: '', hora: '' };
  const hora = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  return { dateKey: toDateKey(fecha), hora };
}

// Para registros con fecha propia (venta, gasto): la hora sale de created_at
// solo si se creó ese mismo día; si se anotó después, no se inventa una hora.
function fechaConHora(fecha, creadoEn) {
  const dateKey = String(fecha || '').slice(0, 10);
  const creado = momentoLocal(creadoEn);
  return { dateKey, hora: creado.dateKey === dateKey ? creado.hora : '' };
}

const activo = (item) => item.is_active !== false;

export function construirRecientes(
  { participaciones = [], ventas = [], gastos = [], trabajadores = [], fincas = [], lotes = [] },
  semana,
) {
  const enSemana = (item) => item.dateKey >= semana.start && item.dateKey <= semana.end;

  const vigentes = participaciones.filter((p) => p.settlementStatus !== 'anulado' && enSemana(p));
  // Igual que Analíticas: solo pesajes de actividades de recolección.
  const pesajes = getHarvestRecords(vigentes.filter((p) => p.isHarvest));
  const jornadas = groupWorkdayParticipants(vigentes.filter((p) => !p.isPerKilogram));

  const items = [
    ...pesajes.map((pesaje) => ({
      id: `pesaje-${pesaje.id}`,
      icono: Cherry,
      tono: 'harvest',
      titulo: pesaje.workerName,
      detalle: pesaje.lotName,
      valor: `${formatoKilos(pesaje.quantityKg, 1)} kg`,
      dateKey: pesaje.dateKey,
      hora: String(pesaje.time || '').slice(0, 5),
      destino: destinos.pesaje,
    })),
    ...jornadas.map((jornada) => ({
      id: `jornada-${jornada.id}`,
      icono: ClipboardList,
      tono: 'primary',
      titulo: jornada.activityName,
      detalle: jornada.lot || jornada.farmName,
      valor: plural(jornada.workerCount, 'jornal', 'jornales'),
      dateKey: jornada.dateKey,
      hora: '',
      destino: destinos.jornada,
    })),
    ...ventas.filter(activo).map((venta) => {
      const kilos = Number(venta.quantity_kg) || 0;
      return {
        id: `venta-${venta.id}`,
        icono: HandCoins,
        tono: 'income',
        titulo: venta.coffee_type === 'pasilla' ? 'Venta de pasilla' : 'Venta de café pergamino',
        detalle: kilos ? `${formatoNumero(kgToArrobas(kilos))} @ · ${formatoNumero(kilos)} kg` : '',
        valor: `+${formatoDinero(Number(venta.total_amount) || 0)}`,
        ...fechaConHora(venta.sale_date, venta.created_at),
        destino: destinos.movimiento,
      };
    }),
    ...gastos.filter(activo).map((gasto) => {
      const esPago = Boolean(gasto.labor_payment);
      return {
        id: `${esPago ? 'pago' : 'gasto'}-${gasto.id}`,
        icono: esPago ? Banknote : ReceiptText,
        tono: esPago ? 'primary' : 'expense',
        titulo: gasto.concept || (esPago ? 'Pago a trabajador' : 'Gasto'),
        detalle: esPago ? 'Pago laboral' : expenseCategoryLabels[gasto.category] || 'Otros gastos',
        valor: `−${formatoDinero(Number(gasto.amount) || 0)}`,
        ...fechaConHora(gasto.date, gasto.created_at),
        destino: esPago ? destinos.pago : destinos.movimiento,
      };
    }),
    ...trabajadores.map((trabajador) => ({
      id: `trabajador-${trabajador.id}`,
      icono: UserPlus,
      tono: 'primary',
      titulo: trabajador.nombre || 'Trabajador',
      detalle: 'Trabajador nuevo',
      valor: '',
      ...momentoLocal(trabajador.created_at),
      destino: destinos.trabajador,
    })),
    ...fincas.map((finca) => ({
      id: `finca-${finca.id}`,
      icono: Mountain,
      tono: 'primary',
      titulo: finca.nombre || finca.name,
      detalle: 'Finca nueva',
      valor: '',
      ...momentoLocal(finca.created_at),
      destino: destinos.finca,
    })),
    ...lotes.map((lote) => ({
      id: `lote-${lote.id}`,
      icono: Sprout,
      tono: 'primary',
      titulo: lote.nombre || lote.name,
      detalle: lote.farm_name ? `Lote nuevo en ${lote.farm_name}` : 'Lote nuevo',
      valor: '',
      ...momentoLocal(lote.created_at),
      destino: destinos.finca,
    })),
  ];

  return items
    .filter((item) => item.dateKey && enSemana(item))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.hora.localeCompare(a.hora));
}
