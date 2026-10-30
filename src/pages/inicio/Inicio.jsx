import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Coffee,
  Sprout,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { leerLocal } from '#lib/storage';
import { formatoDinero, hoy } from '#lib/formatters';

const accionesRapidas = [
  {
    titulo: 'Recolección de café',
    descripcion: 'Registra los kilogramos recolectados por trabajador y lote.',
    ruta: '/operaciones/recoleccion',
    icono: Sprout,
    color: 'bg-emerald-100 text-emerald-800',
  },
  {
    titulo: 'Jornada laboral',
    descripcion: 'Registra una labor por jornal para un trabajador.',
    ruta: '/operaciones/jornadas',
    icono: ClipboardList,
    color: 'bg-sky-100 text-sky-800',
  },
  {
    titulo: 'Registrar egreso',
    descripcion: 'Anota gastos de la finca y pagos de operación.',
    ruta: '/finanzas/registrar-egreso',
    icono: ArrowDownLeft,
    color: 'bg-rose-100 text-rose-800',
  },
  {
    titulo: 'Registrar venta',
    descripcion: 'Registra los kilos vendidos y el valor recibido.',
    ruta: '/finanzas/registrar-venta',
    icono: ArrowUpRight,
    color: 'bg-amber-100 text-amber-800',
  },
];

const formatoCantidad = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', {
    maximumFractionDigits: 2,
  });

const formatoConteoMovimientos = (cantidad) =>
  `${cantidad} ${cantidad === 1 ? 'movimiento' : 'movimientos'}`;

function obtenerResumenDelDia(usuarioId, fechaHoy) {
  const jornadas = leerLocal(`cafesmart_jornadas_${usuarioId}`, []);
  const movimientos = leerLocal(`cafesmart_movimientos_${usuarioId}`, []);

  const jornadasHoy = jornadas.filter((jornada) => jornada.fecha === fechaHoy);
  const movimientosHoy = movimientos.filter(
    (movimiento) => movimiento.fecha === fechaHoy,
  );
  const recolecciones = jornadasHoy.filter(
    (jornada) => jornada.modalidad === 'recoleccion',
  );
  const labores = jornadasHoy.filter((jornada) => jornada.modalidad !== 'recoleccion');
  const ingresos = movimientosHoy.filter(
    (movimiento) =>
      movimiento.tipo === 'ingreso' || movimiento.tipo === 'venta',
  );
  const egresos = movimientosHoy.filter(
    (movimiento) =>
      movimiento.tipo === 'gasto' || movimiento.tipo === 'egreso',
  );

  const actividades = [
    ...jornadasHoy.map((jornada) => ({
      id: `jornada-${jornada.id}`,
      momento: Number(jornada.id) || 0,
      titulo:
        jornada.modalidad === 'recoleccion'
          ? 'Recolección de café'
          : jornada.actividad || 'Jornada laboral',
      detalle:
        jornada.modalidad === 'recoleccion'
          ? Number(jornada.cantidad) > 0
            ? `${formatoCantidad(jornada.cantidad)} kg · ${jornada.lote || 'Lote'}`
            : `${jornada.lote || 'Lote'} · Kilos pendientes de liquidar`
          : `${jornada.lote || 'Lote'} · ${jornada.estado === 'pagado' ? 'Liquidada' : 'Pendiente'}`,
      valor:
        jornada.modalidad === 'recoleccion' && Number(jornada.cantidad) > 0
          ? `${formatoCantidad(jornada.cantidad)} kg`
          : '',
      icono: jornada.modalidad === 'recoleccion' ? Sprout : ClipboardList,
      estilo: 'bg-emerald-100 text-emerald-800',
    })),
    ...movimientosHoy.map((movimiento) => {
      const esIngreso =
        movimiento.tipo === 'ingreso' || movimiento.tipo === 'venta';
      const esVenta =
        esIngreso && movimiento.categoria === 'Venta de café';

      return {
        id: `movimiento-${movimiento.id}`,
        momento: Number(String(movimiento.id).split('-')[0]) || 0,
        titulo: esVenta ? 'Venta de café' : esIngreso ? 'Ingreso' : 'Egreso',
        detalle: movimiento.descripcion || movimiento.categoria || 'Movimiento financiero',
        valor: formatoDinero(movimiento.valor),
        complemento:
          esVenta && Number(movimiento.cantidadKg) > 0
            ? `${formatoCantidad(movimiento.cantidadKg)} kg`
            : '',
        icono: esIngreso ? ArrowUpRight : ArrowDownLeft,
        estilo: esIngreso
          ? 'bg-amber-100 text-amber-800'
          : 'bg-rose-100 text-rose-800',
      };
    }),
  ].sort((a, b) => b.momento - a.momento);

  return {
    recolecciones,
    labores,
    ingresos,
    egresos,
    actividades,
  };
}

export default function Inicio({ usuario }) {
  const fechaHoy = hoy();
  const resumen = obtenerResumenDelDia(usuario?.id || 'default', fechaHoy);
  const fechaLegible = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${fechaHoy}T12:00:00`));

  const ingresosTotales = resumen.ingresos.reduce(
    (total, movimiento) => total + Number(movimiento.valor || 0),
    0,
  );
  const egresosTotales = resumen.egresos.reduce(
    (total, movimiento) => total + Number(movimiento.valor || 0),
    0,
  );
  const indicadores = [
    {
      etiqueta: 'Recolecciones',
      valor: resumen.recolecciones.length,
      detalle: 'registradas hoy',
      estilo: 'text-emerald-800',
      icono: Sprout,
    },
    {
      etiqueta: 'Jornadas',
      valor: resumen.labores.length,
      detalle: 'registradas hoy',
      estilo: 'text-sky-800',
      icono: ClipboardList,
    },
    {
      etiqueta: 'Ingresos',
      valor: formatoDinero(ingresosTotales),
      detalle: formatoConteoMovimientos(resumen.ingresos.length),
      estilo: 'text-amber-800',
      icono: ArrowUpRight,
    },
    {
      etiqueta: 'Egresos',
      valor: formatoDinero(egresosTotales),
      detalle: formatoConteoMovimientos(resumen.egresos.length),
      estilo: 'text-rose-800',
      icono: ArrowDownLeft,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-emerald-700 px-6 py-8 text-white shadow-lg shadow-emerald-950/10 sm:px-9 sm:py-10">
        <p className="text-sm font-semibold tracking-wide text-emerald-100">
          <span translate="no">CafeSmart</span> · OPERACIONES
        </p>
        <h1 className="mt-3 break-words text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Hola, {usuario?.nombreProductor || 'Productor'}
        </h1>
        <p className="mt-3 text-pretty leading-relaxed text-emerald-50">
          Registra las actividades de tu finca y consulta el resumen de hoy.
        </p>
      </header>

      <section aria-labelledby="acciones-rapidas">
        <div className="mb-4">
          <h2
            className="text-xl font-semibold tracking-tight text-slate-900"
            id="acciones-rapidas"
          >
            Accesos rápidos
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Elige una operación para continuar.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {accionesRapidas.map(({ titulo, descripcion, ruta, icono: Icono, color }) => (
            <Link
              className="group min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              key={ruta}
              to={ruta}
            >
              <Card className="h-full rounded-2xl border border-emerald-950/10 bg-white shadow-sm transition-colors hover:border-emerald-800/30 hover:bg-emerald-50/40">
                <CardContent className="flex h-full flex-col items-start p-5">
                  <span
                    aria-hidden="true"
                    className={`flex size-11 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icono className="size-5" />
                  </span>
                  <h3 className="mt-4 break-words font-semibold text-slate-900 group-hover:text-emerald-900">
                    {titulo}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">
                    {descripcion}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="resumen-hoy" className="space-y-4">
        <div>
          <h2
            className="text-xl font-semibold tracking-tight text-slate-900"
            id="resumen-hoy"
          >
            Resumen de hoy
          </h2>
          <p className="mt-1 capitalize text-sm text-slate-600">{fechaLegible}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map(({ etiqueta, valor, detalle, estilo, icono: Icono }) => (
            <Card
              className="min-w-0 rounded-2xl border border-emerald-950/10 bg-white shadow-sm"
              key={etiqueta}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-600">{etiqueta}</p>
                  <Icono aria-hidden="true" className={`size-5 shrink-0 ${estilo}`} />
                </div>
                <p className={`mt-3 break-words text-2xl font-semibold tabular-nums ${estilo}`}>
                  {valor}
                </p>
                <p className="mt-1 text-xs text-slate-500">{detalle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border border-emerald-950/10 bg-white shadow-sm">
          <CardHeader className="px-5 pt-5">
            <CardTitle className="text-base font-semibold text-slate-900">
              Actividad registrada
            </CardTitle>
            <CardDescription>
              Operaciones con fecha de hoy.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {resumen.actividades.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl bg-stone-50 px-5 py-8 text-center">
                <Coffee aria-hidden="true" className="size-8 text-emerald-800" />
                <p className="mt-3 font-medium text-slate-800">
                  Aún no hay operaciones registradas hoy
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Usa los accesos rápidos para agregar la primera.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {resumen.actividades.map(
                  ({ id, titulo, detalle, valor, complemento, icono: Icono, estilo }) => (
                    <li
                      className="flex min-w-0 items-center gap-3 py-4 first:pt-1 last:pb-1"
                      key={id}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${estilo}`}
                      >
                        <Icono className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-slate-900">
                          {titulo}
                        </p>
                        <p className="break-words text-sm text-slate-600">{detalle}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {valor && (
                          <p className="text-sm font-semibold tabular-nums text-slate-900">
                            {valor}
                          </p>
                        )}
                        {complemento && (
                          <p className="text-xs text-slate-500">{complemento}</p>
                        )}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
