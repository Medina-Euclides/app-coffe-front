// Tarjeta de trabajador: avatar con iniciales a la izquierda, datos a la derecha
// y botonera de acciones al pie, pensada para tocar con el dedo en el campo.
import { Eye, IdCard, Pencil, Phone, Power } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import { getWorkerDisplayName } from '../workerActions.js';

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

export default function WorkerCard({ worker, onView, onEdit, onToggleStatus }) {
  const isActive = worker.is_active !== false;
  const name = getWorkerDisplayName(worker);
  const phoneHref = worker.phone
    ? `tel:${String(worker.phone).replace(/[^\d+]/g, '')}`
    : '';

  const actions = [
    { label: 'Ver', icon: Eye, onClick: onView, },
    { label: 'Editar', icon: Pencil, onClick: onEdit, },
    {
      label: isActive ? 'Desactivar' : 'Activar',
      icon: Power,
      onClick: onToggleStatus,
      tone: isActive ? 'danger' : 'success',
    },
  ];

  return (
    <article
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card ${
        isActive ? 'border-border' : 'border-dashed border-border-strong'
      }`}
    >
      <div className="flex min-w-0 items-start gap-4 p-4 sm:p-5">
        <span className="relative shrink-0" aria-hidden="true">
          <span
            className={`flex size-14 items-center justify-center rounded-full font-heading text-lg font-bold ${
              isActive
                ? 'bg-secondary text-primary'
                : 'bg-muted text-subtle'
            }`}
          >
            {getInitials(name)}
          </span>
          {isActive && (
            <span className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-card bg-leaf" />
          )}
        </span>

        <div className="min-w-0 flex-1">
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

          <dl className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <dt>
                <IdCard aria-hidden="true" className="size-4 shrink-0" />
                <span className="sr-only">Identificación</span>
              </dt>
              <dd className="min-w-0 break-words">
                {worker.identification || 'Sin identificación'}
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <dt>
                <Phone aria-hidden="true" className="size-4 shrink-0" />
                <span className="sr-only">Teléfono</span>
              </dt>
              <dd className="min-w-0 break-words">
                {worker.phone ? (
                  <a
                    className="font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    href={phoneHref}
                  >
                    {worker.phone}
                  </a>
                ) : (
                  'Sin teléfono'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <CardActionBar
        actions={actions.map((action) => ({
          ...action,
          onClick: () => action.onClick(worker),
        }))}
        subject={`a ${name}`}
      />
    </article>
  );
}
