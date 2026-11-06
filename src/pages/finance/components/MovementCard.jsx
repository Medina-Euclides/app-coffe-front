// Fila de movimiento financiero: qué fue, cuándo y cuánto. Al tocarla abre el detalle.
import IconBadge from '#components/shared/IconBadge';
import RowCard from '#components/shared/RowCard';
import {
  currencyFormatter,
  getMovementIcon,
  movementDate,
  numberFormatter,
} from '../movementFormat.js';

export default function MovementCard({ movement, onOpen }) {
  const isSale = movement.type === 'sale';
  const title = movement.title || (isSale ? 'Venta de café' : 'Gasto');
  const amount = `${isSale ? '+' : '−'}${currencyFormatter.format(movement.amount)}`;
  const kilos = Number(movement.quantity_kg);
  const subtitle =
    isSale && kilos > 0
      ? `${movementDate(movement.date)}, ${numberFormatter.format(kilos)} kg`
      : movementDate(movement.date);

  return (
    <RowCard
      ariaLabel={`${isSale ? 'Venta' : 'Gasto'}: ${title}, ${amount}, ${subtitle}. Ver detalle`}
      badge={<IconBadge icon={getMovementIcon(movement)} tone={isSale ? 'income' : 'expense'} />}
      onClick={() => onOpen(movement)}
      subtitle={subtitle}
      title={title}
      value={amount}
      valueTone={isSale ? 'income' : 'expense'}
    />
  );
}
