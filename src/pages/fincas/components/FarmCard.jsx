// Tarjeta de finca: ícono, nombre y ubicación, totales de sus lotes y acceso a ellos.
import { Mountain, MapPin, Pencil, Sprout } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import CardStats from '#components/shared/CardStats';
import { formatArea, formatCount, getLotArea, getLotPlants } from '../lotFigures.js';

// Suma solo los lotes que tienen el dato; si ninguno lo tiene, no hay total.
function sumar(lots, leer) {
  const valores = lots.map(leer).filter((valor) => valor !== null);
  return valores.length ? valores.reduce((total, valor) => total + valor, 0) : null;
}

export default function FarmCard({ farm, lots, onOpenLots, onEdit }) {
  const name = farm.nombre || 'Finca sin nombre';

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
          >
            <Mountain className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="break-words font-heading text-lg font-semibold leading-tight text-foreground">
              {name}
            </h2>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              <span className="min-w-0 break-words">
                {farm.ubicacion || 'Sin ubicación'}
              </span>
            </p>
          </div>
        </div>

        <CardStats
          items={[
            { label: lots.length === 1 ? 'lote' : 'lotes', value: formatCount(lots.length) },
            { label: 'área', value: formatArea(sumar(lots, getLotArea)) },
            { label: 'plantas', value: formatCount(sumar(lots, getLotPlants)) },
          ]}
        />
      </div>

      <CardActionBar
        actions={[
          {
            label: 'Ver lotes',
            icon: Sprout,
            onClick: () => onOpenLots(farm),
            tone: 'solid',
            grow: 2,
          },
          { label: 'Editar', icon: Pencil, onClick: () => onEdit(farm) },
        ]}
        subject={`de ${name}`}
      />
    </article>
  );
}
