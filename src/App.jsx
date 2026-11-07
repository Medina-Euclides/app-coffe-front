import { useEffect, useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import RoutesApp from './routes/RoutesApp.jsx';
import { leerLocal } from '#lib/storage';
import { api } from '#services/api';
import { cantidadPendientes, syncNow } from '#services/syncService';

function AppRoutes() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() =>
    api.auth.hasSession() ? leerLocal('cafesmart_usuario', null) : null,
  );

  useEffect(() => {
    localStorage.removeItem('cafesmart_usuarios');
    // Copias antiguas de datos en localStorage: hoy todo vive en IndexedDB (una sola copia).
    const legacyPrefixes = [
      'cafesmart_fincas_',
      'cafesmart_lotes_',
      'cafesmart_trabajadores_',
      'cafesmart_actividades_',
      'cafesmart_jornadas_',
    ];
    Object.keys(localStorage)
      .filter((key) => legacyPrefixes.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => localStorage.removeItem(key));
    if (!api.auth.hasSession()) {
      localStorage.removeItem('cafesmart_usuario');
    }
  }, []);

  const handleLogin = (nuevoUsuario) => {
    localStorage.setItem('cafesmart_usuario', JSON.stringify(nuevoUsuario));
    setUsuario(nuevoUsuario);
    // Descarga los datos de la finca para poder trabajar luego sin conexión.
    void syncNow();
    navigate(
      nuevoUsuario.primerIngreso ? '/configuracion-inicial' : '/inicio',
      { replace: true },
    );
  };

  const handleSetupComplete = () => {
    if (!usuario) {
      throw new Error('No hay una sesión activa para completar la configuración.');
    }

    const usuarioActualizado = { ...usuario, primerIngreso: false };
    localStorage.setItem(
      'cafesmart_usuario',
      JSON.stringify(usuarioActualizado),
    );
    setUsuario(usuarioActualizado);
    navigate('/inicio', { replace: true });
  };

  const handleLogout = async () => {
    const pendientes = await cantidadPendientes();
    if (
      pendientes > 0 &&
      !window.confirm(
        `Tienes ${pendientes} registro(s) sin sincronizar. Si cierras sesión se perderán. ¿Cerrar sesión de todas formas?`,
      )
    ) {
      return;
    }
    await api.auth.logout();
    localStorage.removeItem('cafesmart_usuario');
    setUsuario(null);
    navigate('/login', { replace: true });
  };

  return (
    <RoutesApp
      onLogin={handleLogin}
      onLogout={handleLogout}
      onModeChange={(registering) =>
        navigate(registering ? '/registro' : '/login', { replace: true })
      }
      onSetupComplete={handleSetupComplete}
      usuario={usuario}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
