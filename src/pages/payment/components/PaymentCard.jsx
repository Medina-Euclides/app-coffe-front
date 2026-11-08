// Tarjeta de pago: el trabajador y cuánto se le debe (o se le pagó).
import IconBadge from '#components/shared/IconBadge';
import RowCard from '#components/shared/RowCard';
import { formatoDinero } from '#lib/formatters';

export default function PaymentCard({ settlement, onOpen }) {
  const isPaid = settlement.status === 'pagada';
  const total = formatoDinero(settlement.total);
  const note = isPaid ? 'Pagado' : 'Por pagar';

  return (
    <RowCard
      ariaLabel={`${settlement.workerName}, ${total} ${note.toLowerCase()}. Ver detalle`}
      badge={<IconBadge name={settlement.workerName} tone={isPaid ? 'income' : 'primary'} />}
      note={note}
      noteTone={isPaid ? 'leaf' : 'warning'}
      onClick={() => onOpen(settlement)}
      title={settlement.workerName}
      value={total}
      valueTone={isPaid ? 'muted' : 'default'}
    />
  );
}
