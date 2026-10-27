import { useState } from 'react';
import Auth from './Auth';
import Onboarding from './components/Onboarding';
import Fincas from './modules/fincas/Fincas';
import Personal from './modules/personal/Personal';
import Inventario from './modules/inventario/Inventario';
import Finanzas from './modules/finanzas/Finanzas';
import AgenteIA from './AgenteIA';

import HeaderMobile from './components/layout/HeaderMobile';
import Sidebar from './components/layout/Sidebar';

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
    inventario: false,
    administracion: false,
    ia: false,
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
      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
          font-family: system-ui, sans-serif;
          background-color: #f8fafc;
        }
        .sidebar {
          width: 290px;
          background: linear-gradient(180deg, #065f46 0%, #064e3b 40%, #052e16 100%);
          color: #ffffff;
          padding: 28px 18px;
          display: flex;
          flex-direction: column;
          gap: 26px;
          box-sizing: border-box;
          flex-shrink: 0;
          transition: transform 0.3s ease;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          border-right: 1px solid rgba(167, 243, 208, 0.18);
          box-shadow: 10px 0 40px -20px rgba(6, 78, 59, 0.9);
        }
        .sidebar::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(110, 231, 183, 0.4);
          border-radius: 10px;
        }
        .sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(110, 231, 183, 0.7);
        }
        .main-content {
          flex: 1;
          padding: 32px;
          box-sizing: border-box;
          max-width: 1000px;
          width: 100%;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .header-mobile {
          display: none;
          align-items: center;
          justify-content: space-between;
          background-color: #064e3b;
          padding: 16px 20px;
          color: white;
        }
        .btn-hamburguesa {
          background: transparent;
          border: none;
          color: #6ee7b7;
          font-size: 1.8rem;
          cursor: pointer;
        }
        .overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 40;
        }
        
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          .header-mobile {
            display: flex;
          }
          .main-content {
            padding: 16px;
          }
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            overflow-y: auto;
          }
          .sidebar.abierto {
            transform: translateX(0);
          }
          .overlay.abierto {
            display: block;
          }
          .btn-cerrar-movil {
            display: block !important;
          }
        }
      `}</style>

      {!isOnline && (
        <div
          style={{
            backgroundColor: '#f59e0b',
            color: '#1f2937',
            textAlign: 'center',
            padding: '8px 12px',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
        >
          Modo sin conexión. Los datos se guardarán localmente y se sincronizarán al recuperar conexión.
        </div>
      )}

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

          {moduloActivo === 'inventario' && (
            <Inventario usuario={usuario} subSeccion={subSeccionActiva} />
          )}

          {moduloActivo === 'administracion' && (
            <Finanzas usuario={usuario} subSeccion={subSeccionActiva} />
          )}
        </main>
      </div>

      <AgenteIA usuario={usuario} />
    </>
  );
}
