import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '#hooks/useOnlineStatus';
import { obtenerRechazados } from '#services/syncQueue';
import {
  discardRejected,
  getSyncState,
  refreshCounts,
  SYNC_EVENT,
  syncNow,
} from '#services/syncService';

const ENTITY_LABELS = {
  workday: 'Jornada',
  workday_worker: 'Trabajador en jornada',
  workday_detail: 'Labor por lote',
  harvest_record: 'Pesaje',
  worker: 'Trabajador',
  expense: 'Gasto',
  sale: 'Venta',
};

export default function SyncStatus() {
  const isOnline = useOnlineStatus();
  const [sync, setSync] = useState(getSyncState);
  const [mensaje, setMensaje] = useState('');
  const [rechazados, setRechazados] = useState([]);
  const [verRechazados, setVerRechazados] = useState(false);

  useEffect(() => {
    const onState = (event) => setSync(event.detail);
    window.addEventListener(SYNC_EVENT, onState);
    void refreshCounts();
    return () => window.removeEventListener(SYNC_EVENT, onState);
  }, []);

  useEffect(() => {
    if (!verRechazados) return;
    void obtenerRechazados().then(setRechazados);
  }, [verRechazados, sync.rejected]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const timeout = setTimeout(() => setMensaje(''), 5000);
    return () => clearTimeout(timeout);
  }, [mensaje]);

  const sincronizar = async () => {
    const resultado = await syncNow();
    if (resultado.ok) {
      setMensaje(
        resultado.applied
          ? `Sincronizados ${resultado.applied} registro(s).`
          : 'Datos actualizados.',
      );
    } else if (resultado.error) {
      setMensaje(`No se pudo sincronizar: ${resultado.error.message}`);
    }
  };

  const EstadoIcono = sync.syncing ? RefreshCw : isOnline ? Wifi : WifiOff;

  return (
    <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
      <div
        aria-live="polite"
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${
          isOnline ? 'bg-leaf-soft text-leaf' : 'bg-warning-soft text-warning'
        }`}
        role="status"
        title={
          sync.lastSync
            ? `Última sincronización: ${new Date(sync.lastSync).toLocaleString()}`
            : isOnline
              ? 'Con conexión a internet'
              : 'Sin conexión a internet'
        }
      >
        <EstadoIcono
          aria-hidden="true"
          className={`size-3.5 shrink-0 ${sync.syncing ? 'animate-spin' : ''}`}
        />
        <span>
          {sync.syncing ? 'Sincronizando' : isOnline ? 'En línea' : 'Sin conexión'}
        </span>
      </div>

      {sync.pending > 0 && (
        <span className="text-sm text-muted-foreground">{sync.pending} pendiente(s)</span>
      )}

      {isOnline && !sync.syncing && (
        <button
          aria-label="Sincronizar ahora"
          className="rounded-full p-1.5 text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => void sincronizar()}
          title="Sincronizar ahora"
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
        </button>
      )}

      {sync.rejected > 0 && (
        <button
          className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-sm font-medium text-destructive"
          onClick={() => setVerRechazados((value) => !value)}
          type="button"
        >
          <AlertTriangle aria-hidden="true" className="size-3.5" />
          {sync.rejected} con error
        </button>
      )}

      {verRechazados && sync.rejected > 0 && (
        <div className="basis-full rounded-xl border border-border bg-card p-3 text-sm shadow-sm">
          <p className="mb-2 font-medium">
            Estos registros hechos sin conexión fueron rechazados por el servidor:
          </p>
          <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto">
            {rechazados.map((op) => (
              <li key={op.seq} className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {ENTITY_LABELS[op.entity] || op.entity}
                </span>{' '}
                ({new Date(op.client_ts).toLocaleString()}): {op.error}
              </li>
            ))}
          </ul>
          <button
            className="rounded-lg bg-secondary px-3 py-1.5 font-medium hover:bg-secondary/80"
            onClick={() => {
              setVerRechazados(false);
              void discardRejected();
            }}
            type="button"
          >
            Descartar y recargar datos del servidor
          </button>
        </div>
      )}

      {(mensaje || sync.error) && (
        <span
          aria-live="polite"
          className="basis-full text-right text-sm text-muted-foreground"
          role="status"
        >
          {mensaje || sync.error}
        </span>
      )}
    </div>
  );
}
