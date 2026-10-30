export default function LoteDetalle({
  lote,
  produccionTotal,
  historialJornadas,
  obtenerNombreTrabajador,
  onVolver,
  onIniciarEdicion,
  onCambiarEstado,
}) {
  if (!lote) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <button
        type="button"
        onClick={onVolver}
        style={{
          backgroundColor: '#64748b',
          color: 'white',
          border: 'none',
          padding: '12px 18px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontWeight: 'bold',
          minHeight: '48px',
          alignSelf: 'flex-start',
        }}
      >
        Volver a la lista
      </button>

      <div
        style={{
          backgroundColor: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          padding: '22px',
          borderRadius: '18px',
        }}
      >
        <h3
          style={{
            color: '#166534',
            margin: '0 0 10px 0',
            fontSize: '1.3rem',
          }}
        >
          {lote.nombre}
        </h3>

        <p style={{ margin: '6px 0', color: '#334155' }}>
          <strong>Variedad:</strong> {lote.variedad}
        </p>

        <p style={{ margin: '6px 0', color: '#334155' }}>
          <strong>Área:</strong> {lote.hectareas ? `${lote.hectareas} Ha` : 'No especificada'}
        </p>

        {lote.description && (
          <p style={{ margin: '6px 0', color: '#334155' }}>
            <strong>Descripción:</strong> {lote.description}
          </p>
        )}

        <p style={{ margin: '6px 0', color: '#334155' }}>
          <strong>Estado:</strong>{' '}
          <span
            style={{
              fontWeight: 'bold',
              color: lote.estado === 'inactivo' ? '#dc2626' : '#059669',
            }}
          >
            {lote.estado === 'inactivo'
              ? 'Inactivo / En Descanso'
              : 'Activo en Cosecha'}
          </span>
        </p>

        {/* SECCIÓN DE FECHAS */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #d1fae5',
            padding: '12px 16px',
            borderRadius: '10px',
            marginTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.85rem',
            color: '#475569',
          }}
        >
          <div>
            <strong>Fecha de creación:</strong> {lote.fechaCreacion || 'No registrada'}
          </div>

          {lote.fechaDesactivacion && (
            <div>
              <strong>Última desactivación:</strong> {lote.fechaDesactivacion}
            </div>
          )}

          {lote.fechaReactivacion && (
            <div>
              <strong>Última reactivación:</strong> {lote.fechaReactivacion}
            </div>
          )}
        </div>

        {/* ACCIONES */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {lote.estado !== 'inactivo' && (
            <button
              type="button"
              onClick={() => onIniciarEdicion(lote)}
              style={{
                flex: 1,
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              Editar Lote
            </button>
          )}

          {lote.estado === 'inactivo' ? (
            <button
              type="button"
              onClick={() => onCambiarEstado(lote.id, 'activo')}
              style={{
                flex: 1,
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              Reactivar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCambiarEstado(lote.id, 'inactivo')}
              style={{
                flex: 1,
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              Desactivar
            </button>
          )}
        </div>

        <hr
          style={{
            margin: '18px 0',
            border: 'none',
            borderTop: '1px solid #bbf7d0',
          }}
        />

        <span
          style={{
            fontSize: '0.85rem',
            color: '#15803d',
            fontWeight: 'bold',
          }}
        >
          PRODUCCIÓN ACUMULADA:
        </span>

        <h2
          style={{
            color: '#15803d',
            margin: '6px 0 0 0',
            fontSize: '1.8rem',
          }}
        >
          {produccionTotal} Kg
        </h2>
      </div>

      <h4 style={{ color: '#334155', margin: '6px 0' }}>
        Historial de Trabajos en este Lote:
      </h4>

      {historialJornadas.length === 0 ? (
        <p style={{ color: '#64748b' }}>No hay registros de trabajo en este lote.</p>
      ) : (
        historialJornadas.map((j) => (
          <div
            key={j.id}
            style={{
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
              <strong style={{ color: '#047857', fontSize: '1.05rem' }}>
                {obtenerNombreTrabajador(j.trabajadorId)}
              </strong>
              <p
                style={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  margin: '4px 0 0 0',
                }}
              >
                {j.fecha} — {j.modalidad === 'recoleccion' ? 'Recolección' : 'Jornal'}
              </p>
            </div>

            <span
              style={{
                color: '#15803d',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              {j.modalidad === 'recoleccion'
                ? `${j.cantidad} Kg`
                : `${j.cantidad} Días`}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
