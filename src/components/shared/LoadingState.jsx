// Mensaje de carga accesible ("Cargando trabajadores…"). `boxed` lo pone en una tarjeta.
import { LoaderCircle } from 'lucide-react';
import { cn } from '#lib/utils';

export default function LoadingState({ children = 'Cargando…', boxed = false, spinner = false, className }) {
  return (
    <p
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 text-center text-sm text-muted-foreground',
        boxed ? 'rounded-2xl border border-border bg-card px-5 py-10' : 'py-8',
        className,
      )}
      role="status"
    >
      {spinner && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </p>
  );
}
