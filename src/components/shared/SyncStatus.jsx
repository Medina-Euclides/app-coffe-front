import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '#hooks/useOnlineStatus';
import {
  cantidadPendientes,
  sincronizarPendientes,
} from '#services/syncService';

export default function SyncStatus() {
  const isOnline = useOnlineStatus();
  const [pendientes, setPendientes] = useState(cantidadPendientes());
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const sincronizacionActiva = useRef(false);
  const timeoutMensaje = useRef(null);

  const actualizar = useCallback(() => {
    setPendientes(cantidadPendientes());
  }, []);

  useEffect(() => {
    window.addEventListener('focus', actualizar);
    window.addEventListener('storage', actualizar);
    const intervalo = setInterval(actualizar, 5000);
    return () => {
      window.removeEventListener('focus', actualizar);
      window.removeEventListener('storage', actualizar);
      clearInterval(intervalo);
    };
  }, [actualizar]);

  useEffect(() => () => clearTimeout(timeoutMensaje.current), []);

  const manejarSincronizacion = useCallback(async (reconexion = false) => {
    const pendientesActuales = cantidadPendientes();
    if (
      (!isOnline && !reconexion) ||
      pendientesActuales === 0 ||
      sincronizacionActiva.current
    ) {
      return;
    }

    sincronizacionActiva.current = true;
    clearTimeout(timeoutMensaje.current);
    setSincronizando(true);
    setMensaje(
      reconexion
        ? `Conexión restablecida. Sincronizando ${pendientesActuales} registro(s)...`
        : `Sincronizando ${pendientesActuales} registro(s)...`,
    );
    try {
      const resultado = await sincronizarPendientes();
      setMensaje(
        `Sincronizados ${resultado.enviados} registro(s) correctamente.`,
      );
      actualizar();
    } catch (error) {
      setMensaje(
        reconexion
          ? `Conexión restablecida, pero no se pudo sincronizar: ${error.message}`
          : error.message,
      );
    } finally {
      sincronizacionActiva.current = false;
      setSincronizando(false);
      timeoutMensaje.current = setTimeout(() => setMensaje(''), 5000);
    }
  }, [actualizar, isOnline]);

  useEffect(() => {
    const manejarReconexion = () => {
      const pendientesActuales = cantidadPendientes();
      setPendientes(pendientesActuales);
      if (pendientesActuales > 0) {
        void manejarSincronizacion(true);
      }
    };

    window.addEventListener('online', manejarReconexion);
    return () => window.removeEventListener('online', manejarReconexion);
  }, [manejarSincronizacion]);

  const EstadoIcono = sincronizando
    ? RefreshCw
    : isOnline
      ? Wifi
      : WifiOff;

  return (
    <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
      <div
        aria-live="polite"
        className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
          isOnline
            ? 'bg-emerald-50 text-emerald-800'
            : 'bg-amber-50 text-amber-900'
        }`}
        role="status"
        title={isOnline ? 'Con conexión a internet' : 'Sin conexión a internet'}
      >
        <EstadoIcono
          aria-hidden="true"
          className={`size-3.5 shrink-0 ${sincronizando ? 'animate-spin' : ''}`}
        />
        <span>{sincronizando ? 'Sincronizando' : isOnline ? 'En línea' : 'Sin conexión'}</span>
      </div>

      {pendientes > 0 && (
        <>
          <span className="text-xs text-[#68766b]">
            {pendientes} pendiente(s)
          </span>
          {isOnline && !sincronizando && (
            <button
              aria-label={`Sincronizar ${pendientes} registro(s) pendiente(s)`}
              className="rounded-full p-1.5 text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              onClick={() => void manejarSincronizacion()}
              title="Sincronizar ahora"
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
            </button>
          )}
        </>
      )}

      {mensaje && (
        <span
          aria-live="polite"
          className="basis-full text-right text-xs text-[#68766b]"
          role="status"
        >
          {mensaje}
        </span>
      )}
    </div>
  );
}
