import { formatearMiles, desformatearNumero } from '../../../utils/formatters';

export default function TarifasCatalogo({
  tarifaKg,
  setTarifaKg,
  tarifaJornal,
  setTarifaJornal,
  actividades,
  nuevaActividadNombre,
  setNuevaActividadNombre,
  onAgregarActividad,
  onEliminarActividad,
}) {
  const campoEstilo = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 44,
    padding: 10,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    marginTop: 6,
    background: '#fff',
  };

  const etiquetaEstilo = {
    display: 'block',
    marginBottom: 16,
    fontWeight: 600,
    color: '#334155',
  };

  const botonEstilo = {
    minHeight: 44,
    border: 0,
    borderRadius: 8,
    padding: '10px 16px',
    background: '#047857',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  };

  return (
    <section id="tarifas-actividades">
      <article
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Tarifas de mano de obra</h3>
        <p style={{ color: '#64748b', marginBottom: 16, fontSize: '0.9rem' }}>
          Los nuevos registros guardan la tarifa aplicada. Cambiar una tarifa no modifica los pagos ya cerrados.
        </p>

        <label style={etiquetaEstilo}>
          Tarifa por kilogramo (COP)
          <input
            type="text"
            inputMode="numeric"
            value={formatearMiles(tarifaKg)}
            onChange={(e) => setTarifaKg(desformatearNumero(e.target.value))}
            required
            style={campoEstilo}
            placeholder="Ej. 1.000"
          />
        </label>

        <label style={etiquetaEstilo}>
          Tarifa por jornal/día (COP)
          <input
            type="text"
            inputMode="numeric"
            value={formatearMiles(tarifaJornal)}
            onChange={(e) => setTarifaJornal(desformatearNumero(e.target.value))}
            required
            style={campoEstilo}
            placeholder="Ej. 50.000"
          />
        </label>

        <button
          type="button"
          style={botonEstilo}
          onClick={() => {
            if (Number(tarifaKg) <= 0 || Number(tarifaJornal) <= 0) {
              alert('Las tarifas deben ser mayores que cero.');
              return;
            }
            alert('Las tarifas quedaron guardadas.');
          }}
        >
          Confirmar tarifas
        </button>
      </article>

      <article
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Catálogo de actividades laborales</h3>
        <form onSubmit={onAgregarActividad} style={{ marginBottom: 24 }}>
          <label style={etiquetaEstilo}>
            Nombre de la nueva actividad
            <input
              type="text"
              value={nuevaActividadNombre}
              onChange={(e) => setNuevaActividadNombre(e.target.value)}
              maxLength={100}
              required
              style={campoEstilo}
              placeholder="Ej. Preparación de almácigo"
            />
          </label>
          <button type="submit" style={botonEstilo}>
            Agregar actividad
          </button>
        </form>

        <h4 style={{ color: '#1e293b', marginBottom: 12, fontSize: '1rem' }}>
          Actividades actuales
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {actividades.map((a) => (
            <div
              key={a}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                gap: 16,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>{a}</span>
              <button
                type="button"
                onClick={() => onEliminarActividad(a)}
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>✕</span> Eliminar
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
