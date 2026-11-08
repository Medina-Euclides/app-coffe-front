// Selector de finca con la opción «Todas las fincas» (Finanzas y Analíticas).
import { cn } from '#lib/utils';

export default function FarmSelect({
  id,
  farms,
  value,
  onChange,
  label = 'Finca',
  showLabel = false,
  disabled = false,
  className,
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label
        className={showLabel ? 'mb-1.5 block text-sm font-medium text-muted-foreground' : 'sr-only'}
        htmlFor={id}
      >
        {label}
      </label>
      <select
        className="h-12 w-full rounded-xl border border-border bg-card px-3 text-base text-ink-soft shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Todas las fincas</option>
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.nombre || farm.name}
          </option>
        ))}
      </select>
    </div>
  );
}
