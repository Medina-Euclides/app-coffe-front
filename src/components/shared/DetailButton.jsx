// Botón de ancho completo dentro de una tarjeta que abre su detalle en un modal.
import { createElement } from 'react';
import { ChevronRight } from 'lucide-react';

export default function DetailButton({ icon, children, onClick }) {
  return (
    <button
      aria-haspopup="dialog"
      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-muted px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-secondary hover:text-primary active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={onClick}
      type="button"
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon && createElement(icon, { 'aria-hidden': true, className: 'size-4 shrink-0' })}
        <span className="truncate">{children}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
        Ver detalle
        <ChevronRight aria-hidden="true" className="size-4" />
      </span>
    </button>
  );
}
