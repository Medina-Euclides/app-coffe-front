// Tarjeta de pago: solo el trabajador y cuánto se le debe (o se le pagó).
// Toda la tarjeta es un botón que abre el detalle.
import { ChevronRight } from 'lucide-react';
import { currencyFormatter, getInitials } from '../utils/paymentFormat.js';

export default function PaymentCard({ settlement, onOpen }) {
  const isPaid = settlement.status === 'pagada';

  return (
    <button
      aria-haspopup="dialog"
      aria-label={`${settlement.workerName}, ${currencyFormatter.format(settlement.total)} ${isPaid ? 'pagado' : 'por pagar'}. Ver detalle`}
      className="group flex min-h-20 w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-tint active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-4 sm:p-4"
      onClick={() => onOpen(settlement)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`flex size-12 shrink-0 items-center justify-center rounded-full font-heading text-base font-bold ${
          isPaid ? 'bg-leaf-soft text-leaf' : 'bg-secondary text-primary'
        }`}
      >
        {getInitials(settlement.workerName)}
      </span>

      <span className="min-w-0 flex-1 break-words font-heading text-base font-semibold leading-tight text-foreground sm:text-lg">
        {settlement.workerName}
      </span>

      <span className="shrink-0 text-right">
        <span
          className={`cifra block text-xl leading-none tabular-nums sm:text-2xl ${
            isPaid ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {currencyFormatter.format(settlement.total)}
        </span>
        <span
          className={`mt-1 block text-xs font-medium ${
            isPaid ? 'text-leaf' : 'text-warning'
          }`}
        >
          {isPaid ? 'Pagado' : 'Por pagar'}
        </span>
      </span>

      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </button>
  );
}
