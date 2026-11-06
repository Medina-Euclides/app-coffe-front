// Fila de movimiento financiero: qué fue, cuándo y cuánto. Al tocarla abre el detalle.
import { createElement } from 'react';
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

  return (
    <button
      aria-haspopup="dialog"
      aria-label={`${isSale ? 'Venta' : 'Gasto'}: ${title}, ${amount}, ${movementDate(movement.date)}. Ver detalle`}
      className="flex min-h-18 w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-tint active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-4 sm:p-4"
      onClick={() => onOpen(movement)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
          isSale ? 'bg-leaf-soft text-leaf' : 'bg-destructive-soft text-destructive'
        }`}
      >
        {createElement(getMovementIcon(movement), { className: 'size-5', strokeWidth: 1.75 })}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-heading text-base font-semibold leading-tight text-foreground">
          {title}
        </span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">
          {movementDate(movement.date)}
          {isSale && Number(movement.quantity_kg) > 0 &&
            `, ${numberFormatter.format(Number(movement.quantity_kg))} kg`}
        </span>
      </span>

      <span
        className={`cifra shrink-0 text-lg leading-none tabular-nums sm:text-xl ${
          isSale ? 'text-leaf' : 'text-destructive'
        }`}
      >
        {amount}
      </span>
    </button>
  );
}
