// Tarjeta de lote: variedad, cifras del cultivo y acciones.
import { Eye, Pencil, Power, Sprout } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import CardShell, { CardIdentity } from '#components/shared/CardShell';
import CardStats from '#components/shared/CardStats';
import IconBadge from '#components/shared/IconBadge';
import Tag from '#components/shared/Tag';
import { formatArea, formatCount, getLotArea, getLotPlants } from '../lotFigures.js';

export default function LotCard({ lot, onView, onEdit, onToggleStatus }) {
  const isActive = lot.estado !== 'inactivo';
  const name = lot.nombre || 'Lote sin nombre';
  const area = getLotArea(lot);
  const plants = getLotPlants(lot);
  const density = area && plants !== null ? plants / area : null;

  return (
    <CardShell
      actions={
        <CardActionBar
          actions={[
            { label: 'Ver', icon: Eye, onClick: () => onView(lot) },
            { label: 'Editar', icon: Pencil, onClick: () => onEdit(lot) },
            {
              label: isActive ? 'Desactivar' : 'Activar',
              icon: Power,
              onClick: () => onToggleStatus(lot),
              tone: isActive ? 'danger' : 'success',
            },
          ]}
          subject={name}
        />
      }
      muted={!isActive}
    >
      <CardIdentity
        badge={<IconBadge icon={Sprout} tone={isActive ? 'primary' : 'muted'} />}
        muted={!isActive}
        title={name}
        titleAddon={!isActive && <Tag>Inactivo</Tag>}
      >
        <p className="text-sm text-muted-foreground">
          {lot.variedad || lot.variety || 'Variedad sin registrar'}
        </p>
      </CardIdentity>
      <CardStats
        items={[
          { label: 'área', value: formatArea(area) },
          { label: 'plantas', value: formatCount(plants) },
          { label: 'plantas por ha', value: formatCount(density) },
        ]}
      />
    </CardShell>
  );
}
