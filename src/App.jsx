import { useState, useEffect } from 'react';
import Auth from './Auth';
import Fincas from './Fincas';
import Personal from './Personal';
import Finanzas from './Finanzas';
import AgenteIA from './AgenteIA';

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('cafesmart_usuario_activo');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  const [moduloActivo, setModuloActivo] = useState('fincas');
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const manejarResize = () => {
      setEsMovil(window.innerWidth <= 768);
    };
    window.addEventListener('resize', manejarResize);
    return () => window.removeEventListener('resize', manejarResize);
  }, []);

  const iniciarSesion = (datosUsuario) => {
    setUsuario(datosUsuario);
    localStorage.setItem('cafesmart_usuario_activo', JSON.stringify(datosUsuario));
  };

  const cerrarSesion = () => {
    setUsuario(null);
    localStorage.removeItem('cafesmart_usuario_activo');
  };

  if (!usuario) {
    return <Auth onLogin={iniciarSesion} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', minHeight: '100vh', backgroundColor: '#f3f6f4' }}>
      
      {/* NAVEGACIÓN EN PC: SIDEBAR EN VERDE BOSQUE PROFUNDO */}
      {!esMovil && (
        <aside style={{
          width: '270px',
          backgroundColor: '#124d2d', // Color principal de image_0.png
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '28px 20px',
          boxShadow: '4px 0 20px rgba(18, 77, 45, 0.15)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxSizing: 'border-box'
        }}>
          <div>
            {/* LOGO Y MARCA EN PC */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
              <img 
                src="/icon.png" 
                alt="Logo CafeSmart" 
                style={{ width: '46px', height: '46px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} 
              />
              <div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 'bold', color: '#ffffff', letterSpacing: '-0.3px' }}>CafeSmart</h1>
                <span style={{ fontSize: '0.8rem', color: '#9be0a2', fontWeight: '500' }}>{usuario?.nombreProductor || 'Productor'}</span>
              </div>
            </div>

            {/* MENÚ PC */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => setModuloActivo('fincas')}
                style={{
                  textAlign: 'left',
                  backgroundColor: moduloActivo === 'fincas' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  fontWeight: moduloActivo === 'fincas' ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: moduloActivo === 'fincas' ? '4px solid #9be0a2' : '4px solid transparent'
                }}
              >
                Fincas y Lotes
              </button>

              <button 
                onClick={() => setModuloActivo('personal')}
                style={{
                  textAlign: 'left',
                  backgroundColor: moduloActivo === 'personal' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  fontWeight: moduloActivo === 'personal' ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: moduloActivo === 'personal' ? '4px solid #9be0a2' : '4px solid transparent'
                }}
              >
                Personal y Jornadas
              </button>

              <button 
                onClick={() => setModuloActivo('finanzas')}
                style={{
                  textAlign: 'left',
                  backgroundColor: moduloActivo === 'finanzas' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: 'white',
                  border: 'none',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  fontWeight: moduloActivo === 'finanzas' ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: moduloActivo === 'finanzas' ? '4px solid #9be0a2' : '4px solid transparent'
                }}
              >
                Finanzas e Indicadores
              </button>
            </nav>
          </div>

          <button 
            onClick={cerrarSesion} 
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '12px', 
              fontSize: '0.95rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Cerrar Sesión
          </button>
        </aside>
      )}

      {/* ENCABEZADO MÓVIL AMPLIO Y LIMPIO */}
      {esMovil && (
        <header style={{ 
          backgroundColor: '#124d2d', // Verde original image_0.png
          color: 'white', 
          padding: '16px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(18, 77, 45, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/icon.png" 
              alt="Logo CafeSmart" 
              style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.4)' }} 
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', lineHeight: '1.1' }}>CafeSmart</h1>
              <span style={{ fontSize: '0.78rem', color: '#9be0a2' }}>{usuario?.nombreProductor || 'Productor'}</span>
            </div>
          </div>

          <button 
            onClick={cerrarSesion} 
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '8px 14px', 
              borderRadius: '10px', 
              fontSize: '0.85rem', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Salir
          </button>
        </header>
      )}

      {/* ÁREA DE CONTENIDO CON MÁRGENES Y AIRE (AMI) */}
      <main style={{ 
        flex: 1, 
        padding: esMovil ? '22px 18px' : '36px', 
        paddingBottom: esMovil ? '105px' : '36px', 
        maxWidth: esMovil ? '100%' : '940px', 
        margin: esMovil ? '0' : '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {moduloActivo === 'fincas' && <Fincas usuario={usuario} />}
        {moduloActivo === 'personal' && <Personal usuario={usuario} />}
        {moduloActivo === 'finanzas' && <Finanzas usuario={usuario} />}
      </main>

      {/* ASISTENTE FLOTANTE IA */}
      <AgenteIA usuario={usuario} />

      {/* NAVEGACIÓN INFERIOR (BOTTOM NAV) MODERNA Y ESPACIOSA */}
      {esMovil && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e1e8e4',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '12px 14px',
          zIndex: 90,
          boxShadow: '0 -4px 18px rgba(18, 77, 45, 0.05)'
        }}>
          <button 
            onClick={() => setModuloActivo('fincas')}
            style={{
              flex: 1,
              background: moduloActivo === 'fincas' ? '#edf5edf0' : 'transparent', // Verde y blanco suave de acento
              border: 'none',
              color: moduloActivo === 'fincas' ? '#124d2d' : '#64748b',
              fontWeight: moduloActivo === 'fincas' ? 'bold' : '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              padding: '12px 6px',
              borderRadius: '14px',
              margin: '0 4px',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            Fincas
          </button>

          <button 
            onClick={() => setModuloActivo('personal')}
            style={{
              flex: 1,
              background: moduloActivo === 'personal' ? '#edf5edf0' : 'transparent',
              border: 'none',
              color: moduloActivo === 'personal' ? '#124d2d' : '#64748b',
              fontWeight: moduloActivo === 'personal' ? 'bold' : '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              padding: '12px 6px',
              borderRadius: '14px',
              margin: '0 4px',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            Personal
          </button>

          <button 
            onClick={() => setModuloActivo('finanzas')}
            style={{
              flex: 1,
              background: moduloActivo === 'finanzas' ? '#edf5edf0' : 'transparent',
              border: 'none',
              color: moduloActivo === 'finanzas' ? '#124d2d' : '#64748b',
              fontWeight: moduloActivo === 'finanzas' ? 'bold' : '600',
              fontSize: '0.88rem',
              cursor: 'pointer',
              padding: '12px 6px',
              borderRadius: '14px',
              margin: '0 4px',
              transition: 'all 0.15s ease-in-out'
            }}
          >
            Finanzas
          </button>
        </nav>
      )}
    </div>
  );
}