import { useState, useRef, useEffect } from 'react';

export default function AgenteIA({ usuario }) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([
    {
      remitente: 'ia',
      texto: 'Hola, soy tu asistente CafeSmart. ¿En qué puedo ayudarte hoy con tus lotes, cosechas o finanzas?'
    }
  ]);

  const finMensajesRef = useRef(null);

  useEffect(() => {
    if (abierto) {
      finMensajesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [historial, abierto]);

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const nuevoHistorial = [
      ...historial,
      { remitente: 'usuario', texto: mensaje }
    ];
    setHistorial(nuevoHistorial);
    setMensaje('');

    setTimeout(() => {
      setHistorial([
        ...nuevoHistorial,
        {
          remitente: 'ia',
          texto: 'He registrado tu consulta. En la versión con Backend responderé analizando la información de tu finca en tiempo real.'
        }
      ]);
    }, 1000);
  };

  return (
    <>
      {/* BOTÓN FLOTANTE UBICADO POR ENCIMA DEL BOTTOM NAV */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '16px',
            backgroundColor: '#059669',
            color: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 99,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Asistente IA
        </button>
      )}

      {/* VENTANA DEL CHAT PARA CELULAR */}
      {abierto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 1000,
            padding: '10px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              height: '85vh',
              maxHeight: '650px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}
          >
            {/* CABECERA DE LA VENTANA */}
            <div
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Asistente CafeSmart</h3>
                <span style={{ fontSize: '0.78rem', color: '#d1fae5' }}>Consultas operativas</span>
              </div>
              <button
                onClick={() => setAbierto(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>

            {/* ÁREA DE MENSAJES */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {historial.map((h, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: h.remitente === 'usuario' ? 'flex-end' : 'flex-start',
                    backgroundColor: h.remitente === 'usuario' ? '#059669' : '#ffffff',
                    color: h.remitente === 'usuario' ? '#ffffff' : '#1e293b',
                    padding: '12px 16px',
                    borderRadius: h.remitente === 'usuario' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    maxWidth: '82%',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    fontSize: '0.95rem',
                    lineHeight: '1.4'
                  }}
                >
                  {h.texto}
                </div>
              ))}
              <div ref={finMensajesRef} />
            </div>

            {/* CAJA DE TEXTO Y BOTÓN BIEN DIMENSIONADOS (AMI) */}
            <form
              onSubmit={enviarMensaje}
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                placeholder="Escribe tu consulta..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                style={{
                  flex: 1,
                  minHeight: '52px',
                  marginBottom: 0,
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
              <button
                type="submit"
                style={{
                  minHeight: '52px',
                  padding: '0 20px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                  marginBottom: 0
                }}
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}