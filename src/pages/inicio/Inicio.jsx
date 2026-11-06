// Pantalla de inicio: saludo, accesos rápidos, indicadores y actividad del día.
import {
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
import SectionHeader from '#components/shared/SectionHeader';
import MaduracionStripe from '#components/shared/MaduracionStripe';
import { leerLocal } from '#lib/storage';
import { hoy } from '#lib/formatters';

const accionesRapidas = [
  {
    titulo: 'Recolección de café',
    descripcion: 'Registra los kilogramos recolectados por trabajador y lote.',
    ruta: '/operaciones/recoleccion',
    icono: Sprout,
    color: 'bg-secondary text-primary',
  },
  {
    titulo: 'Jornada laboral',
    descripcion: 'Registra una labor por jornal para un trabajador.',
    ruta: '/operaciones/jornadas',
    icono: ClipboardList,
    color: 'bg-warning-soft text-warning',
  },
];

const formatoCantidad = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', {
    maximumFractionDigits: 2,
  });

// Resume las operaciones del usuario para la fecha dada.
function obtenerResumenDelDia(usuarioId, fechaHoy) {
  const jornadas = leerLocal(`cafesmart_jornadas_${usuarioId}`, []);

  const jornadasHoy = jornadas.filter((jornada) => jornada.fecha === fechaHoy);
  const recolecciones = jornadasHoy.filter(
    (jornada) => jornada.modalidad === 'recoleccion',
  );
  const labores = jornadasHoy.filter(
    (jornada) => jornada.modalidad !== 'recoleccion',
  );

  const actividades = jornadasHoy.map((jornada) => ({
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
      estilo: 'bg-secondary text-primary',
    }))
    .sort((a, b) => b.momento - a.momento);

  return {
    recolecciones,
    labores,
    actividades,
  };
}

export default function Inicio({ usuario }) {
  const nombreProductor =
    usuario?.full_name ||
    [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') ||
    'Productor';
  const fechaHoy = hoy();
  const resumen = obtenerResumenDelDia(usuario?.id || 'default', fechaHoy);
  const fechaLegible = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${fechaHoy}T12:00:00`));

  const indicadores = [
    {
      etiqueta: 'Recolecciones',
      valor: resumen.recolecciones.length,
      detalle: 'registradas hoy',
      estilo: 'text-primary',
      icono: Sprout,
    },
    {
      etiqueta: 'Jornadas',
      valor: resumen.labores.length,
      detalle: 'registradas hoy',
      estilo: 'text-warning',
      icono: ClipboardList,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
        <div className="px-6 pt-7 pb-8 sm:px-9 sm:pt-9 sm:pb-10">
          <p className="text-sm capitalize text-primary-foreground/75">
            {fechaLegible}
          </p>
          <h1 className="mt-2 break-words text-[2.5rem] leading-[1.02] sm:text-6xl">
            Hola, {nombreProductor}
          </h1>
          <p className="mt-4 max-w-[52ch] text-pretty leading-relaxed text-primary-foreground/85">
            Registra las actividades de tu finca y consulta el resumen de hoy.
          </p>
        </div>
        <MaduracionStripe />
      </header>

      <SectionHeader
        title="Accesos rápidos"
        description="Elige una operación para continuar."
        headingId="acciones-rapidas"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {accionesRapidas.map(({ titulo, descripcion, ruta, icono: Icono, color }) => (
          <Link
            className="group min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            key={ruta}
            to={ruta}
          >
            <Card className="h-full rounded-2xl border border-border bg-card shadow-none transition-colors hover:border-primary/40 hover:bg-tint">
              <CardContent className="flex h-full flex-col items-start p-5">
                <span
                  aria-hidden="true"
                  className={`flex size-11 items-center justify-center rounded-xl ${color}`}
                >
                  <Icono className="size-5" />
                </span>
                <h3 className="mt-4 break-words font-semibold text-lg text-foreground group-hover:text-primary">
                  {titulo}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {descripcion}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <SectionHeader
        title="Resumen de hoy"
        description="Totales registrados con fecha de hoy."
        headingId="resumen-hoy"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {indicadores.map(({ etiqueta, valor, detalle, estilo, icono: Icono }) => (
          <Card
            className="min-w-0 rounded-2xl border border-border bg-card shadow-none"
            key={etiqueta}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{etiqueta}</p>
                <Icono aria-hidden="true" className={`size-5 shrink-0 ${estilo}`} />
              </div>
              <p className={`cifra mt-2 break-words text-5xl leading-none ${estilo}`}>
                {valor}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="text-lg text-foreground">
            Actividad registrada
          </CardTitle>
          <CardDescription>
            Operaciones con fecha de hoy.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {resumen.actividades.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-muted px-5 py-8 text-center">
              <Coffee aria-hidden="true" className="size-8 text-primary" />
              <p className="mt-3 font-medium text-ink-soft">
                Aún no hay operaciones registradas hoy
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa los accesos rápidos para agregar la primera.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
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
                      <p className="break-words text-sm font-semibold text-foreground">
                        {titulo}
                      </p>
                      <p className="break-words text-sm text-muted-foreground">{detalle}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {valor && (
                        <p className="cifra text-base text-foreground">
                          {valor}
                        </p>
                      )}
                      {complemento && (
                        <p className="text-xs text-muted-foreground">{complemento}</p>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
