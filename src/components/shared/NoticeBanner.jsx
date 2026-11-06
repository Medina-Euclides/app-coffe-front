/**
 * Banner de aviso (éxito o error) con aria-live para accesibilidad.
 */
export default function NoticeBanner({
  message,
  isError = false,
}) {
  if (!message) return null;

  return (
    <p
      aria-live="polite"
      className={`rounded-lg border px-3 py-2 text-sm ${
        isError
          ? 'border-destructive/20 bg-destructive-soft text-destructive'
          : 'border-border bg-muted text-primary'
      }`}
      role="status"
    >
      {message}
    </p>
  );
}
