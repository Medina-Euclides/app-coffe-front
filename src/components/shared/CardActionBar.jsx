// Botonera al pie de una tarjeta: botones redondeados del mismo ancho, con ícono
// y texto, altos para tocarlos fácil con el dedo.
import { LoaderCircle } from 'lucide-react';

const tonos = {
  primary: 'bg-muted text-primary hover:bg-secondary active:bg-secondary',
  danger:
    'bg-destructive-soft text-destructive hover:bg-[color-mix(in_oklab,var(--destructive-soft),var(--destructive)_12%)] active:bg-[color-mix(in_oklab,var(--destructive-soft),var(--destructive)_12%)]',
  success: 'bg-leaf-soft text-leaf hover:bg-secondary active:bg-secondary',
  solid: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
};

export default function CardActionBar({ actions, subject }) {
  return (
    <div
      className="mt-auto grid gap-2 px-3 pb-3 sm:px-4 sm:pb-4"
      style={{
        gridTemplateColumns: actions
          .map(({ grow = 1 }) => `minmax(0, ${grow}fr)`)
          .join(' '),
      }}
    >
      {actions.map(({ label, ariaLabel, icon, onClick, tone = 'primary', disabled = false, loading = false }) => {
        const Icon = loading ? LoaderCircle : icon;
        return (
        <button
          aria-label={ariaLabel || (subject ? `${label} ${subject}` : label)}
          className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${tonos[tone]}`}
          disabled={disabled || loading}
          key={label}
          onClick={onClick}
          type="button"
        >
          <Icon
            aria-hidden="true"
            className={`size-4 shrink-0 ${loading ? 'motion-safe:animate-spin' : ''}`}
            strokeWidth={2.25}
          />
          <span className="truncate">{label}</span>
        </button>
        );
      })}
    </div>
  );
}
