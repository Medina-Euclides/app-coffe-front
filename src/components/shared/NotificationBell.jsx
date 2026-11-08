// Campanita de notificaciones: avisa de las jornadas que quedaron abiertas de
// días anteriores y permite cerrarlas desde el modal, sin cambiar de página.
// Los datos llegan de usePendingWorkdays (un solo uso en AppLayout).
import { useState } from 'react';
import { Bell, CheckCheck, LockKeyhole, UsersRound } from 'lucide-react';
import DetailDialog from '#components/shared/DetailDialog';
import IconBadge from '#components/shared/IconBadge';
import { PrimaryAction } from '#components/shared/CardActionBar';
import { FormAlert } from '#components/shared/FormFeedback';
import { getActivityIcon } from '#pages/actividades/activityIcon.js';

const longDate = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function formatDateKey(dateKey) {
  return dateKey ? longDate.format(new Date(`${dateKey}T12:00:00`)) : 'Fecha sin registrar';
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function PendingRow({ workday, showFarm, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const activityNames = workday.activityName.split(', ');
  const workerCount = workday.workerCount ?? workday.participants?.length ?? 0;
  const dateLabel = formatDateKey(workday.dateKey);

  const close = async () => {
    setClosing(true);
    setError('');
    try {
      await onClose(workday);
    } catch (closeError) {
      console.error('Error al cerrar la jornada:', closeError);
      setError(
        closeError.message ||
          'No se pudo cerrar la jornada. Revisa tu conexión e inténtalo de nuevo.',
      );
      setClosing(false);
      setConfirming(false);
    }
  };

  return (
    <li className="space-y-3 py-4 first:pt-1 last:pb-1">
      <div className="flex min-w-0 items-start gap-3">
        <IconBadge
          icon={getActivityIcon({ name: activityNames[0], is_harvest: workday.isHarvest })}
          tone={workday.isHarvest ? 'harvest' : 'primary'}
        />
        <div className="min-w-0 flex-1">
          <p className="break-words font-heading text-lg font-semibold leading-tight text-foreground">
            {activityNames.join(', ')}
          </p>
          <p className="mt-1 text-sm text-ink-soft first-letter:uppercase">{dateLabel}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <UsersRound aria-hidden="true" className="size-4 shrink-0" />
            {plural(workerCount, 'trabajador', 'trabajadores')}
            {showFarm && workday.farmName ? ` · ${workday.farmName}` : ''}
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="space-y-2 rounded-xl bg-muted p-3">
          <p className="text-sm text-ink-soft">
            Después de cerrarla no se podrán agregar ni modificar registros.
          </p>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
            <button
              className="min-h-11 cursor-pointer rounded-xl bg-card px-3 text-sm font-semibold text-ink-soft hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={closing}
              onClick={() => setConfirming(false)}
              type="button"
            >
              No
            </button>
            <PrimaryAction
              ariaLabel={`Sí, cerrar la jornada del ${dateLabel}`}
              icon={LockKeyhole}
              label="Sí, cerrar"
              loading={closing}
              loadingLabel="Cerrando…"
              onClick={close}
            />
          </div>
        </div>
      ) : (
        <PrimaryAction
          ariaLabel={`Cerrar la jornada del ${dateLabel}`}
          icon={LockKeyhole}
          label="Cerrar jornada"
          onClick={() => setConfirming(true)}
        />
      )}

      <FormAlert message={error} onDismiss={() => setError('')} />
    </li>
  );
}

export default function NotificationBell({ pending, onClose, className = '' }) {
  const [open, setOpen] = useState(false);
  const count = pending.length;
  const showFarm = new Set(pending.map((workday) => workday.farmId)).size > 1;

  return (
    <>
      <button
        aria-label={
          count
            ? `Notificaciones: ${plural(count, 'jornada sin cerrar', 'jornadas sin cerrar')}`
            : 'Notificaciones: todo al día'
        }
        className={`relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-muted text-primary transition-colors hover:bg-secondary active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Bell aria-hidden="true" className="size-5" strokeWidth={2.25} />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold leading-none text-white tabular-nums ring-2 ring-card"
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <DetailDialog
          description={
            count
              ? 'Son de días anteriores. Ciérralas cuando termines de registrar el trabajo.'
              : undefined
          }
          onOpenChange={setOpen}
          open
          title={count ? 'Jornadas sin cerrar' : 'Notificaciones'}
        >
          {count ? (
            <ul className="divide-y divide-border/70">
              {pending.map((workday) => (
                <PendingRow
                  key={workday.id}
                  onClose={onClose}
                  showFarm={showFarm}
                  workday={workday}
                />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-4 pt-2 pb-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-leaf-soft text-leaf">
                <CheckCheck aria-hidden="true" className="size-6" />
              </span>
              <p className="mt-3 font-heading text-lg font-semibold text-foreground">Todo al día</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No hay jornadas pendientes por cerrar.
              </p>
            </div>
          )}
        </DetailDialog>
      )}
    </>
  );
}
