import { useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import RoutesApp from './routes/RoutesApp.jsx';
import { leerLocal } from './utils/storage.js';

function AppRoutes() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(() =>
    leerLocal('cafesmart_usuario', null),
  );

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
    const usuariosGuardados = JSON.parse(
      localStorage.getItem('cafesmart_usuarios') || '[]',
    );
    if (!Array.isArray(usuariosGuardados)) {
      throw new Error('La lista de cuentas guardadas no es válida.');
    }
    if (!usuariosGuardados.some((guardado) => guardado.id === usuario.id)) {
      throw new Error('No se encontró la cuenta para completar el registro.');
    }
    const usuariosActualizados = usuariosGuardados.map((guardado) =>
      guardado.id === usuario.id ? usuarioActualizado : guardado,
    );

    localStorage.setItem(
      'cafesmart_usuarios',
      JSON.stringify(usuariosActualizados),
    );
    localStorage.setItem(
      'cafesmart_usuario',
      JSON.stringify(usuarioActualizado),
    );
    setUsuario(usuarioActualizado);
    navigate('/inicio', { replace: true });
  };

  const handleLogout = () => {
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
