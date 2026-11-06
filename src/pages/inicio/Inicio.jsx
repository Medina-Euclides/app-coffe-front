// Pantalla de inicio: accesos rápidos, indicadores y actividad del día.
import {
  Cherry,
  ClipboardList,
  Coffee,
  Scale,
  UserPlus,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import SectionHeader from '#components/shared/SectionHeader';
import IconBadge from '#components/shared/IconBadge';
import NoticeBanner from '#components/shared/NoticeBanner';
import { useNotice } from '#hooks/useNotice';
import { api } from '#services/api';
import { guardarCacheTrabajadores } from '#services/workerStorage';
import { createWorkdayWithWorkers, toExistingWorkdays } from '#pages/workday/workdayActions.js';
import { saveWorkerRequest, validateWorker } from '#pages/trabajadores/workerActions.js';
import { leerLocal } from '#lib/storage';
import { hoy } from '#lib/formatters';
import PageTitle from '#components/shared/PageTitle';

// Las dos acciones del día en campo: botones grandes, uno al lado del otro.
// El borde inferior más oscuro les da relieve de tecla y baja al tocarlos.
const accionesPrincipales = [
  {
    verbo: 'Agregar',
    titulo: 'Pesaje',
    descripcion: 'Kilos por trabajador',
    formulario: 'pesaje',
    icono: Scale,
    estilo:
      'bg-primary [--relieve:color-mix(in_oklab,var(--primary),black_45%)] hover:bg-primary-hover',
    estiloIcono: 'text-primary',
  },
  {
    verbo: 'Agregar',
    titulo: 'Jornada',
    descripcion: 'Labor por jornal',
    formulario: 'jornada',
    icono: ClipboardList,
    estilo:
      'bg-leaf [--relieve:color-mix(in_oklab,var(--leaf),black_40%)] hover:bg-[color-mix(in_oklab,var(--leaf),black_10%)]',
    estiloIcono: 'text-leaf',
  },
];

// Los formularios se cargan solo cuando se abren, para que Inicio cargue rápido.
const HarvestRecordFormDialog = lazy(() =>
  import('#pages/workday/components/HarvestRecordFormDialog.jsx'),
);
const WorkdayFormDialog = lazy(() =>
  import('#pages/workday/components/WorkdayFormDialog.jsx'),
);
const WorkerFormDialog = lazy(() =>
  import('#pages/trabajadores/components/WorkerFormDialog.jsx'),
);

const formatoCantidad = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', {
    maximumFractionDigits: 2,
  });

// Resume las operaciones del usuario para la fecha dada.
// Semana de lunes a domingo que contiene la fecha dada (YYYY-MM-DD).
function obtenerSemana(fecha) {
  const base = new Date(`${fecha}T12:00:00`);
  const diasDesdeLunes = (base.getDay() + 6) % 7;
  const lunes = new Date(base);
  lunes.setDate(base.getDate() - diasDesdeLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const aClave = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { inicio: aClave(lunes), fin: aClave(domingo), lunes, domingo };
}

const formatoDiaCorto = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
});

// Resume las operaciones del usuario registradas en la semana dada.
function obtenerResumenDeLaSemana(usuarioId, semana) {
  const jornadas = leerLocal(`cafesmart_jornadas_${usuarioId}`, []);

  const jornadasSemana = jornadas.filter(
    (jornada) => jornada.fecha >= semana.inicio && jornada.fecha <= semana.fin,
  );
  const recolecciones = jornadasSemana.filter(
    (jornada) => jornada.modalidad === 'recoleccion',
  );
  const labores = jornadasSemana.filter(
    (jornada) => jornada.modalidad !== 'recoleccion',
  );

  const actividades = jornadasSemana.map((jornada) => ({
      id: `jornada-${jornada.id}`,
      fecha: jornada.fecha || '',
      momento: Number(jornada.id) || 0,
      titulo:
        jornada.modalidad === 'recoleccion'
          ? 'Recolección de café'
          : jornada.actividad || 'Jornada laboral',
      detalle:
        jornada.modalidad === 'recoleccion'
          ? Number(jornada.cantidad) > 0
            ? `${formatoCantidad(jornada.cantidad)} kg en ${jornada.lote || 'el lote'}`
            : `${jornada.lote || 'Lote'}, kilos pendientes de liquidar`
          : `${jornada.lote || 'Lote'}, ${jornada.estado === 'pagado' ? 'liquidada' : 'pendiente'}`,
      valor:
        jornada.modalidad === 'recoleccion' && Number(jornada.cantidad) > 0
          ? `${formatoCantidad(jornada.cantidad)} kg`
          : '',
      complemento: jornada.fecha
        ? formatoDiaCorto.format(new Date(`${jornada.fecha}T12:00:00`))
        : '',
      icono: jornada.modalidad === 'recoleccion' ? Cherry : ClipboardList,
      estilo: jornada.modalidad === 'recoleccion' ? 'harvest' : 'primary',
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.momento - a.momento);

  return {
    recolecciones,
    labores,
    actividades,
  };
}

export default function Inicio({ usuario }) {
  const userId = usuario?.id || 'default';
  const [formulario, setFormulario] = useState('');
  const [jornadasExistentes, setJornadasExistentes] = useState([]);
  const [trabajadores, setTrabajadores] = useState(() =>
    leerLocal(`cafesmart_trabajadores_${userId}`, []),
  );
  const { notice, isError, show: mostrarAviso } = useNotice();

  // Abre el formulario sobre Inicio y trae en segundo plano los datos que necesita
  // para validar duplicados.
  const abrirFormulario = (tipo) => {
    mostrarAviso('');
    setFormulario(tipo);
    if (tipo === 'jornada') {
      api.workdays
        .list()
        .then((items) => setJornadasExistentes(toExistingWorkdays(items)))
        .catch((error) => console.error('Error al cargar jornadas:', error));
    }
    if (tipo === 'trabajador') {
      api.workers
        .list()
        .then(setTrabajadores)
        .catch((error) => console.error('Error al cargar trabajadores:', error));
    }
  };

  const cerrarFormulario = (open) => {
    if (!open) setFormulario('');
  };

  const guardarJornada = async (payload, context) => {
    await createWorkdayWithWorkers(payload, context);
    mostrarAviso('La jornada laboral se registró correctamente.');
  };

  const guardarPesaje = () => {
    mostrarAviso('El pesaje de recolección se registró correctamente.');
  };

  const guardarTrabajador = async (data) => {
    const errorValidacion = validateWorker(data, trabajadores);
    if (errorValidacion) return errorValidacion;
    try {
      const nuevo = await saveWorkerRequest(data);
      const siguientes = [...trabajadores, nuevo];
      setTrabajadores(siguientes);
      guardarCacheTrabajadores(userId, siguientes);
      mostrarAviso('Trabajador agregado.');
      return '';
    } catch (error) {
      console.error('Error al guardar el trabajador:', error);
      return error.message || 'No se pudo guardar el trabajador. Inténtalo de nuevo.';
    }
  };

  const fechaHoy = hoy();
  const semana = obtenerSemana(fechaHoy);
  const resumen = obtenerResumenDeLaSemana(userId, semana);
  const formatoDiaMes = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' });
  const rangoSemana = `Del lunes ${formatoDiaMes.format(semana.lunes)} al domingo ${formatoDiaMes.format(semana.domingo)}.`;
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
      detalle: 'registradas esta semana',
      estilo: 'text-cereza',
      icono: Cherry,
    },
    {
      etiqueta: 'Jornadas',
      valor: resumen.labores.length,
      detalle: 'registradas esta semana',
      estilo: 'text-primary',
      icono: ClipboardList,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section aria-labelledby="acciones-rapidas" className="space-y-4">
        <div>
          <p className="text-sm capitalize text-muted-foreground">{fechaLegible}</p>
          <PageTitle id="acciones-rapidas">
            Accesos rápidos
          </PageTitle>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {accionesPrincipales.map(
            ({ verbo, titulo, descripcion, formulario: tipo, icono: Icono, estilo, estiloIcono }) => (
              <button
                className={`flex min-h-40 min-w-0 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl p-4 text-center text-primary-foreground shadow-[0_4px_0_var(--relieve)] transition-[background-color,box-shadow,translate] duration-100 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-[4px] active:shadow-[0_0_0_var(--relieve)] motion-reduce:transition-none sm:min-h-44 ${estilo}`}
                key={tipo}
                onClick={() => abrirFormulario(tipo)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-14 items-center justify-center rounded-full bg-primary-foreground ${estiloIcono}`}
                >
                  <Icono className="size-6" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-balance font-heading text-xl font-semibold leading-tight sm:text-2xl">
                    {verbo} {titulo.toLowerCase()}
                  </span>
                  <span className="mt-1 block text-sm text-primary-foreground/80">
                    {descripcion}
                  </span>
                </span>
              </button>
            ),
          )}

          <button
            className="col-span-2 flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-3xl border border-border bg-card px-4 text-foreground shadow-[0_3px_0_var(--border-strong)] transition-[background-color,box-shadow,translate] duration-100 hover:bg-tint focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-[3px] active:shadow-[0_0_0_var(--border-strong)] motion-reduce:transition-none"
            onClick={() => abrirFormulario('trabajador')}
            type="button"
          >
            <IconBadge icon={UserPlus} />
            <span className="font-heading text-lg font-semibold">
              Agregar trabajador
            </span>
          </button>
        </div>

        <NoticeBanner isError={isError} message={notice} />
      </section>

      <SectionHeader
        title="Resumen de la semana"
        description={rangoSemana}
        headingId="resumen-semana"
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
                <Icono aria-hidden="true" className={`size-4 shrink-0 ${estilo}`} />
              </div>
              <p className={`cifra mt-2 break-words text-5xl leading-none ${estilo}`}>
                {valor}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{detalle}</p>
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
            Operaciones de esta semana, de la más reciente a la más antigua.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {resumen.actividades.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl bg-muted px-5 py-8 text-center">
              <Coffee aria-hidden="true" className="size-8 text-primary" />
              <p className="mt-3 font-medium text-ink-soft">
                Aún no hay operaciones registradas esta semana
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
                    <IconBadge icon={Icono} tone={estilo} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold text-foreground">
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
                        <p className="text-sm text-muted-foreground">{complemento}</p>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        {formulario === 'pesaje' && (
          <HarvestRecordFormDialog
            onOpenChange={cerrarFormulario}
            onSave={guardarPesaje}
            open
          />
        )}
        {formulario === 'jornada' && (
          <WorkdayFormDialog
            existingWorkdays={jornadasExistentes}
            onOpenChange={cerrarFormulario}
            onSave={guardarJornada}
            open
          />
        )}
        {formulario === 'trabajador' && (
          <WorkerFormDialog
            onOpenChange={cerrarFormulario}
            onSave={guardarTrabajador}
            open
          />
        )}
      </Suspense>
    </div>
  );
}
