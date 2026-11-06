// Línea de dato secundario con su ícono (cédula, teléfono, fecha, finca…).
import { createElement } from 'react';

export default function MetaLine({ icon, label, children }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      {icon && createElement(icon, { 'aria-hidden': true, className: 'size-4 shrink-0' })}
      {label && <span className="sr-only">{label}:</span>}
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
