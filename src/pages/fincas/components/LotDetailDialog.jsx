// Detalle de un lote: variedad, área, plantas y estado.
import { Sprout } from 'lucide-react';
import DetailDialog, { InfoField, InfoGrid } from '#components/shared/DetailDialog';
import IconBadge from '#components/shared/IconBadge';
import { formatoArea, formatoConteo } from '#lib/formatters';
import { getLotArea, getLotPlants } from '#lib/domain/farms';

export default function LotDetailDialog({ lot, farmName, onOpenChange }) {
  const isActive = lot?.estado !== 'inactivo';
  return (
    <DetailDialog
      badge={lot && <IconBadge icon={Sprout} tone={isActive ? 'primary' : 'muted'} />}
      description={farmName ? `Lote de ${farmName}` : undefined}
      onOpenChange={onOpenChange}
      open={Boolean(lot)}
      title={lot?.nombre}
    >
      {lot && (
        <InfoGrid>
          <InfoField label="Variedad">{lot.variedad || 'No especificada'}</InfoField>
          <InfoField label="Estado">{isActive ? 'Activo' : 'Inactivo'}</InfoField>
          <InfoField label="Área">{formatoArea(getLotArea(lot)) || 'No especificada'}</InfoField>
          <InfoField label="Plantas de café">
            {formatoConteo(getLotPlants(lot)) || 'No especificadas'}
          </InfoField>
        </InfoGrid>
      )}
    </DetailDialog>
  );
}
