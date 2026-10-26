import SyncStatus from '../SyncStatus';
import { MENUS_NAVEGACION } from '../../utils/constants';

export default function Sidebar({
  menuMobileAbierto,
  onCerrarMenu,
  menus = MENUS_NAVEGACION,
  menusDesplegados,
  onAlternarDespliegue,
  moduloActivo,
  subSeccionActiva,
  onNavegarA,
  isOnline,
  usuario,
  onCerrarSesion,
}) {
  const obtenerNombreMostrar = () => {
    if (usuario?.nombre) return usuario.nombre;
    if (usuario?.name) return usuario.name;
    if (usuario?.displayName) return usuario.displayName;
    if (usuario?.username) return usuario.username;
    if (usuario?.nombreProductor) return usuario.nombreProductor;
    if (usuario?.correo) return usuario.correo.split('@')[0];
    if (usuario?.email) return usuario.email.split('@')[0];
    return 'Usuario';
  };

  const nombreMostrar = obtenerNombreMostrar();
  const inicialMostrar = nombreMostrar.charAt(0).toUpperCase();

  return (
    <>
      <div
        className={`overlay ${menuMobileAbierto ? 'abierto' : ''}`}
        onClick={onCerrarMenu}
      />

      <aside className={`sidebar ${menuMobileAbierto ? 'abierto' : ''}`}>
        {/* ENCABEZADO LOGO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '18px',
            borderBottom: '1px solid rgba(167, 243, 208, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background:
                  'radial-gradient(circle at top, rgba(167, 243, 208, 0.35), rgba(5, 150, 105, 0.25))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px -24px rgba(52, 211, 153, 0.9)',
              }}
            >
              <img
                src="/icon.png"
                alt="Logo CafeSmart"
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.42rem',
                  color: '#ecfdf5',
                  letterSpacing: '-0.01em',
                }}
              >
                CafeSmart
              </h1>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '0.82rem',
                  color: '#a7f3d0',
                  opacity: 0.8,
                }}
              >
                Gestión Cafetera
              </p>
            </div>
          </div>
          <button
            onClick={onCerrarMenu}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              fontSize: '2rem',
              cursor: 'pointer',
            }}
            className="btn-cerrar-movil"
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        {/* NAVEGACIÓN */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {menus.map((grupo) => {
            const estaDesplegado = menusDesplegados[grupo.id];

            return (
              <div key={grupo.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  onClick={() => onAlternarDespliegue(grupo.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: estaDesplegado
                      ? 'rgba(167, 243, 208, 0.08)'
                      : 'transparent',
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
                  <span
                    style={{
                      fontSize: '0.75rem',
                      transform: estaDesplegado ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      opacity: 0.8,
                    }}
                  >
                    ▼
                  </span>
                </button>

                {estaDesplegado && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginTop: '6px',
                      paddingLeft: '6px',
                    }}
                  >
                    {grupo.opciones.map((opcion) => {
                      const estaActivo =
                        moduloActivo === grupo.modulo && subSeccionActiva === opcion.id;

                      return (
                        <button
                          key={opcion.id}
                          type="button"
                          onClick={() => onNavegarA(grupo.modulo, opcion.id, grupo.id)}
                          style={{
                            textAlign: 'left',
                            padding: '11px 14px',
                            borderRadius: '12px',
                            border: estaActivo
                              ? '1px solid rgba(167, 243, 208, 0.45)'
                              : '1px solid transparent',
                            background: estaActivo
                              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.28) 0%, rgba(4, 120, 87, 0.18) 100%)'
                              : 'transparent',
                            color: estaActivo ? '#f0fdf4' : '#d1fae5',
                            fontWeight: estaActivo ? '700' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.92rem',
                            boxShadow: estaActivo
                              ? '0 10px 30px -18px rgba(52, 211, 153, 0.9)'
                              : 'none',
                          }}
                        >
                          <div>{opcion.titulo}</div>
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: estaActivo ? '#a7f3d0' : '#86efac',
                              opacity: estaActivo ? 0.9 : 0.8,
                              marginTop: '2px',
                            }}
                          >
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

        {/* PIE DEL SIDEBAR / SESIÓN */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '18px',
            borderTop: '1px solid rgba(167, 243, 208, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isOnline ? '#a7f3d0' : '#fbbf24',
              fontSize: '0.8rem',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#22c55e' : '#f59e0b',
              }}
            />
            {isOnline ? 'Conectado' : 'Sin conexión - Modo offline'}
          </div>

          <SyncStatus />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '14px',
              background: 'rgba(167, 243, 208, 0.08)',
              border: '1px solid rgba(167, 243, 208, 0.16)',
            }}
          >
            <div
              style={{
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
                boxShadow: '0 18px 40px -22px rgba(74, 222, 128, 0.9)',
              }}
            >
              {inicialMostrar}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.96rem',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  textTransform: 'capitalize',
                  color: '#f0fdf4',
                }}
              >
                {nombreMostrar}
              </p>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#a7f3d0', opacity: 0.8 }}>
                Sesión activa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrarSesion}
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
              letterSpacing: '0.01em',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.18)';
              e.currentTarget.style.color = '#fee2e2';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#fecaca';
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
