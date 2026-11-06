// Tarjeta-fila que se toca completa para ver el detalle: identidad a la izquierda
// y una cifra a la derecha (pagos, movimientos).
const valueTones = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  income: 'text-leaf',
  expense: 'text-destructive',
};
const noteTones = {
  muted: 'text-muted-foreground',
  leaf: 'text-leaf',
  warning: 'text-warning',
};

export default function RowCard({
  badge,
  title,
  subtitle,
  value,
  valueTone = 'default',
  note,
  noteTone = 'muted',
  ariaLabel,
  onClick,
}) {
  return (
    <button
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      className="flex min-h-20 w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-tint active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={onClick}
      type="button"
    >
      {badge}
      <span className="min-w-0 flex-1">
        <span className="block break-words font-heading text-lg font-semibold leading-tight text-foreground">
          {title}
        </span>
        {subtitle && (
          <span className="mt-1 block truncate text-sm text-muted-foreground">{subtitle}</span>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className={`cifra block text-xl leading-none tabular-nums ${valueTones[valueTone]}`}>
          {value}
        </span>
        {note && (
          <span className={`mt-1 block text-sm font-medium ${noteTones[noteTone]}`}>{note}</span>
        )}
      </span>
    </button>
  );
}
