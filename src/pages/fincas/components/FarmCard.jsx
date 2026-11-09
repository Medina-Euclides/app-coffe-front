// Tarjeta de finca: ubicación, totales de sus lotes y acceso a ellos.
import React from 'react';
import { MapPin, Mountain, Pencil, Sprout } from 'lucide-react';
import CardActionBar from '#components/shared/CardActionBar';
import CardShell, { CardIdentity } from '#components/shared/CardShell';
import CardStats from '#components/shared/CardStats';
import IconBadge from '#components/shared/IconBadge';
import MetaLine from '#components/shared/MetaLine';
import { formatoArea, formatoConteo } from '#lib/formatters';
import { getLotArea, getLotPlants } from '#lib/domain/farms';

// Suma solo los lotes que tienen el dato; si ninguno lo tiene, no hay total.
function sumar(lots, leer) {
  let total = null;
  for (const lot of lots) {
    const valor = leer(lot);
    if (valor !== null) total = (total ?? 0) + valor;
  }
  return total;
}

export default React.memo(function FarmCard({ farm, lots, onOpenLots, onEdit }) {
  const name = farm.nombre || 'Finca sin nombre';

  return (
    <CardShell
      actions={
        <CardActionBar
          actions={[
            { label: 'Ver lotes', icon: Sprout, onClick: () => onOpenLots(farm), tone: 'solid', grow: 2 },
            { label: 'Editar', icon: Pencil, onClick: () => onEdit(farm) },
          ]}
          subject={`de ${name}`}
        />
      }
    >
      <CardIdentity badge={<IconBadge icon={Mountain} />} title={name}>
        <MetaLine icon={MapPin} label="Ubicación">
          {farm.ubicacion || 'Sin ubicación'}
        </MetaLine>
      </CardIdentity>
      <CardStats
        items={[
          { label: lots.length === 1 ? 'lote' : 'lotes', value: formatoConteo(lots.length) },
          { label: 'área', value: formatoArea(sumar(lots, getLotArea)) },
          { label: 'plantas', value: formatoConteo(sumar(lots, getLotPlants)) },
        ]}
      />
    </CardShell>
  );
});
