// Pantalla de inicio: accesos rápidos y resumen de la semana (kilos, jornales y lo reciente).
import NoticeBanner from '#components/shared/NoticeBanner';
import PageTitle from '#components/shared/PageTitle';
import { useApiResource } from '#hooks/useApiResource';
import { useNotice } from '#hooks/useNotice';
import { getWeekRange, toDateKey } from '#lib/dates';
import { formatoFechaLarga, hoy } from '#lib/formatters';
import QuickActions from './components/QuickActions.jsx';
import QuickFormDialogs from './components/QuickFormDialogs.jsx';
import RecentActivity from './components/RecentActivity.jsx';
import WeekSummary from './components/WeekSummary.jsx';
import { cargarFuentesRecientes, cargarParticipaciones } from './fuentesRecientes.js';
import { useQuickForms } from './hooks/useQuickForms.js';
import { construirRecientes } from './recentActivity.js';
import { rangoLegible, resumirSemana } from './weekSummary.js';

export default function Inicio({ usuario }) {
  const { notice, isError, show: mostrarAviso } = useNotice();
  // null mientras carga; la lista viene de la caché local si no hay conexión.
  // Si falla, el resumen se muestra vacío en lugar de quedarse cargando.
  const jornadas = useApiResource('inicio:jornadas', cargarParticipaciones);
  const participaciones = jornadas.loading ? null : (jornadas.data ?? []);
  // Ventas, gastos, trabajadores, fincas y lotes para «Lo más reciente».
  const fuentes = useApiResource('inicio:recientes', cargarFuentesRecientes);
  const forms = useQuickForms({
    userId: usuario?.id || 'default',
    mostrarAviso,
    cargarJornadas: () => jornadas.refetch({ background: true }),
    cargarOtrosRegistros: () => fuentes.refetch({ background: true }),
  });

  const fechaHoy = hoy();
  const semana = getWeekRange(fechaHoy);
  const ayer = new Date(`${fechaHoy}T12:00:00`);
  ayer.setDate(ayer.getDate() - 1);
  const resumen = participaciones ? resumirSemana(participaciones, semana) : null;
  // La lista espera a las jornadas; las demás fuentes se suman cuando llegan.
  const todosRecientes = participaciones
    ? construirRecientes({ participaciones, ...fuentes.data }, semana)
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section aria-labelledby="acciones-rapidas" className="space-y-4">
        <div>
          <p className="text-sm capitalize text-muted-foreground">{formatoFechaLarga(fechaHoy)}</p>
          <PageTitle id="acciones-rapidas">Accesos rápidos</PageTitle>
        </div>
        <QuickActions onOpen={forms.abrir} />
        <NoticeBanner isError={isError} message={notice} />
      </section>

      <section aria-labelledby="resumen-semana" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl text-foreground sm:text-[1.75rem]" id="resumen-semana">
            Esta semana
          </h2>
          <p className="text-sm text-muted-foreground">{rangoLegible(semana)}</p>
        </div>
        <WeekSummary resumen={resumen} />
        <RecentActivity
          fechaAyer={toDateKey(ayer)}
          fechaHoy={fechaHoy}
          rango={rangoLegible(semana)}
          todos={todosRecientes}
        />
      </section>

      <QuickFormDialogs forms={forms} />
    </div>
  );
}
