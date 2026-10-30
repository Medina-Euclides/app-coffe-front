export default function LotesList({
  lotes,
  verInactivos,
  onSeleccionarLote,
  calcularProduccionLote,
}) {
  return (
    <div
      id="fincas-lotes"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {lotes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '30px 20px',
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <p style={{ margin: 0, fontSize: '1rem' }}>
            {verInactivos
              ? 'No hay lotes inactivos en esta finca.'
              : 'Esta finca aún no tiene lotes activos registrados.'}
          </p>
        </div>
      ) : (
        lotes.map((lote) => {
          const kgTotal = calcularProduccionLote(lote);

          return (
            <div
              key={lote.id}
              onClick={() => onSeleccionarLote(lote)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <h4
                  style={{
                    color: '#047857',
                    margin: '0 0 6px 0',
                    fontSize: '1.15rem',
                  }}
                >
                  {lote.nombre}
                </h4>

                <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'block' }}>
                  {lote.variedad} — {lote.hectareas ? `${lote.hectareas} Ha` : 'Área no especificada'}
                </span>

                <span style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                  Creado: {lote.fechaCreacion || 'Fecha no registrada'}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    display: 'block',
                  }}
                >
                  Producción:
                </span>

                <strong
                  style={{ color: '#15803d', fontSize: '1.25rem' }}
                >
                  {kgTotal} Kg
                </strong>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
