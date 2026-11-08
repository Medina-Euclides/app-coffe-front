// Botonera al pie de una tarjeta: botones redondeados del mismo ancho, con ícono
// y texto, altos para tocarlos fácil con el dedo. `primaryAction` (opcional) va
// sola debajo, a todo el ancho y con relieve de tecla: es la acción que no se
// debe olvidar (p. ej. cerrar la jornada).
import { LoaderCircle } from 'lucide-react';

const tonos = {
  primary: 'bg-muted text-primary hover:bg-secondary active:bg-secondary',
  danger:
    'bg-destructive-soft text-destructive hover:bg-[color-mix(in_oklab,var(--destructive-soft),var(--destructive)_12%)] active:bg-[color-mix(in_oklab,var(--destructive-soft),var(--destructive)_12%)]',
  success: 'bg-leaf-soft text-leaf hover:bg-secondary active:bg-secondary',
  solid: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
};

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

function ActionIcon({ icon, loading, className }) {
  const Icon = loading ? LoaderCircle : icon;
  return (
    <Icon
      aria-hidden="true"
      className={`${className} shrink-0 ${loading ? 'motion-safe:animate-spin' : ''}`}
      strokeWidth={2.25}
    />
  );
}

function PrimaryAction({ label, loadingLabel, ariaLabel, icon, onClick, disabled = false, loading = false }) {
  return (
    <button
      aria-label={ariaLabel}
      className={`flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 font-heading text-base font-semibold text-primary-foreground shadow-[0_3px_0_var(--relieve)] transition-[background-color,box-shadow,translate] duration-100 [--relieve:color-mix(in_oklab,var(--primary),black_45%)] hover:bg-primary-hover active:translate-y-[3px] active:shadow-[0_0_0_var(--relieve)] motion-reduce:transition-none ${focusRing}`}
      disabled={disabled || loading}
      onClick={onClick}
      type="button"
    >
      <ActionIcon className="size-5" icon={icon} loading={loading} />
      <span className="truncate">{loading && loadingLabel ? loadingLabel : label}</span>
    </button>
  );
}

export default function CardActionBar({ actions, primaryAction, subject }) {
  return (
    <div className="mt-auto flex flex-col gap-3 px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: actions
            .map(({ grow = 1 }) => `minmax(0, ${grow}fr)`)
            .join(' '),
        }}
      >
        {actions.map(({ label, ariaLabel, icon, onClick, tone = 'primary', disabled = false, loading = false }) => (
          <button
            aria-label={ariaLabel || (subject ? `${label} ${subject}` : label)}
            className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition-colors ${focusRing} ${tonos[tone]}`}
            disabled={disabled || loading}
            key={label}
            onClick={onClick}
            type="button"
          >
            <ActionIcon className="size-4" icon={icon} loading={loading} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
      {primaryAction && <PrimaryAction {...primaryAction} />}
    </div>
  );
}
