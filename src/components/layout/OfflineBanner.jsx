export default function OfflineBanner({ isOnline }) {
  if (isOnline) return null;

  return (
    <div className="offline-banner">
      Modo sin conexión. Los datos se guardarán localmente y se sincronizarán al recuperar conexión.
    </div>
  );
}
