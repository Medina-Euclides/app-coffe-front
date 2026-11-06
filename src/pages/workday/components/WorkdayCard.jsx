// Tarjeta de jornada: actividad con su ícono, cifras clave (fecha, modalidad y pago),
// trabajadores plegados y botonera de acciones.
import { createElement, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  LoaderCircle,
  Pencil,
  UserPlus,
  UserRoundX,
} from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import { getActivityIcon } from '#pages/actividades/activityIcon.js';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function parseDate(value) {
  if (!value) return null;
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const headerDate = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function getPayment(workday) {
  if (workday.hasMixedPayment) {
    return { modality: 'Mixta', rate: 'Tarifas distintas por trabajador' };
  }
  const unit = workday.isPerKilogram ? 'por kilo' : 'por jornal';
  return {
    modality: workday.isPerKilogram ? 'Por kilo' : 'Jornal',
    rate: workday.rate
      ? `${currencyFormatter.format(workday.rate)} ${unit}`
      : 'Tarifa sin registrar',
  };
}

export default function WorkdayCard({
  workday,
  onClose,
  onAddWorkers,
  onEdit,
  onCancelParticipation,
  busyAction,
}) {
  const [expanded, setExpanded] = useState(false);
  const participants = workday.participants || [];
  const workerCount = workday.workerCount ?? participants.length;
  const activityNames = workday.activityName.split(', ');
  const isOpen = workday.status === 'abierta';
  const date = parseDate(workday.date);
  const payment = getPayment(workday);
  const listId = `jornada-${workday.id}-trabajadores`;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2.5 sm:px-5">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink-soft">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          {date ? (
            <time className="truncate first-letter:uppercase" dateTime={workday.dateKey || undefined}>
              {headerDate.format(date)}
            </time>
          ) : (
            <span>Fecha sin registrar</span>
          )}
        </p>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            workday.isPerKilogram
              ? 'bg-[color-mix(in_oklab,var(--cereza),transparent_88%)] text-cereza'
              : 'bg-leaf-soft text-leaf'
          }`}
        >
          {payment.modality}
        </span>
      </header>

      <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className={`flex size-14 shrink-0 items-center justify-center rounded-full ${
              workday.isHarvest
                ? 'bg-[color-mix(in_oklab,var(--cereza),transparent_88%)] text-cereza'
                : 'bg-secondary text-primary'
            }`}
          >
            {createElement(
              getActivityIcon({ name: activityNames[0], is_harvest: workday.isHarvest }),
              { className: 'size-6', strokeWidth: 1.75 },
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="break-words font-heading text-lg font-semibold leading-tight text-foreground">
              {activityNames.join(', ')}
            </h2>
            <p className="mt-1 text-sm font-medium tabular-nums text-ink-soft">
              {payment.rate}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${isOpen ? 'bg-leaf' : 'bg-subtle'}`}
              />
              {isOpen ? 'Abierta' : 'Cerrada'}
            </p>
          </div>
        </div>

        <div>
          <button
            aria-controls={listId}
            aria-expanded={expanded}
            className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-1 text-sm font-medium text-ink-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            <span>
              {workerCount} {workerCount === 1 ? 'trabajador' : 'trabajadores'}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {expanded && (
            <ul className="mt-1 divide-y divide-border/70 rounded-xl bg-muted px-3" id={listId}>
              {participants.length ? (
                participants.map((participant) => {
                  const isCanceling = busyAction === `cancel:${participant.id}`;
                  const canRemove =
                    isOpen && participant.settlementStatus === 'pendiente';
                  const workerName = participant.workerName || 'Trabajador sin nombre';
                  return (
                    <li
                      className="flex min-h-11 items-center justify-between gap-3 text-sm"
                      key={participant.id}
                    >
                      <span className="min-w-0 truncate text-ink-soft">{workerName}</span>
                      {canRemove && (
                        <button
                          aria-label={`Retirar a ${workerName} de la jornada`}
                          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-destructive hover:bg-destructive-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={Boolean(busyAction)}
                          onClick={() => onCancelParticipation(participant)}
                          title="Retirar de la jornada"
                          type="button"
                        >
                          {isCanceling ? (
                            <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                          ) : (
                            <UserRoundX aria-hidden="true" className="size-4" />
                          )}
                        </button>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="py-3 text-sm text-muted-foreground">
                  No hay trabajadores activos en esta jornada.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {isOpen && (
        <CardActionBar
          actions={[
            {
              label: 'Agregar',
              ariaLabel: 'Agregar trabajadores a la jornada',
              icon: UserPlus,
              onClick: () => onAddWorkers(workday),
              disabled: Boolean(busyAction),
            },
            {
              label: 'Editar',
              icon: Pencil,
              onClick: () => onEdit(workday),
              disabled: Boolean(busyAction) || workday.editableParticipantCount === 0,
            },
            {
              label: 'Cerrar',
              icon: Check,
              onClick: () => onClose(workday),
              tone: 'solid',
              disabled: Boolean(busyAction),
              loading: busyAction === `close:${workday.id}`,
            },
          ]}
          subject="la jornada"
        />
      )}
    </article>
  );
}
