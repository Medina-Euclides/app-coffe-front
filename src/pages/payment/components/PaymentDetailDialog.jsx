// Detalle de un pago: total, periodo, finca, cada jornal o pesaje que lo compone
// y el botón para pagar (por ahora siempre en efectivo).
import { Banknote, CalendarDays, Clock3, LoaderCircle, MapPin } from 'lucide-react';
import DetailDialog, {
  AmountHighlight,
  DetailList,
  InfoField,
  InfoGrid,
} from '#components/shared/DetailDialog';
import IconBadge from '#components/shared/IconBadge';
import MetaLine from '#components/shared/MetaLine';
import {
  currencyFormatter,
  formatDate,
  getPaymentMethodLabel,
  kilogramsFormatter,
} from '../utils/paymentFormat.js';

const statusLabel = {
  pendiente: 'Pendiente de liquidar',
  abierta: 'En liquidación',
  liquidada: 'Liquidado, falta pagar',
  pagada: 'Pagado',
};

function PayButton({ settlement, paying, onPay }) {
  return (
    <button
      className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-heading text-base font-semibold text-primary-foreground shadow-[0_4px_0_color-mix(in_oklab,var(--primary),black_45%)] transition-[background-color,box-shadow,translate] duration-100 hover:bg-primary-hover active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
      disabled={settlement.total <= 0 || paying}
      onClick={() => onPay(settlement)}
      type="button"
    >
      {paying ? (
        <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" />
      ) : (
        <Banknote aria-hidden="true" className="size-5" />
      )}
      {paying ? 'Registrando pago…' : `Pagar ${currencyFormatter.format(settlement.total)} en efectivo`}
    </button>
  );
}

export default function PaymentDetailDialog({ settlement, paying, onPay, onOpenChange }) {
  if (!settlement) return null;
  const isPaid = settlement.status === 'pagada';

  return (
    <DetailDialog
      badge={<IconBadge name={settlement.workerName} tone={isPaid ? 'income' : 'primary'} />}
      description={
        settlement.identification ? `C.C. ${settlement.identification}` : statusLabel[settlement.status]
      }
      footer={isPaid ? null : <PayButton onPay={onPay} paying={paying} settlement={settlement} />}
      locked={paying}
      onOpenChange={onOpenChange}
      open
      title={settlement.workerName}
    >
      <AmountHighlight
        label={isPaid ? 'Total pagado' : 'Total a pagar'}
        tone={isPaid ? 'income' : 'default'}
        value={currencyFormatter.format(settlement.total)}
      >
        <MetaLine icon={CalendarDays} label="Periodo">
          {settlement.startDate === settlement.endDate
            ? formatDate(settlement.startDate)
            : `${formatDate(settlement.startDate)} al ${formatDate(settlement.endDate)}`}
        </MetaLine>
        <MetaLine icon={MapPin} label="Finca">
          {settlement.farmName}
        </MetaLine>
      </AmountHighlight>

      {isPaid && (
        <InfoGrid>
          <InfoField label="Pagado el">{formatDate(settlement.paymentDate)}</InfoField>
          <InfoField label="Método">{getPaymentMethodLabel(settlement.paymentMethod)}</InfoField>
          {settlement.notes && (
            <InfoField label="Nota" wide>
              {settlement.notes}
            </InfoField>
          )}
        </InfoGrid>
      )}

      <DetailList
        empty="No hay detalles disponibles para este pago."
        title={isPaid ? 'Lo que se pagó' : 'Lo que se le debe'}
      >
        {settlement.items.map((item) => (
          <li className="flex min-w-0 items-center justify-between gap-3 py-3" key={`${item.type}-${item.id}`}>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {item.type === 'kilogram'
                  ? `${kilogramsFormatter.format(item.kilograms)} kg en ${item.lotName || 'recolección'}`
                  : 'Jornal'}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  {formatDate(item.date)}
                </span>
                {item.time && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 aria-hidden="true" className="size-4" />
                    {item.time.slice(0, 5)}
                  </span>
                )}
                <span>
                  {currencyFormatter.format(item.rate)} {item.type === 'kilogram' ? 'por kg' : 'por jornal'}
                </span>
              </p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums text-foreground">
              {currencyFormatter.format(item.amount)}
            </p>
          </li>
        ))}
      </DetailList>
    </DetailDialog>
  );
}
