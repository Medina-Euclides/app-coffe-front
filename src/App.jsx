import { useState, useEffect } from 'react';
import Auth from './Auth';
import Personal from './Personal';
import Fincas from './Fincas';
import Finanzas from './Finanzas';

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

  // 1. LÓGICA MEJORADA PARA EXTRAER EL NOMBRE REAL (o recortar el correo)
  const obtenerNombreMostrar = () => {
    if (usuario?.nombre) return usuario.nombre;
    if (usuario?.name) return usuario.name;
    if (usuario?.displayName) return usuario.displayName;
    if (usuario?.username) return usuario.username;
    
    // Si solo hay correo, recortamos lo que está antes de la @
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
          width: 280px;
          background-color: #064e3b;
          color: #ffffff;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-sizing: border-box;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .main-content {
          flex: 1;
          padding: 32px;
          box-sizing: border-box;
          max-width: 1000px;
          width: 100%;
          overflow-x: hidden;
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

      <div className="app-container">
        <div className="header-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/icon.png" alt="Logo CafeSmart" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#6ee7b7' }}>CafeSmart</h1>
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
            paddingBottom: '16px', 
            borderBottom: '1px solid #047857' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/icon.png" alt="Logo CafeSmart" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#6ee7b7' }}>CafeSmart</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#a7f3d0' }}>Gestión Cafetera</p>
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
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#a7f3d0',
                      padding: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontSize: '0.75rem',
                    }}
                  >
                    {grupo.titulo}
                    <span style={{ 
                      fontSize: '0.8rem', 
                      transform: estaDesplegado ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      ▼
                    </span>
                  </button>

                  {estaDesplegado && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {grupo.opciones.map((opcion) => {
                        const estaActivo = moduloActivo === grupo.modulo && subSeccionActiva === opcion.id;

                        return (
                          <button
                            key={opcion.id}
                            type="button"
                            onClick={() => navegarA(grupo.modulo, opcion.id, grupo.id)}
                            style={{
                              textAlign: 'left',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: estaActivo ? '#047857' : 'transparent',
                              color: estaActivo ? '#ffffff' : '#d1fae5',
                              fontWeight: estaActivo ? 'bold' : 'normal',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: '0.9rem'
                            }}
                          >
                            <div>{opcion.titulo}</div>
                            <div style={{ fontSize: '0.75rem', color: estaActivo ? '#a7f3d0' : '#6ee7b7', opacity: 0.8 }}>
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
            paddingTop: '16px', 
            borderTop: '1px solid #047857',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                color: '#6ee7b7',
                flexShrink: 0
              }}>
                {inicialMostrar}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textTransform: 'capitalize' }}>
                  {nombreMostrar}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#a7f3d0' }}>Sesión activa</p>
              </div>
            </div>

            <button
              type="button"
              onClick={cerrarSesion}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: '#fca5a5',
                border: '1px solid #f87171',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.85rem'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#fef2f2';
                e.target.style.color = '#dc2626';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#fca5a5';
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
    </>
  );
}