// Tarjetas de finca (con el resumen de sus lotes), o el estado vacío o de error.
import EmptyState from '#components/shared/EmptyState';
import ErrorBanner from '#components/shared/ErrorBanner';
import FarmCard from './FarmCard.jsx';

export default function FarmsView({ farms, allFarmsCount, lots, loadError, onRetry, onEdit, onOpenLots }) {
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {farms.map((farm) => (
        <FarmCard
          farm={farm}
          key={farm.id}
          lots={lots.filter((lot) => String(lot.fincaId) === String(farm.id))}
          onEdit={onEdit}
          onOpenLots={onOpenLots}
        />
      ))}
    </div>
  );
}
