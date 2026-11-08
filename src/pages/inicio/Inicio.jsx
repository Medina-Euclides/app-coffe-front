// Pantalla de inicio: accesos rápidos y resumen de la semana (kilos, jornales y lo reciente).
import {
  ChevronRight,
  Cherry,
  ClipboardList,
  Coffee,
  HandCoins,
  ReceiptText,
  Scale,
  UserPlus,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import IconBadge from '#components/shared/IconBadge';
import NoticeBanner from '#components/shared/NoticeBanner';
import { useNotice } from '#hooks/useNotice';
import { api } from '#services/api';
import { leerFincaActiva } from '#services/farmStorage';
import { createWorkdayWithWorkers, toExistingWorkdays } from '#pages/workday/workdayActions.js';
import { saveWorkerRequest, validateWorker } from '#pages/trabajadores/workerActions.js';
import {
  getDateKey,
  getHarvestRecords,
  getWeekRange,
  groupWorkdayParticipants,
  mapWorkday,
} from '#pages/workday/utils/workdayMappers.js';
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

// Acciones de menos uso: fila de teclas compactas bajo las principales. El color
// sigue el significado de toda la app (ingreso = leaf, gasto = destructive).
const accionesSecundarias = [
  { titulo: 'Agregar venta', formulario: 'venta', icono: HandCoins, tono: 'income' },
  { titulo: 'Agregar gasto', formulario: 'gasto', icono: ReceiptText, tono: 'expense' },
  { titulo: 'Agregar trabajador', formulario: 'trabajador', icono: UserPlus, tono: 'primary' },
];

const tipoMovimiento = { venta: 'sale', gasto: 'expense' };

// Los formularios se cargan solo cuando se abren, para que Inicio cargue rápido.
// El de movimientos se precarga al pasar o enfocar su botón.
const cargarFormularioMovimiento = () =>
  import('#pages/finance/components/MovementFormDialog.jsx');
const MovementFormDialog = lazy(cargarFormularioMovimiento);
const HarvestRecordFormDialog = lazy(() =>
  import('#pages/workday/components/HarvestRecordFormDialog.jsx'),
);
const WorkdayFormDialog = lazy(() =>
  import('#pages/workday/components/WorkdayFormDialog.jsx'),
);
const WorkerFormDialog = lazy(() =>
  import('#pages/trabajadores/components/WorkerFormDialog.jsx'),
);

const formatoKilos = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const formatoDiaSemana = new Intl.DateTimeFormat('es-CO', { weekday: 'long' });
const formatoDiaMes = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' });

const plural = (n, uno, varios) => `${formatoKilos.format(n)} ${n === 1 ? uno : varios}`;

// «2 – 8 de noviembre» o «30 de octubre – 5 de noviembre».
function rangoLegible({ monday, sunday }) {
  const mismoMes = monday.getMonth() === sunday.getMonth();
  const inicio = mismoMes ? monday.getDate() : formatoDiaMes.format(monday);
  return `${inicio} – ${formatoDiaMes.format(sunday)}`;
}

// «Hoy», «Ayer» o el nombre del día; con hora si el pesaje la tiene.
function cuando(dateKey, hoyKey, ayerKey, hora = '') {
  const dia =
    dateKey === hoyKey
      ? 'Hoy'
      : dateKey === ayerKey
        ? 'Ayer'
        : formatoDiaSemana.format(new Date(`${dateKey}T12:00:00`));
  const hhmm = hora.slice(0, 5);
  return hhmm ? `${dia}, ${hhmm}` : dia;
}

// Kilos, jornales y operaciones recientes de la semana a partir de las jornadas.
function resumirSemana(participaciones, semana) {
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

  const recientes = [
    ...pesajes.map((pesaje) => ({
      id: `pesaje-${pesaje.id}`,
      tipo: 'pesaje',
      titulo: pesaje.workerName,
      detalle: pesaje.lotName,
      valor: `${formatoKilos.format(pesaje.quantityKg)} kg`,
      dateKey: pesaje.dateKey,
      hora: pesaje.time,
    })),
    ...jornadasJornal.map((jornada) => ({
      id: `jornada-${jornada.id}`,
      tipo: 'jornada',
      titulo: jornada.activityName,
      detalle: jornada.lot || jornada.farmName,
      valor: plural(jornada.workerCount, 'jornal', 'jornales'),
      dateKey: jornada.dateKey,
      hora: '',
    })),
  ].sort(
    (a, b) => b.dateKey.localeCompare(a.dateKey) || b.hora.localeCompare(a.hora),
  );

  return {
    kilos: pesajes.reduce((total, pesaje) => total + pesaje.quantityKg, 0),
    pesajes: pesajes.length,
    jornales: jornales.length,
    jornadas: jornadasJornal.length,
    recientes,
  };
}

const MAX_RECIENTES = 5;
const enlaceTarjeta =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export default function Inicio({ usuario }) {
  const userId = usuario?.id || 'default';
  const [formulario, setFormulario] = useState('');
  // null hasta que se abre una venta o un gasto por primera vez.
  const [fincas, setFincas] = useState(null);
  const [jornadasExistentes, setJornadasExistentes] = useState([]);
  // Los trabajadores vienen de la caché de IndexedDB (api.workers.list), no de localStorage.
  const [trabajadores, setTrabajadores] = useState([]);
  const { notice, isError, show: mostrarAviso } = useNotice();
  // null mientras carga; la lista viene de la caché local si no hay conexión.
  const [participaciones, setParticipaciones] = useState(null);

  const cargarJornadas = useCallback(
    () =>
      api.workdays
        .list()
        .then((items) => setParticipaciones(items.flatMap(mapWorkday)))
        .catch((error) => {
          console.error('Error al cargar el resumen de la semana:', error);
          setParticipaciones((actual) => actual ?? []);
        }),
    [],
  );

  useEffect(() => {
    cargarJornadas();
  }, [cargarJornadas]);

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
    if (tipoMovimiento[tipo] && fincas === null) {
      api.farms
        .list()
        .then(setFincas)
        .catch((error) => {
          console.error('Error al cargar fincas:', error);
          setFormulario('');
          mostrarAviso(
            error.message || 'No se pudieron cargar tus fincas. Inténtalo de nuevo.',
            true,
          );
        });
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
    cargarJornadas();
  };

  const guardarPesaje = () => {
    mostrarAviso('El pesaje de recolección se registró correctamente.');
    cargarJornadas();
  };

  const guardarMovimiento = async (payload) => {
    const esVenta = formulario === 'venta';
    try {
      if (esVenta) await api.production.sales.create(payload);
      else await api.finance.expenses.create(payload);
      mostrarAviso(esVenta ? 'Venta registrada.' : 'Gasto registrado.');
      return '';
    } catch (error) {
      console.error('Error al guardar el movimiento:', error);
      return (
        error.message ||
        `No se pudo guardar ${esVenta ? 'la venta' : 'el gasto'}. Revisa tu conexión e inténtalo de nuevo.`
      );
    }
  };

  const guardarTrabajador = async (data) => {
    const errorValidacion = validateWorker(data, trabajadores);
    if (errorValidacion) return errorValidacion;
    try {
      const nuevo = await saveWorkerRequest(data);
      const siguientes = [...trabajadores, nuevo];
      setTrabajadores(siguientes);
      mostrarAviso('Trabajador agregado.');
      return '';
    } catch (error) {
      console.error('Error al guardar el trabajador:', error);
      return error.message || 'No se pudo guardar el trabajador. Inténtalo de nuevo.';
    }
  };

  const fechaHoy = hoy();
  const semana = getWeekRange(fechaHoy);
  const ayer = new Date(`${fechaHoy}T12:00:00`);
  ayer.setDate(ayer.getDate() - 1);
  const fechaAyer = getDateKey(ayer);
  const resumen = participaciones ? resumirSemana(participaciones, semana) : null;
  const fechaLegible = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${fechaHoy}T12:00:00`));

  const indicadores = [
    {
      etiqueta: 'Kilos',
      valor: resumen && formatoKilos.format(resumen.kilos),
      unidad: 'kg',
      detalle: resumen && plural(resumen.pesajes, 'pesaje', 'pesajes'),
      color: 'text-cereza',
      icono: Cherry,
      destino: { section: 'harvest', period: 'week', modality: 'all' },
    },
    {
      etiqueta: 'Jornales',
      valor: resumen && formatoKilos.format(resumen.jornales),
      unidad: '',
      detalle: resumen && `en ${plural(resumen.jornadas, 'jornada', 'jornadas')}`,
      color: 'text-primary',
      icono: ClipboardList,
      destino: { section: 'workdays', period: 'week', modality: 'jornal' },
    },
  ];
  // Solo se preselecciona la finca guardada si sigue existiendo.
  const fincaGuardada = fincas ? leerFincaActiva(userId) : '';
  const fincaActivaValida = fincas?.some((finca) => String(finca.id) === fincaGuardada)
    ? fincaGuardada
    : '';
  const recientes = resumen?.recientes.slice(0, MAX_RECIENTES) ?? [];

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

        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {accionesSecundarias.map(({ titulo, formulario: tipo, icono, tono }) => (
            <button
              className="flex min-h-28 min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-border bg-card px-2 py-3 text-foreground shadow-[0_3px_0_var(--border-strong)] transition-[background-color,box-shadow,translate] duration-100 hover:bg-tint focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-[3px] active:shadow-[0_0_0_var(--border-strong)] motion-reduce:transition-none sm:min-h-20 sm:flex-row sm:gap-3 sm:px-4"
              key={tipo}
              onClick={() => abrirFormulario(tipo)}
              onFocus={tipoMovimiento[tipo] ? cargarFormularioMovimiento : undefined}
              onPointerEnter={tipoMovimiento[tipo] ? cargarFormularioMovimiento : undefined}
              type="button"
            >
              <IconBadge icon={icono} tone={tono} />
              <span className="text-balance text-center font-heading text-base font-semibold leading-tight sm:text-lg">
                {titulo}
              </span>
            </button>
          ))}
        </div>

        <NoticeBanner isError={isError} message={notice} />
      </section>

      <section aria-labelledby="resumen-semana" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl text-foreground sm:text-[1.75rem]" id="resumen-semana">
            Esta semana
          </h2>
          <p className="text-sm text-muted-foreground">{rangoLegible(semana)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {indicadores.map(
            ({ etiqueta, valor, unidad, detalle, color, icono: Icono, destino }) => (
              <Link
                aria-busy={!resumen}
                className={`flex min-h-36 min-w-0 flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-tint active:bg-secondary sm:p-5 ${enlaceTarjeta}`}
                key={etiqueta}
                state={destino}
                to="/jornada-laboral"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icono aria-hidden="true" className={`size-4 shrink-0 ${color}`} />
                  {etiqueta}
                </span>
                <span className={`cifra mt-3 break-words text-4xl leading-none tabular-nums sm:text-5xl ${color}`}>
                  {valor ?? '–'}
                  {unidad && valor != null && (
                    <span className="ml-1 text-lg sm:text-xl">{unidad}</span>
                  )}
                </span>
                <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm text-muted-foreground">
                  <span className="min-w-0 truncate">{detalle ?? 'Cargando…'}</span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                </span>
              </Link>
            ),
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
            <h3 className="text-lg text-foreground">Lo más reciente</h3>
            {resumen && resumen.recientes.length > MAX_RECIENTES && (
              <Link
                className={`-mr-2 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-medium text-primary hover:bg-tint ${enlaceTarjeta}`}
                state={{ period: 'week' }}
                to="/jornada-laboral"
              >
                Ver todo
              </Link>
            )}
          </div>

          {resumen && recientes.length === 0 ? (
            <div className="flex flex-col items-center px-5 pt-6 pb-8 text-center">
              <Coffee aria-hidden="true" className="size-8 text-primary" />
              <p className="mt-3 font-medium text-ink-soft">
                Aún no hay pesajes ni jornadas esta semana
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa los accesos rápidos para registrar el primero.
              </p>
            </div>
          ) : (
            <ul className="px-2 pt-1 pb-2">
              {recientes.map(({ id, tipo, titulo, detalle, valor, dateKey, hora }) => (
                <li key={id}>
                  <Link
                    className={`flex min-h-16 min-w-0 items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-tint active:bg-secondary sm:px-3 ${enlaceTarjeta}`}
                    state={{
                      section: tipo === 'pesaje' ? 'harvest' : 'workdays',
                      period: 'week',
                    }}
                    to="/jornada-laboral"
                  >
                    <IconBadge
                      icon={tipo === 'pesaje' ? Cherry : ClipboardList}
                      tone={tipo === 'pesaje' ? 'harvest' : 'primary'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">
                        {titulo}
                      </span>
                      {detalle && (
                        <span className="block truncate text-sm text-muted-foreground">
                          {detalle}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="cifra block text-base tabular-nums text-foreground">
                        {valor}
                      </span>
                      <span className="block text-sm first-letter:uppercase text-muted-foreground">
                        {cuando(dateKey, fechaHoy, fechaAyer, hora)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

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
        {tipoMovimiento[formulario] && fincas !== null && (
          <MovementFormDialog
            farms={fincas}
            key={formulario}
            onOpenChange={cerrarFormulario}
            onSave={guardarMovimiento}
            open
            selectedFarmId={fincaActivaValida}
            type={tipoMovimiento[formulario]}
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
