import { useState } from 'react';
import Auth from './Auth';
import Onboarding from './components/Onboarding';
import Fincas from './modules/fincas/Fincas';
import Personal from './modules/personal/Personal';
import Finanzas from './modules/finanzas/Finanzas';
import AgenteIA from './AgenteIA';

import HeaderMobile from './components/layout/HeaderMobile';
import Sidebar from './components/layout/Sidebar';
import OfflineBanner from './components/layout/OfflineBanner';

import { useOnlineStatus } from './hooks/useOnlineStatus';
import { MENUS_NAVEGACION } from './utils/constants';
import { leerLocal, guardarLocal } from './utils/storage';

export default function App() {
  const [usuario, setUsuario] = useState(() =>
    leerLocal('cafesmart_usuario', null)
  );

  const [moduloActivo, setModuloActivo] = useState('fincas');
  const [subSeccionActiva, setSubSeccionActiva] = useState('fincas-lotes');
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);

  const [menusDesplegados, setMenusDesplegados] = useState({
    cultivo: true,
    personal: false,
    administracion: false,
  });

  const isOnline = useOnlineStatus();

  const manejarLogin = (datosUsuario) => {
    guardarLocal('cafesmart_usuario', datosUsuario);
    setUsuario(datosUsuario);
  };

  const completarOnboarding = () => {
    if (!usuario) return;
    const usuariosGuardados = leerLocal('cafesmart_usuarios', []);
    const actualizados = usuariosGuardados.map((u) => {
      if (u.id === usuario.id) {
        return { ...u, primerIngreso: false };
      }
      return u;
    });
    guardarLocal('cafesmart_usuarios', actualizados);
    const usuarioActualizado = { ...usuario, primerIngreso: false };
    guardarLocal('cafesmart_usuario', usuarioActualizado);
    setUsuario(usuarioActualizado);
  };

  const alternarDespliegue = (idMenu) => {
    setMenusDesplegados((prev) => ({
      ...prev,
      [idMenu]: !prev[idMenu],
    }));
  };

  const navegarA = (modulo, subSeccion, idMenu) => {
    setModuloActivo(modulo);
    setSubSeccionActiva(subSeccion);
    setMenusDesplegados((prev) => ({
      ...prev,
      [idMenu]: true,
    }));
    setMenuMobileAbierto(false);
  };

  const cerrarSesion = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('cafesmart_usuario');
      setUsuario(null);
    }
  };

  if (!usuario) {
    return <Auth onLogin={manejarLogin} />;
  }

  if (usuario.primerIngreso) {
    return <Onboarding usuario={usuario} onComplete={completarOnboarding} />;
  }

  return (
    <>
      <OfflineBanner isOnline={isOnline} />

      <div className="app-container">
        <HeaderMobile
          isOnline={isOnline}
          onAbrirMenu={() => setMenuMobileAbierto(true)}
        />

        <Sidebar
          menuMobileAbierto={menuMobileAbierto}
          onCerrarMenu={() => setMenuMobileAbierto(false)}
          menus={MENUS_NAVEGACION}
          menusDesplegados={menusDesplegados}
          onAlternarDespliegue={alternarDespliegue}
          moduloActivo={moduloActivo}
          subSeccionActiva={subSeccionActiva}
          onNavegarA={navegarA}
          isOnline={isOnline}
          usuario={usuario}
          onCerrarSesion={cerrarSesion}
        />

        <main className="main-content">
          {moduloActivo === 'fincas' && (
            <Fincas usuario={usuario} subSeccion={subSeccionActiva} />
          )}

          {moduloActivo === 'personal' && (
            <Personal usuario={usuario} subSeccion={subSeccionActiva} />
          )}

          {moduloActivo === 'finanzas' && (
            <Finanzas usuario={usuario} subSeccion={subSeccionActiva} />
          )}
        </main>
      </div>

      <AgenteIA usuario={usuario} />
    </>
  );
}
