import { useEffect, useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import RoutesApp from './routes/RoutesApp.jsx';
import { leerLocal } from '#lib/storage';
import { api } from '#services/api';

function AppRoutes() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() =>
    api.auth.hasSession() ? leerLocal('cafesmart_usuario', null) : null,
  );

  useEffect(() => {
    localStorage.removeItem('cafesmart_usuarios');
    if (!api.auth.hasSession()) {
      localStorage.removeItem('cafesmart_usuario');
    }
  }, []);

  const handleLogin = (nuevoUsuario) => {
    localStorage.setItem('cafesmart_usuario', JSON.stringify(nuevoUsuario));
    setUsuario(nuevoUsuario);
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

  const handleLogout = () => {
    api.auth.logout();
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
