// Tarjeta de jornada: fecha y modalidad en la cabecera, actividad con su ícono,
// detalle de trabajadores en un modal y botonera de acciones.
import { useState } from 'react';
import {
  CalendarDays,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  UserPlus,
  UserRoundX,
  UsersRound,
} from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import CardShell, { CardHeaderStrip, CardIdentity } from '#components/shared/CardShell';
import DetailButton from '#components/shared/DetailButton';
import DetailDialog, { DetailList, InfoField, InfoGrid } from '#components/shared/DetailDialog';
import IconBadge from '#components/shared/IconBadge';
import Tag from '#components/shared/Tag';
import { getActivityIcon } from '#lib/domain/activities';
import { formatoDinero, formatoFechaDia } from '#lib/formatters';

function getPayment(workday) {
  if (workday.hasMixedPayment) {
    return { modality: 'Mixta', rate: 'Tarifas distintas por trabajador' };
  }
  const unit = workday.isPerKilogram ? 'por kilo' : 'por jornal';
  return {
    modality: workday.isPerKilogram ? 'Por kilo' : 'Jornal',
    rate: workday.rate
      ? `${formatoDinero(workday.rate)} ${unit}`
      : 'Tarifa sin registrar',
  };
}

function StatusLine({ isOpen }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={`size-2 rounded-full ${isOpen ? 'bg-leaf' : 'bg-subtle'}`} />
      {isOpen ? 'Abierta' : 'Cerrada'}
    </span>
  );
}

export default function WorkdayCard({
  workday,
  onClose,
  onAddWorkers,
  onEdit,
  onCancelParticipation,
  busyAction,
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const participants = workday.participants || [];
  const workerCount = workday.workerCount ?? participants.length;
  const activityNames = workday.activityName.split(', ');
  const title = activityNames.join(', ');
  const isOpen = workday.status === 'abierta';
  const dateLabel = formatoFechaDia(workday.date);
  const payment = getPayment(workday);
  const badge = (
    <IconBadge
      icon={getActivityIcon({ name: activityNames[0], is_harvest: workday.isHarvest })}
      tone={workday.isHarvest ? 'harvest' : 'primary'}
    />
  );

  return (
    <CardShell
      actions={
        isOpen && (
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
            ]}
            primaryAction={{
              label: 'Cerrar jornada',
              loadingLabel: 'Cerrando…',
              ariaLabel: `Cerrar la jornada del ${dateLabel}`,
              icon: LockKeyhole,
              onClick: () => onClose(workday),
              disabled: Boolean(busyAction),
              loading: busyAction === `close:${workday.id}`,
            }}
            subject="la jornada"
          />
        )
      }
      header={
        <CardHeaderStrip
          aside={<Tag tone={workday.isPerKilogram ? 'harvest' : 'leaf'}>{payment.modality}</Tag>}
          icon={CalendarDays}
        >
          {dateLabel}
        </CardHeaderStrip>
      }
    >
      <CardIdentity badge={badge} title={title}>
        <p className="text-sm font-medium tabular-nums text-ink-soft">{payment.rate}</p>
        <p className="text-sm text-muted-foreground">
          <StatusLine isOpen={isOpen} />
        </p>
      </CardIdentity>

      <DetailButton icon={UsersRound} onClick={() => setDetailOpen(true)}>
        {workerCount} {workerCount === 1 ? 'trabajador' : 'trabajadores'}
      </DetailButton>

      {detailOpen && (
        <DetailDialog
          badge={badge}
          description={dateLabel}
          onOpenChange={setDetailOpen}
          open
          title={title}
        >
          <InfoGrid>
            <InfoField label="Modalidad">{payment.modality}</InfoField>
            <InfoField label="Estado">
              <StatusLine isOpen={isOpen} />
            </InfoField>
            <InfoField label="Pago" wide>
              <span className="tabular-nums">{payment.rate}</span>
            </InfoField>
          </InfoGrid>

          <DetailList empty="No hay trabajadores activos en esta jornada." title="Trabajadores">
            {participants.map((participant) => {
              const isCanceling = busyAction === `cancel:${participant.id}`;
              const canRemove = isOpen && participant.settlementStatus === 'pendiente';
              const workerName = participant.workerName || 'Trabajador sin nombre';
              return (
                <li className="flex min-h-12 items-center justify-between gap-3" key={participant.id}>
                  <span className="min-w-0 truncate font-medium text-foreground">{workerName}</span>
                  {canRemove && (
                    <button
                      aria-label={`Retirar a ${workerName} de la jornada`}
                      className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-destructive-soft px-3 text-sm font-semibold text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={Boolean(busyAction)}
                      onClick={() => onCancelParticipation(participant)}
                      type="button"
                    >
                      {isCanceling ? (
                        <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                      ) : (
                        <UserRoundX aria-hidden="true" className="size-4" />
                      )}
                      Retirar
                    </button>
                  )}
                </li>
              );
            })}
          </DetailList>
        </DetailDialog>
      )}
    </CardShell>
  );
}
