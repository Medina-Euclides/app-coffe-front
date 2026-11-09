// Tarjetas de finca (con el resumen de sus lotes), o el estado vacío o de error.
import { useMemo } from 'react';
import EmptyState from '#components/shared/EmptyState';
import ErrorBanner from '#components/shared/ErrorBanner';
import FarmCard from './FarmCard.jsx';

export default function FarmsView({ farms, allFarmsCount, lots, loadError, onRetry, onEdit, onOpenLots }) {
  // Agrupa lotes por fincaId una sola vez (O(n)) en lugar de filtrar por cada finca (O(n·m)).
  const lotsByFarm = useMemo(() => {
    const map = new Map();
    for (const lot of lots) {
      const key = String(lot.fincaId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(lot);
    }
    return map;
  }, [lots]);

  if (farms.length === 0) {
    if (loadError) {
      return <ErrorBanner message="No se pudieron consultar las fincas y lotes." onRetry={onRetry} />;
    }
    return (
      <EmptyState
        description={
          allFarmsCount
            ? 'Prueba con otro nombre de finca.'
            : 'Registra tus fincas para comenzar a organizar sus lotes.'
        }
        title={allFarmsCount ? 'No encontramos fincas' : 'Aún no hay fincas'}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 [[content-visibility:auto]]">
      {farms.map((farm) => (
        <FarmCard
          farm={farm}
          key={farm.id}
          lots={lotsByFarm.get(String(farm.id)) || []}
          onEdit={onEdit}
          onOpenLots={onOpenLots}
        />
      ))}
    </div>
  );
}
