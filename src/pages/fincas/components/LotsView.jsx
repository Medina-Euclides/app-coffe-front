// Lotes de la finca abierta: volver a todas las fincas, conteo y tarjetas de lote.
import { ArrowLeft } from 'lucide-react';
import EmptyState from '#components/shared/EmptyState';
import { Button } from '#components/ui/button';
import { plural } from '#lib/formatters';
import LotCard from './LotCard.jsx';

export default function LotsView({ farm, lots, hasLots, onBack, onEdit, onToggleStatus, onView }) {
  return (
    <div className="space-y-5">
      <Button
        className="min-h-11 rounded-lg px-2 text-ink-soft hover:bg-tint hover:text-primary"
        onClick={onBack}
        type="button"
        variant="ghost"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Todas las fincas
      </Button>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl text-ink-soft">Lotes de {farm.nombre}</h2>
        <p className="text-sm text-muted-foreground">{plural(lots.length, 'lote')}</p>
      </div>
      {lots.length === 0 ? (
        <EmptyState
          description={
            hasLots ? 'Prueba con otro nombre o variedad.' : `Agrega el primer lote asociado a ${farm.nombre}.`
          }
          title={hasLots ? 'No encontramos lotes' : 'Esta finca aún no tiene lotes'}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} onEdit={onEdit} onToggleStatus={onToggleStatus} onView={onView} />
          ))}
        </div>
      )}
    </div>
  );
}
