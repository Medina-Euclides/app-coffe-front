import { useState } from 'react';

export default function Onboarding({ usuario, onComplete }) {
  const [paso, setPaso] = useState(1);
  const [nombreFinca, setNombreFinca] = useState('');

  const crearFinca = () => {
    if (!nombreFinca.trim()) {
      alert('Por favor, ingresa el nombre de tu finca.');
      return;
    }

    try {
      const fincaInicial = [{
        id: Date.now(),
        nombre: nombreFinca.trim(),
        ubicacion: 'Principal'
      }];
      localStorage.setItem(`cafesmart_fincas_${usuario.id}`, JSON.stringify(fincaInicial));
      onComplete();
    } catch (e) {
      console.error('Error al crear finca:', e);
      alert('Ocurrió un error al guardar la finca.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(6, 78, 59, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-in'
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {paso === 1 && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              padding: '40px 32px',
              textAlign: 'center',
              color: '#ffffff'
            }}>
              <img src="/icon.png" alt="Logo CafeSmart" style={{ width: '70px', height: '70px', marginBottom: '16px', objectFit: 'contain' }} />
              <h1 style={{ margin: '0 0 12px', fontSize: '1.8rem', fontWeight: '800' }}>
                ¡Bienvenido a CafeSmart!
              </h1>
              <p style={{ margin: 0, fontSize: '1rem', opacity: 0.95, lineHeight: '1.6' }}>
                Te damos la bienvenida, {usuario?.nombreProductor || 'Productor'}.
                Vamos a configurar tu finca paso a paso.
              </p>
            </div>
            <div style={{ padding: '32px' }}>
              <button
                onClick={() => setPaso(2)}
                style={{
                  width: '100%',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#065f46'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#047857'}
              >
                Comenzar Guía
              </button>
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              padding: '32px',
              textAlign: 'center',
              color: '#ffffff'
            }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '800' }}>
                Registra tu Finca
              </h2>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95 }}>
                Paso 1 de 3
              </p>
            </div>
            <div style={{ padding: '32px' }}>
              <p style={{ margin: '0 0 20px', color: '#475569', lineHeight: '1.6', textAlign: 'center' }}>
                Para empezar, necesitamos saber el nombre de tu finca principal.
              </p>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>
                  Nombre de tu Finca Principal
                </label>
                <input
                  type="text"
                  placeholder="Ej: Finca El Roble"
                  value={nombreFinca}
                  onChange={(e) => setNombreFinca(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '2px solid #cbd5e1',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
              <button
                onClick={crearFinca}
                style={{
                  width: '100%',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#065f46'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#047857'}
              >
                Guardar y Continuar
              </button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              padding: '32px',
              textAlign: 'center',
              color: '#ffffff'
            }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '800' }}>
                Guía Rápida PWA
              </h2>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95 }}>
                Paso 2 de 3
              </p>
            </div>
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>📱</div>
                  <div>
                    <h4 style={{ margin: '0 0 6px', color: '#065f46', fontSize: '0.95rem' }}>Instalar en tu dispositivo</h4>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      En Chrome/Edge: Menú (⋮) → "Instalar CafeSmart" o "Agregar a pantalla de inicio". Así tendrás acceso directo como una app.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚡</div>
                  <div>
                    <h4 style={{ margin: '0 0 6px', color: '#065f46', fontSize: '0.95rem' }}>Funciona sin conexión</h4>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      Puedes registrar fincas, trabajadores, labores y movimientos aunque no tengas internet. Se sincronizarán cuando vuelvas a conectarte.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔄</div>
                  <div>
                    <h4 style={{ margin: '0 0 6px', color: '#065f46', fontSize: '0.95rem' }}>Sincronización automática</h4>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      Cuando recuperes conexión, todo se sincroniza automáticamente. Verás el estado en el indicador de sincronización.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPaso(4)}
                style={{
                  width: '100%',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#065f46'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#047857'}
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {paso === 4 && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
              padding: '32px',
              textAlign: 'center',
              color: '#ffffff'
            }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: '800' }}>
                ¡Todo Listo!
              </h2>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95 }}>
                Paso 3 de 3
              </p>
            </div>
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h3 style={{ margin: '0 0 12px', color: '#065f46', fontSize: '1.3rem' }}>
                Tu finca está configurada
              </h3>
              <p style={{ margin: '0 0 28px', color: '#475569', lineHeight: '1.6' }}>
                Ya puedes empezar a gestionar tu producción cafetera. Usa el menú lateral para navegar entre los módulos.
              </p>
              <button
                onClick={onComplete}
                style={{
                  width: '100%',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#065f46'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#047857'}
              >
                Empezar a Usar CafeSmart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
