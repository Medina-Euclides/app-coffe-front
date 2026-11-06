// Tarjeta de actividad laboral: ícono de la labor a la izquierda, datos a la derecha
// y botonera de acciones al pie.
import { createElement } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import { getActivityIcon } from '../activityIcon.js';

export default function ActivityCard({ activity, onView, onEdit, onDelete }) {
  const isHarvest = Boolean(activity.is_harvest);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex min-w-0 items-start gap-4 p-4 sm:p-5">
        <span
          aria-hidden="true"
          className={`flex size-14 shrink-0 items-center justify-center rounded-full ${
            isHarvest
              ? 'bg-[color-mix(in_oklab,var(--cereza),transparent_88%)] text-cereza'
              : 'bg-secondary text-primary'
          }`}
        >
          {createElement(getActivityIcon(activity), {
            className: 'size-6',
            strokeWidth: 1.75,
          })}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="break-words font-heading text-lg font-semibold leading-tight text-foreground">
            {activity.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            {isHarvest ? 'Recolección, pago por kilo' : 'Labor, pago por jornal'}
          </p>
          {activity.description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
              {activity.description}
            </p>
          )}
        </div>
      </div>

      <CardActionBar
        actions={[
          { label: 'Ver', icon: Eye, onClick: () => onView(activity) },
          { label: 'Editar', icon: Pencil, onClick: () => onEdit(activity) },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => onDelete(activity),
            tone: 'danger',
          },
        ]}
        subject={activity.name}
      />
    </article>
  );
}
