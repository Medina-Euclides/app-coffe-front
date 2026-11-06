// Detalle de un movimiento: monto, fecha, finca y los datos propios de venta o gasto.
import { createElement } from 'react';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import {
  currencyFormatter,
  getMovementIcon,
  movementLongDate,
  numberFormatter,
} from '../movementFormat.js';

function Field({ label, children, wide = false }) {
  return (
    <div className={`rounded-xl bg-muted px-3 py-2.5 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-foreground">{children}</dd>
    </div>
  );
}

export default function MovementDetailDialog({ movement, onOpenChange, onEdit }) {
  const isSale = movement?.type === 'sale';

  return (
    <Dialog onOpenChange={(open) => !open && onOpenChange(false)} open={Boolean(movement)}>
      {movement && (
        <DialogContent className="max-h-[min(92dvh,40rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="flex-row items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                isSale ? 'bg-leaf-soft text-leaf' : 'bg-destructive-soft text-destructive'
              }`}
            >
              {createElement(getMovementIcon(movement), { className: 'size-5', strokeWidth: 1.75 })}
            </span>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-xl text-foreground">
                {movement.title || (isSale ? 'Venta de café' : 'Gasto')}
              </DialogTitle>
              <DialogDescription className="first-letter:uppercase">
                {movementLongDate(movement.date)}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className={`rounded-2xl px-4 py-4 ${isSale ? 'bg-leaf-soft' : 'bg-destructive-soft'}`}>
            <p className="text-sm text-muted-foreground">{isSale ? 'Ingreso por venta' : 'Gasto'}</p>
            <p
              className={`cifra mt-1 text-4xl leading-none tabular-nums ${
                isSale ? 'text-leaf' : 'text-destructive'
              }`}
            >
              {isSale ? '+' : '−'}
              {currencyFormatter.format(movement.amount)}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            {isSale ? (
              <>
                <Field label="Café vendido">
                  {numberFormatter.format(Number(movement.quantity_kg) || 0)} kg
                </Field>
                <Field label="Precio por kg">
                  {currencyFormatter.format(Number(movement.unit_price) || 0)}
                </Field>
                {movement.buyer && <Field label="Comprador" wide>{movement.buyer}</Field>}
              </>
            ) : (
              <Field label="Categoría" wide>{movement.categoryLabel}</Field>
            )}
            <Field label="Finca" wide>{movement.farmName || 'Sin finca'}</Field>
            {movement.notes && (
              <Field label="Notas" wide>
                <span className="whitespace-pre-wrap font-normal">{movement.notes}</span>
              </Field>
            )}
          </dl>

          {movement.isAutomatic ? (
            <p className="rounded-xl border border-border px-3 py-2.5 text-sm text-muted-foreground">
              Este gasto se creó al registrar un pago en Pagos laborales y no se edita aquí.
            </p>
          ) : (
            <button
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-muted font-semibold text-primary transition-colors hover:bg-secondary active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={() => onEdit(movement)}
              type="button"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Editar {isSale ? 'venta' : 'gasto'}
            </button>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
