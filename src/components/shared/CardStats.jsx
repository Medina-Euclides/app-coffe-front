// Franja de cifras dentro de una tarjeta: el número primero, la unidad debajo.
export default function CardStats({ items }) {
  return (
    <dl
      className="grid divide-x divide-border rounded-xl bg-muted"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ label, value }) => (
        <div className="flex min-w-0 flex-col-reverse px-3 py-2.5" key={label}>
          <dt className="truncate text-sm text-muted-foreground">{label}</dt>
          <dd
            className={`truncate font-heading text-lg leading-tight font-semibold tabular-nums ${
              value === null ? 'text-subtle' : 'text-foreground'
            }`}
          >
            {value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
