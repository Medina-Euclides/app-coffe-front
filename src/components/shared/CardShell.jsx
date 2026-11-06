// Estructura común de las tarjetas: cabecera opcional, cuerpo y botonera.
import { createElement } from 'react';

export function CardHeaderStrip({ icon, children, aside }) {
  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
      <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink-soft">
        {icon &&
          createElement(icon, {
            'aria-hidden': true,
            className: 'size-4 shrink-0 text-muted-foreground',
          })}
        <span className="truncate first-letter:uppercase">{children}</span>
      </p>
      {aside}
    </header>
  );
}

// Identidad de la tarjeta: círculo, título y líneas de apoyo; `aside` a la derecha.
export function CardIdentity({ badge, title, titleAddon, muted = false, aside, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {badge}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h2
            className={`min-w-0 break-words font-heading text-lg font-semibold leading-tight ${
              muted ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {title}
          </h2>
          {titleAddon}
        </div>
        {children && <div className="mt-1 space-y-1">{children}</div>}
      </div>
      {aside}
    </div>
  );
}

export default function CardShell({ header, actions, muted = false, children }) {
  return (
    <article
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card ${
        muted ? 'border-dashed border-border-strong' : 'border-border'
      }`}
    >
      {header}
      <div className="flex min-w-0 flex-col gap-3 p-4">{children}</div>
      {actions}
    </article>
  );
}
