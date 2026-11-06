// Tarjeta de lote: ícono, nombre y variedad, cifras del cultivo y acciones.
import { Eye, Pencil, Power, Sprout } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import CardStats from '#components/shared/CardStats';
import { formatArea, formatCount, getLotArea, getLotPlants } from '../lotFigures.js';

export default function LotCard({ lot, onView, onEdit, onToggleStatus }) {
  const isActive = lot.estado !== 'inactivo';
  const name = lot.nombre || 'Lote sin nombre';
  const area = getLotArea(lot);
  const plants = getLotPlants(lot);
  const density = area && plants !== null ? plants / area : null;
  const variety = lot.variedad || lot.variety;

  return (
    <article
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card ${
        isActive ? 'border-border' : 'border-dashed border-border-strong'
      }`}
    >
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className={`flex size-14 shrink-0 items-center justify-center rounded-full ${
              isActive ? 'bg-secondary text-primary' : 'bg-muted text-subtle'
            }`}
          >
            <Sprout className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h2
                className={`min-w-0 break-words font-heading text-lg font-semibold leading-tight ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {name}
              </h2>
              {!isActive && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Inactivo
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {variety || 'Variedad sin registrar'}
            </p>
          </div>
        </div>

        <CardStats
          items={[
            { label: 'área', value: formatArea(area) },
            { label: 'plantas', value: formatCount(plants) },
            { label: 'plantas por ha', value: formatCount(density) },
          ]}
        />
      </div>

      <CardActionBar
        actions={[
          { label: 'Ver', icon: Eye, onClick: () => onView(lot) },
          { label: 'Editar', icon: Pencil, onClick: () => onEdit(lot) },
          {
            label: isActive ? 'Desactivar' : 'Activar',
            icon: Power,
            onClick: () => onToggleStatus(lot),
            tone: isActive ? 'danger' : 'success',
          },
        ]}
        subject={name}
      />
    </article>
  );
}
