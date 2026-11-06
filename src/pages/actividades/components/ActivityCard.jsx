// Tarjeta de actividad laboral: ícono de la labor, tipo de pago y acciones.
import { Eye, Pencil, Trash2 } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import CardShell, { CardIdentity } from '#components/shared/CardShell';
import IconBadge from '#components/shared/IconBadge';
import { getActivityIcon } from '../activityIcon.js';

export default function ActivityCard({ activity, onView, onEdit, onDelete }) {
  const isHarvest = Boolean(activity.is_harvest);

  return (
    <CardShell
      actions={
        <CardActionBar
          actions={[
            { label: 'Ver', icon: Eye, onClick: () => onView(activity) },
            { label: 'Editar', icon: Pencil, onClick: () => onEdit(activity) },
            { label: 'Eliminar', icon: Trash2, onClick: () => onDelete(activity), tone: 'danger' },
          ]}
          subject={activity.name}
        />
      }
    >
      <CardIdentity
        badge={<IconBadge icon={getActivityIcon(activity)} tone={isHarvest ? 'harvest' : 'primary'} />}
        title={activity.name}
      >
        <p className="text-sm font-medium text-ink-soft">
          {isHarvest ? 'Recolección, pago por kilo' : 'Labor, pago por jornal'}
        </p>
        {activity.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{activity.description}</p>
        )}
      </CardIdentity>
    </CardShell>
  );
}
