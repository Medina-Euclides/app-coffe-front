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
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]'
      }`}
      role="status"
    >
      {message}
    </p>
  );
}
