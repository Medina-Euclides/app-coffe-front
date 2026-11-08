// Error de carga con botón para reintentar.
import { Button } from '#components/ui/button';
import { cn } from '#lib/utils';

export default function ErrorBanner({ message, onRetry, retryLabel = 'Reintentar', className }) {
  if (!message) return null;
  return (
    <div
      aria-live="assertive"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      role="alert"
    >
      <span>{message}</span>
      {onRetry && (
        <Button className="h-11 rounded-xl" onClick={() => onRetry()} type="button" variant="outline">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
