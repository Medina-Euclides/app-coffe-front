// Tarjeta de trabajador: iniciales, cédula y teléfono (toca y llama), y acciones.
import { Eye, IdCard, Pencil, Phone, Power } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import CardShell, { CardIdentity } from '#components/shared/CardShell';
import IconBadge from '#components/shared/IconBadge';
import MetaLine from '#components/shared/MetaLine';
import Tag from '#components/shared/Tag';
import { getWorkerDisplayName } from '../workerActions.js';

export default function WorkerCard({ worker, onView, onEdit, onToggleStatus }) {
  const isActive = worker.is_active !== false;
  const name = getWorkerDisplayName(worker);
  const phoneHref = worker.phone
    ? `tel:${String(worker.phone).replace(/[^\d+]/g, '')}`
    : '';

  return (
    <CardShell
      actions={
        <CardActionBar
          actions={[
            { label: 'Ver', icon: Eye, onClick: () => onView(worker) },
            { label: 'Editar', icon: Pencil, onClick: () => onEdit(worker) },
            {
              label: isActive ? 'Desactivar' : 'Activar',
              icon: Power,
              onClick: () => onToggleStatus(worker),
              tone: isActive ? 'danger' : 'success',
            },
          ]}
          subject={`a ${name}`}
        />
      }
      muted={!isActive}
    >
      <CardIdentity
        badge={<IconBadge name={name} online={isActive} tone={isActive ? 'primary' : 'muted'} />}
        muted={!isActive}
        title={name}
        titleAddon={!isActive && <Tag>Inactivo</Tag>}
      >
        <MetaLine icon={IdCard} label="Identificación">
          {worker.identification || 'Sin identificación'}
        </MetaLine>
        <MetaLine icon={Phone} label="Teléfono">
          {worker.phone ? (
            <a
              className="inline-flex min-h-8 items-center font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={phoneHref}
            >
              {worker.phone}
            </a>
          ) : (
            'Sin teléfono'
          )}
        </MetaLine>
      </CardIdentity>
    </CardShell>
  );
}
