import { useState, useEffect } from 'react';
import Auth from './Auth';
import Personal from './Personal';
import Fincas from './Fincas';
import Finanzas from './Finanzas';
import AgenteIA from './AgenteIA';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import SyncStatus from './components/SyncStatus';

const MENUS = [
  {
    id: 'cultivo',
    titulo: 'Cultivo',
    descripcion: 'Gestión de fincas y lotes',
    modulo: 'fincas',
    opciones: [
      { id: 'fincas-lotes', titulo: 'Fincas y Lotes', detalle: 'Inventario general' },
      { id: 'nuevo-lote', titulo: 'Crear Nuevo Lote', detalle: 'Agregar lote a la finca' },
      { id: 'nueva-finca', titulo: 'Crear Nueva Finca', detalle: 'Registrar finca adicional' },
    ],
  },
  {
    id: 'personal',
    titulo: 'Personal',
    descripcion: 'Gestión de labores y trabajadores',
    modulo: 'personal',
    opciones: [
      { id: 'liquidaciones', titulo: 'Liquidaciones', detalle: 'Saldos y pagos pendientes' },
      { id: 'registrar-labor', titulo: 'Registrar labor', detalle: 'Asignar actividad' },
      { id: 'nuevo-trabajador', titulo: 'Nuevo trabajador', detalle: 'Agregar personal' },
      { id: 'tarifas-actividades', titulo: 'Tarifas y actividades', detalle: 'Precios y catálogo' },
    ],
  },
  {
    id: 'administracion',
    titulo: 'Administración',
    descripcion: 'Control financiero y balances',
    modulo: 'finanzas',
    opciones: [
      { id: 'finanzas-indicadores', titulo: 'Finanzas e indicadores', detalle: 'Balances e historial' },
      { id: 'nuevo-movimiento', titulo: 'Registrar movimiento', detalle: 'Ingresos y egresos' },
    ],
  },
];

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('cafesmart_usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

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
    localStorage.setItem('cafesmart_usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
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

  const obtenerNombreMostrar = () => {
    if (usuario?.nombre) return usuario.nombre;
    if (usuario?.name) return usuario.name;
    if (usuario?.displayName) return usuario.displayName;
    if (usuario?.username) return usuario.username;
    
    if (usuario?.correo) return usuario.correo.split('@')[0];
    if (usuario?.email) return usuario.email.split('@')[0];
    
    return 'Usuario';
  };

  const nombreMostrar = obtenerNombreMostrar();
  const inicialMostrar = nombreMostrar.charAt(0).toUpperCase();

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
            fontSize: '0.9rem'
          }}
        >
          Modo sin conexión. Los datos se guardarán localmente y se sincronizarán al recuperar conexión.
        </div>
      )}

      <div className="app-container">
        <div className="header-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/icon.png" alt="Logo CafeSmart" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#6ee7b7' }}>CafeSmart</h1>
            <span
              title={isOnline ? 'Conectado' : 'Sin conexión'}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#22c55e' : '#f59e0b',
                boxShadow: isOnline ? '0 0 6px rgba(34, 197, 94, 0.8)' : '0 0 6px rgba(245, 158, 11, 0.8)'
              }}
            />
          </div>
          <button className="btn-hamburguesa" onClick={() => setMenuMobileAbierto(true)}>
            ☰
          </button>
        </div>

        <div 
          className={`overlay ${menuMobileAbierto ? 'abierto' : ''}`} 
          onClick={() => setMenuMobileAbierto(false)}
        ></div>

        <aside className={`sidebar ${menuMobileAbierto ? 'abierto' : ''}`}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingBottom: '18px', 
            borderBottom: '1px solid rgba(167, 243, 208, 0.18)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'radial-gradient(circle at top, rgba(167, 243, 208, 0.35), rgba(5, 150, 105, 0.25))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px -24px rgba(52, 211, 153, 0.9)'
              }}>
                <img src="/icon.png" alt="Logo CafeSmart" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.42rem', color: '#ecfdf5', letterSpacing: '-0.01em' }}>CafeSmart</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#a7f3d0', opacity: 0.8 }}>Gestión Cafetera</p>
              </div>
            </div>
            <button 
              onClick={() => setMenuMobileAbierto(false)}
              style={{ display: 'none', background: 'transparent', border: 'none', color: '#a7f3d0', fontSize: '2rem', cursor: 'pointer' }}
              className="btn-cerrar-movil"
            >
              ×
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {MENUS.map((grupo) => {
              const estaDesplegado = menusDesplegados[grupo.id];

              return (
                <div key={grupo.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <button
                    type="button"
                    onClick={() => alternarDespliegue(grupo.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: estaDesplegado ? 'rgba(167, 243, 208, 0.08)' : 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '10px',
                      color: '#d1fae5',
                      padding: '9px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      fontSize: '0.72rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {grupo.titulo}
                    <span style={{ 
                      fontSize: '0.75rem', 
                      transform: estaDesplegado ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      opacity: 0.8
                    }}>
                      ▼
                    </span>
                  </button>

                  {estaDesplegado && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', paddingLeft: '6px' }}>
                      {grupo.opciones.map((opcion) => {
                        const estaActivo = moduloActivo === grupo.modulo && subSeccionActiva === opcion.id;

                        return (
                          <button
                            key={opcion.id}
                            type="button"
                            onClick={() => navegarA(grupo.modulo, opcion.id, grupo.id)}
                            style={{
                              textAlign: 'left',
                              padding: '11px 14px',
                              borderRadius: '12px',
                              border: estaActivo ? '1px solid rgba(167, 243, 208, 0.45)' : '1px solid transparent',
                              background: estaActivo
                                ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.28) 0%, rgba(4, 120, 87, 0.18) 100%)'
                                : 'transparent',
                              color: estaActivo ? '#f0fdf4' : '#d1fae5',
                              fontWeight: estaActivo ? '700' : '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontSize: '0.92rem',
                              boxShadow: estaActivo ? '0 10px 30px -18px rgba(52, 211, 153, 0.9)' : 'none',
                            }}
                          >
                            <div>{opcion.titulo}</div>
                            <div style={{ fontSize: '0.74rem', color: estaActivo ? '#a7f3d0' : '#86efac', opacity: estaActivo ? 0.9 : 0.8, marginTop: '2px' }}>
                              {opcion.detalle}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div style={{ 
            marginTop: 'auto', 
            paddingTop: '18px', 
            borderTop: '1px solid rgba(167, 243, 208, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isOnline ? '#a7f3d0' : '#fbbf24', fontSize: '0.8rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#22c55e' : '#f59e0b'
                }}
              />
              {isOnline ? 'Conectado' : 'Sin conexión - Modo offline'}
            </div>

            <SyncStatus />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(167, 243, 208, 0.08)', border: '1px solid rgba(167, 243, 208, 0.16)' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at top, #a7f3d0, #22c55e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '1.1rem',
                color: '#052e16',
                flexShrink: 0,
                boxShadow: '0 18px 40px -22px rgba(74, 222, 128, 0.9)'
              }}>
                {inicialMostrar}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '0.96rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textTransform: 'capitalize', color: '#f0fdf4' }}>
                  {nombreMostrar}
                </p>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#a7f3d0', opacity: 0.8 }}>Sesión activa</p>
              </div>
            </div>

            <button
              type="button"
              onClick={cerrarSesion}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: '#fecaca',
                border: '1px solid rgba(248, 113, 113, 0.6)',
                padding: '11px',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.88rem',
                letterSpacing: '0.01em'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'rgba(248, 113, 113, 0.18)';
                e.target.style.color = '#fee2e2';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#fecaca';
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

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