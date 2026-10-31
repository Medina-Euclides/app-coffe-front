import { useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Scale,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
});

function formatDate(value) {
  if (!value) return 'Fecha sin registrar';
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatIdentification(value) {
  if (!value) return '';
  return `CC ${value}`;
}

export default function WorkdayCard({ workday }) {
  const [expanded, setExpanded] = useState(false);
  const initials = workday.workerName
    ? workday.workerName.trim().charAt(0).toLocaleUpperCase()
    : '?';
  const activityTypeLabel = workday.isHarvest
    ? `Recolección (${workday.paymentLabel})`
    : `${workday.activityName} (${workday.paymentLabel})`;
  const rateLabel = workday.isPerKilogram
    ? `${currencyFormatter.format(workday.rate)} / kg`
    : `Tarifa fija jornal ${currencyFormatter.format(workday.rate)}`;

  return (
    <Card className="gap-0 rounded-2xl border border-[#e8ebe6] bg-white py-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[#f0f2ef] bg-[#fbfcfa] px-4 py-2.5 sm:px-5">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#748074]">
          {workday.isHarvest ? (
            <Scale aria-hidden="true" className="size-3.5 shrink-0 text-[#329171]" />
          ) : (
            <BriefcaseBusiness
              aria-hidden="true"
              className="size-3.5 shrink-0 text-[#607968]"
            />
          )}
          <span className="font-semibold text-[#315d4d]">{activityTypeLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{rateLabel}</span>
          {workday.lot && (
            <>
              <span aria-hidden="true">·</span>
              <span>Lote {workday.lot}</span>
            </>
          )}
        </p>
        <time
          className="shrink-0 text-xs text-[#858d83]"
          dateTime={workday.dateKey || undefined}
        >
          {formatDate(workday.date)}
        </time>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#173d30] text-sm font-semibold text-white ring-4 ring-[#e8f0e7]"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-[#263b2c]">
              {workday.workerName || 'Trabajador sin nombre'}
            </h2>
            {workday.identification && (
              <p className="mt-0.5 text-[11px] tracking-wide text-[#8a9189]">
                {formatIdentification(workday.identification)}
              </p>
            )}
            <p className="mt-1 text-sm leading-5 text-[#748074]">
              {workday.isHarvest ? (
                workday.weighingCount ? (
                  <>
                    {workday.weighingCount}{' '}
                    {workday.weighingCount === 1 ? 'pesaje' : 'pesajes'} realizados
                    {' · '}
                    <span className="font-semibold text-[#315d4d]">
                      {numberFormatter.format(workday.kgCount)} kg
                    </span>{' '}
                    recolectados
                  </>
                ) : (
                  'Sin pesajes asociados'
                )
              ) : (
                <>{workday.activityName} · Jornada registrada</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#edf0eb] pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
          <div className="text-left sm:min-w-[118px] sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#899489]">
              Total estimado
            </p>
            <p className="text-xl font-bold leading-6 tracking-tight text-[#214b3a]">
              {currencyFormatter.format(workday.totalAmount)}
            </p>
          </div>
          <Button
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Ocultar' : 'Ver'} detalle de jornada de ${workday.workerName || 'trabajador'}`}
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
      </div>

      {expanded && (
        <div className="grid gap-x-6 gap-y-3 border-t border-[#edf0eb] bg-[#fbfcfa] px-4 py-4 text-sm sm:grid-cols-2 sm:px-5">
          <p className="flex items-center gap-2 text-[#68766b]">
            <CalendarDays aria-hidden="true" className="size-4 text-[#79907d]" />
            <span>
              <span className="font-medium text-[#34483a]">Fecha:</span>{' '}
              {formatDate(workday.date)}
            </span>
          </p>
          <p className="flex items-center gap-2 text-[#68766b]">
            <BriefcaseBusiness
              aria-hidden="true"
              className="size-4 text-[#79907d]"
            />
            <span>
              <span className="font-medium text-[#34483a]">Actividad:</span>{' '}
              {workday.activityName}
            </span>
          </p>
          <p className="flex items-center gap-2 text-[#68766b]">
            <span>
              <span className="font-medium text-[#34483a]">Modalidad:</span>{' '}
              {workday.isPerKilogram ? 'Pago por kilogramo' : 'Pago por jornal'}
            </span>
          </p>
          <p className="flex items-center gap-2 text-[#68766b]">
            <span>
              <span className="font-medium text-[#34483a]">Tarifa:</span>{' '}
              {rateLabel}
            </span>
          </p>
          {workday.isHarvest && (
            <p className="flex items-center gap-2 text-[#68766b]">
              <Scale aria-hidden="true" className="size-4 text-[#79907d]" />
              <span>
                <span className="font-medium text-[#34483a]">Recolección:</span>{' '}
                {workday.weighingCount} pesajes ·{' '}
                {numberFormatter.format(workday.kgCount)} kg
              </span>
            </p>
          )}
          {workday.lot && (
            <p className="flex items-center gap-2 text-[#68766b]">
              <span>
                <span className="font-medium text-[#34483a]">Lote:</span>{' '}
                {workday.lot}
              </span>
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
