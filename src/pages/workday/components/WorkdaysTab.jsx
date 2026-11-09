// Pestaña de jornadas: tarjetas de jornada, o el estado de carga o vacío.
import { ClipboardList } from 'lucide-react';
import EmptyState from '#components/shared/EmptyState';
import LoadingState from '#components/shared/LoadingState';
import WorkdayCard from './WorkdayCard.jsx';

export default function WorkdaysTab({
  loading,
  loadError,
  hasWorkdays,
  workdays,
  busyAction,
  onAddWorkers,
  onCancelParticipation,
  onClose,
  onEdit,
}) {
  if (loading) return <LoadingState boxed>Cargando jornadas laborales…</LoadingState>;
  if (!workdays.length) {
    return (
      <EmptyState
        description={
          loadError ||
          (hasWorkdays
            ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
            : 'Cuando registres una jornada, aquí podrás consultar su actividad, tarifa y valor estimado.')
        }
        icon={ClipboardList}
        title={
          loadError
            ? 'No se pudieron cargar las jornadas'
            : hasWorkdays
              ? 'No hay resultados para estos filtros'
              : 'Aún no hay jornadas laborales'
        }
      />
    );
  }
  return (
    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {workdays.map((workday) => (
        <WorkdayCard
          busyAction={busyAction}
          key={workday.id}
          onAddWorkers={() => onAddWorkers(workday)}
          onCancelParticipation={onCancelParticipation}
          onClose={onClose}
          onEdit={() => onEdit(workday)}
          workday={workday}
        />
      ))}
    </div>
  );
}
