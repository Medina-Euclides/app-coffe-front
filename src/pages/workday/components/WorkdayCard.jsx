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
    <Card className="gap-0 rounded-2xl border border-[#e8ebe6] bg-white py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f2ef] px-4 py-3 sm:px-5">
        <p className="flex min-w-0 items-center gap-2 text-sm text-[#748074]">
          <CalendarDays
            aria-hidden="true"
            className="size-4 shrink-0 text-[#74877a]"
          />
          <time dateTime={workday.dateKey || undefined}>
            {formatDate(workday.date)}
          </time>
        </p>
        <span className="shrink-0 rounded-lg bg-[#e8f3ee] px-3 py-1.5 text-xs font-semibold text-[#315d4d]">
          {getPaymentLabel(workday)}
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#eaf8f1] text-[#25866a]"
        >
          {workday.isHarvest ? (
            <Scale className="size-6" />
          ) : (
            <BriefcaseBusiness className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-[#263b2c]">
            {activityNames.join(', ')}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#52655a]">
            <UsersRound aria-hidden="true" className="size-4 shrink-0" />
            {workerCount} {workerCount === 1 ? 'trabajador asignado' : 'trabajadores asignados'}
          </p>
          {workday.farmName && (
            <p className="mt-1 truncate text-xs text-[#899489]">
              Finca {workday.farmName}
            </p>
          )}
        </div>
        <Button
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Ocultar' : 'Ver'} detalles de la jornada`}
          className="h-9 shrink-0 rounded-xl bg-[#f4f6f3] px-3 text-xs font-medium text-[#3e5848] hover:bg-[#eaf0e8]"
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
        <div className="border-t border-[#edf0eb] bg-[#fbfcfa] px-4 py-4 sm:px-5">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#34483a]">
              Trabajadores
            </h3>
            {participants.length ? (
              <ul className="divide-y divide-[#edf0eb]">
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
                      <p className="min-w-0 truncate font-medium text-[#34483a]">
                        {participant.workerName || 'Trabajador sin nombre'}
                      </p>
                      {canRemove && (
                        <Button
                          aria-label={`Retirar a ${participant.workerName || 'trabajador'} de la jornada`}
                          className="size-9 shrink-0 rounded-lg text-[#a94c45] hover:bg-red-50 hover:text-red-700"
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
              <p className="py-2 text-sm text-[#748074]">
                No hay trabajadores activos en esta jornada.
              </p>
            )}
          </div>

        </div>
      )}
      <div className="border-t border-[#edf0eb] px-4 py-3 sm:px-5">
        {workday.status === 'abierta' ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 rounded-xl border border-[#dbe9dc] bg-[#e8f3e8] text-[#254d37] hover:bg-[#dcebdc]"
              disabled={Boolean(busyAction)}
              onClick={() => onAddWorkers(workday)}
              type="button"
              variant="outline"
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Agregar trabajadores
            </Button>
            <Button
              className="flex-1 rounded-xl border border-[#e1e8e0] bg-white text-[#52655a] hover:bg-[#f4f6f3]"
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
              className="flex-1 rounded-xl bg-[#173d30] text-white hover:bg-[#214b32]"
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
          <p className="text-center text-xs font-semibold text-[#315d4d]">
            Jornada finalizada
          </p>
        )}
      </div>
    </Card>
  );
}
