// Pestaña de recolección: kilos por trabajador en el periodo, o el estado de carga o vacío.
import { useMemo } from 'react';
import { Search } from 'lucide-react';
import EmptyState from '#components/shared/EmptyState';
import LoadingState from '#components/shared/LoadingState';
import { groupHarvestRecords } from '#lib/domain/workdays';
import HarvestWorkerCard from './HarvestWorkerCard.jsx';

export default function HarvestTab({ loading, loadError, hasRecords, records, periodLabel }) {
  const workers = useMemo(() => groupHarvestRecords(records), [records]);

  if (loading) return <LoadingState boxed>Cargando registros de recolección…</LoadingState>;
  if (!records.length) {
    return (
      <EmptyState
        description={
          loadError ||
          (hasRecords
            ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
            : 'Los pesajes registrados aparecerán aquí con su trabajador, lote, fecha y hora.')
        }
        icon={Search}
        title={
          loadError
            ? 'No se pudieron cargar los pesajes'
            : hasRecords
              ? 'No hay pesajes para estos filtros'
              : 'Aún no hay registros de recolección'
        }
      />
    );
  }
  return (
    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {workers.map((worker) => (
        <HarvestWorkerCard key={worker.workerId} periodLabel={periodLabel} worker={worker} />
      ))}
    </div>
  );
}
