import { useEffect, useState } from 'react';
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

  const actualizar = () => {
    setPendientes(cantidadPendientes());
  };

  useEffect(() => {
    actualizar();
    window.addEventListener('focus', actualizar);
    const intervalo = setInterval(actualizar, 5000);
    return () => {
      window.removeEventListener('focus', actualizar);
      clearInterval(intervalo);
    };
  }, []);

  const manejarSincronizacion = async () => {
    if (!isOnline || pendientes === 0 || sincronizando) return;

    setSincronizando(true);
    setMensaje('');

    try {
      const resultado = await sincronizarPendientes();
      setMensaje(`Sincronizados ${resultado.enviados} registro(s) correctamente.`);
      actualizar();
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setSincronizando(false);
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  if (pendientes === 0 && !mensaje) return null;

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '10px 12px',
        borderRadius: '10px',
        backgroundColor: isOnline ? '#ecfdf5' : '#fffbeb',
        border: `1px solid ${isOnline ? '#a7f3d0' : '#fde68a'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '0.8rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#22c55e' : '#f59e0b',
            }}
          />
          <span style={{ color: isOnline ? '#065f46' : '#92400e', fontWeight: '600' }}>
            {pendientes} registro(s) pendiente(s) por sincronizar
          </span>
        </div>

        {isOnline && pendientes > 0 && (
          <button
            onClick={manejarSincronizacion}
            disabled={sincronizando}
            style={{
              border: 'none',
              backgroundColor: sincronizando ? '#94a3b8' : '#047857',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: sincronizando ? 'not-allowed' : 'pointer',
              fontSize: '0.78rem',
            }}
          >
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        )}
      </div>

      {!isOnline && (
        <span style={{ color: '#92400e' }}>
          Se guardarán localmente y se sincronizarán al recuperar conexión.
        </span>
      )}

      {mensaje && (
        <span style={{ color: '#065f46', fontWeight: '500' }}>{mensaje}</span>
      )}
    </div>
  );
}
