// Detalle de un pago: total, periodo, finca, cada jornal o pesaje que lo compone
// y el botón para pagar (por ahora siempre en efectivo).
import { Banknote, CalendarDays, Clock3, LoaderCircle, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
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

export default function PaymentDetailDialog({ settlement, paying, onPay, onOpenChange }) {
  const isPaid = settlement?.status === 'pagada';
  const canPay = settlement && !isPaid && settlement.total > 0;

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && !paying) onOpenChange(false);
      }}
      open={Boolean(settlement)}
    >
      {settlement && (
        <DialogContent className="flex max-h-[min(92dvh,44rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <DialogHeader className="pr-8">
              <DialogTitle className="text-2xl text-foreground">
                {settlement.workerName}
              </DialogTitle>
              <DialogDescription>
                {settlement.identification
                  ? `C.C. ${settlement.identification}`
                  : statusLabel[settlement.status]}
              </DialogDescription>
            </DialogHeader>

            <div
              className={`mt-5 rounded-2xl px-4 py-4 ${
                isPaid ? 'bg-leaf-soft' : 'bg-muted'
              }`}
            >
              <p className="text-sm text-muted-foreground">
                {isPaid ? 'Total pagado' : 'Total a pagar'}
              </p>
              <p className="cifra mt-1 text-4xl leading-none tabular-nums text-foreground">
                {currencyFormatter.format(settlement.total)}
              </p>
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-soft">
                <div className="flex items-center gap-1.5">
                  <dt>
                    <CalendarDays aria-hidden="true" className="size-4" />
                    <span className="sr-only">Periodo</span>
                  </dt>
                  <dd>
                    {settlement.startDate === settlement.endDate
                      ? formatDate(settlement.startDate)
                      : `${formatDate(settlement.startDate)} al ${formatDate(settlement.endDate)}`}
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt>
                    <MapPin aria-hidden="true" className="size-4" />
                    <span className="sr-only">Finca</span>
                  </dt>
                  <dd>{settlement.farmName}</dd>
                </div>
              </dl>
            </div>

            {isPaid && (
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-border px-3 py-2.5">
                  <dt className="text-xs text-muted-foreground">Pagado el</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {formatDate(settlement.paymentDate)}
                  </dd>
                </div>
                <div className="rounded-xl border border-border px-3 py-2.5">
                  <dt className="text-xs text-muted-foreground">Método</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {getPaymentMethodLabel(settlement.paymentMethod)}
                  </dd>
                </div>
                {settlement.notes && (
                  <div className="col-span-2 rounded-xl border border-border px-3 py-2.5">
                    <dt className="text-xs text-muted-foreground">Nota</dt>
                    <dd className="mt-0.5 text-foreground">{settlement.notes}</dd>
                  </div>
                )}
              </dl>
            )}

            <section className="mt-5">
              <h3 className="text-sm font-semibold text-ink-soft">
                {isPaid ? 'Lo que se pagó' : 'Lo que se le debe'}
              </h3>
              {settlement.items.length ? (
                <ul className="mt-1 divide-y divide-border/70">
                  {settlement.items.map((item) => (
                    <li
                      className="flex min-w-0 items-center justify-between gap-3 py-3 text-sm"
                      key={`${item.type}-${item.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {item.type === 'kilogram'
                            ? `${kilogramsFormatter.format(item.kilograms)} kg en ${item.lotName || 'recolección'}`
                            : 'Jornal'}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays aria-hidden="true" className="size-3" />
                            {formatDate(item.date)}
                          </span>
                          {item.time && (
                            <span className="inline-flex items-center gap-1">
                              <Clock3 aria-hidden="true" className="size-3" />
                              {item.time.slice(0, 5)}
                            </span>
                          )}
                          <span>
                            {currencyFormatter.format(item.rate)}{' '}
                            {item.type === 'kilogram' ? 'por kg' : 'por jornal'}
                          </span>
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums text-foreground">
                        {currencyFormatter.format(item.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-3 text-sm text-muted-foreground">
                  No hay detalles disponibles para este pago.
                </p>
              )}
            </section>
          </div>

          {!isPaid && (
            <div className="border-t border-border bg-card p-4 sm:p-5">
              <button
                className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-heading text-base font-semibold text-primary-foreground shadow-[0_4px_0_color-mix(in_oklab,var(--primary),black_45%)] transition-[background-color,box-shadow,translate] duration-100 hover:bg-primary-hover active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                disabled={!canPay || paying}
                onClick={() => onPay(settlement)}
                type="button"
              >
                {paying ? (
                  <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" />
                ) : (
                  <Banknote aria-hidden="true" className="size-5" />
                )}
                {paying
                  ? 'Registrando pago…'
                  : `Pagar ${currencyFormatter.format(settlement.total)} en efectivo`}
              </button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
