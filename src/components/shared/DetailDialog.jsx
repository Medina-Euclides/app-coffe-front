// Modal de detalle común: encabezado con círculo opcional, contenido con scroll
// y pie fijo para la acción principal.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';

export default function DetailDialog({
  open,
  onOpenChange,
  badge,
  title,
  description,
  footer,
  locked = false,
  children,
}) {
  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next && !locked) onOpenChange(false);
      }}
      open={open}
    >
      <DialogContent className="flex max-h-[min(92dvh,44rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
          <DialogHeader className="flex-row items-center gap-3 pr-8 text-left">
            {badge}
            <div className="min-w-0">
              <DialogTitle className="break-words text-xl leading-tight text-foreground">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1 text-sm first-letter:uppercase">
                  {description}
                </DialogDescription>
              )}
            </div>
          </DialogHeader>
          {children}
        </div>
        {footer && <div className="border-t border-border bg-card p-4">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}

// Dato del modal: etiqueta pequeña arriba y valor debajo.
export function InfoField({ label, wide = false, children }) {
  return (
    <div className={`rounded-xl bg-muted px-3 py-2.5 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-foreground">{children}</dd>
    </div>
  );
}

export function InfoGrid({ children }) {
  return <dl className="grid grid-cols-2 gap-2">{children}</dl>;
}

// Cifra principal del modal (total a pagar, monto de la venta…).
const amountTones = {
  default: 'bg-muted text-foreground',
  income: 'bg-leaf-soft text-leaf',
  expense: 'bg-destructive-soft text-destructive',
};

export function AmountHighlight({ label, value, tone = 'default', children }) {
  return (
    <div className={`rounded-2xl px-4 py-4 ${amountTones[tone]}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="cifra mt-1 text-4xl leading-none tabular-nums">{value}</p>
      {children && <div className="mt-3 space-y-1">{children}</div>}
    </div>
  );
}

// Lista dentro del modal con su subtítulo.
export function DetailList({ title, empty, children }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink-soft">{title}</h3>
      {hasItems ? (
        <ul className="mt-1 divide-y divide-border/70">{children}</ul>
      ) : (
        <p className="py-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}
