import { useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Pencil,
  UserPlus,
  Scale,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function formatDate(value) {
  if (!value) return 'Fecha sin registrar';
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getPaymentLabel(workday) {
  if (workday.hasMixedPayment) return 'Modalidad o tarifa variable';
  const mode = workday.isPerKilogram ? 'Kg' : 'Jornal';
  return workday.rate
    ? `${mode} / ${currencyFormatter.format(workday.rate)}${workday.isPerKilogram ? ' por kg' : ''}`
    : mode;
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

  return (
    <Card className="gap-0 rounded-2xl border border-border bg-card py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <time dateTime={workday.dateKey || undefined}>
            {formatDate(workday.date)}
          </time>
        </p>
        <span className="shrink-0 rounded-lg bg-leaf-soft px-3 py-1.5 text-xs font-semibold text-primary">
          {getPaymentLabel(workday)}
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-leaf-soft text-leaf"
        >
          {workday.isHarvest ? (
            <Scale className="size-6" />
          ) : (
            <BriefcaseBusiness className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-foreground">
            {activityNames.join(', ')}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <UsersRound aria-hidden="true" className="size-4 shrink-0" />
            {workerCount} {workerCount === 1 ? 'trabajador asignado' : 'trabajadores asignados'}
          </p>
          {workday.farmName && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Finca {workday.farmName}
            </p>
          )}
        </div>
        <Button
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Ocultar' : 'Ver'} detalles de la jornada`}
          className="h-9 shrink-0 rounded-xl bg-muted px-3 text-xs font-medium text-ink-soft hover:bg-muted"
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
          type="button"
          variant="ghost"
        >
          {expanded ? 'Ocultar' : 'Ver detalle'}
          {expanded ? (
            <ChevronUp aria-hidden="true" className="size-3.5" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-3.5" />
          )}
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-border/60 bg-muted px-4 py-4 sm:px-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-soft">
              Trabajadores
            </h3>
            {participants.length ? (
              <ul className="divide-y divide-border/60">
                {participants.map((participant) => {
                  const isCanceling =
                    busyAction === `cancel:${participant.id}`;
                  const canRemove =
                    workday.status === 'abierta' &&
                    participant.settlementStatus === 'pendiente';
                  return (
                    <li
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                      key={participant.id}
                    >
                      <p className="min-w-0 truncate font-medium text-ink-soft">
                        {participant.workerName || 'Trabajador sin nombre'}
                      </p>
                      {canRemove && (
                        <Button
                          aria-label={`Retirar a ${participant.workerName || 'trabajador'} de la jornada`}
                          className="size-9 shrink-0 rounded-lg text-destructive hover:bg-destructive-soft hover:text-destructive"
                          disabled={Boolean(busyAction)}
                          onClick={() => onCancelParticipation(participant)}
                          title="Retirar trabajador"
                          type="button"
                          variant="ghost"
                        >
                          {isCanceling ? (
                            <LoaderCircle
                              aria-hidden="true"
                              className="size-4 animate-spin"
                            />
                          ) : (
                            <UserRoundX
                              aria-hidden="true"
                              className="size-4"
                            />
                          )}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">
                No hay trabajadores activos en esta jornada.
              </p>
            )}
          </div>

        </div>
      )}
      <div className="border-t border-border/60 px-4 py-3 sm:px-5">
        {workday.status === 'abierta' ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 rounded-xl border border-border bg-tint text-primary hover:bg-secondary"
              disabled={Boolean(busyAction)}
              onClick={() => onAddWorkers(workday)}
              type="button"
              variant="outline"
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Agregar trabajadores
            </Button>
            <Button
              className="flex-1 rounded-xl border border-border bg-card text-ink-soft hover:bg-muted"
              disabled={
                Boolean(busyAction) || workday.editableParticipantCount === 0
              }
              onClick={() => onEdit(workday)}
              type="button"
              variant="outline"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Editar jornada
            </Button>
            <Button
              className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={Boolean(busyAction)}
              onClick={() => onClose(workday)}
              type="button"
            >
              {busyAction === `close:${workday.id}` ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Check aria-hidden="true" className="size-4" />
              )}
              Cerrar jornada
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs font-semibold text-primary">
            Jornada finalizada
          </p>
        )}
      </div>
    </Card>
  );
}
