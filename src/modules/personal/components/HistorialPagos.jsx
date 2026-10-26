import { dinero } from '../../../utils/formatters';
import { OPCIONES_JORNAL } from '../../../utils/constants';

export default function HistorialPagos({
  fincaSeleccionada,
  busquedaHistorial,
  setBusquedaHistorial,
  periodoHistorial,
  setPeriodoHistorial,
  historialAgrupado,
  campo,
}) {
  return (
    <>
      <h3 style={{ marginTop: 28 }}>Historial de labores pagadas</h3>

      {/* BARRA DE BÚSQUEDA Y FILTRO */}
      {fincaSeleccionada && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #cbd5e1',
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 200px' }}>
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#475569',
                display: 'block',
              }}
            >
              Buscar trabajador por nombre o cédula
              <input
                type="text"
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value || '')}
                placeholder="Ej. Carlos o 1061..."
                style={{ ...campo, marginTop: 4, minHeight: 40 }}
              />
            </label>
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#475569',
                display: 'block',
              }}
            >
              Filtrar por período
              <select
                value={periodoHistorial}
                onChange={(e) => setPeriodoHistorial(e.target.value)}
                style={{ ...campo, marginTop: 4, minHeight: 40 }}
              >
                <option value="todos">Histórico completo</option>
                <option value="este_mes">Este mes</option>
                <option value="mes_anterior">Mes anterior</option>
                <option value="este_ano">Año actual</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {!fincaSeleccionada ? (
        <p>Selecciona una finca para consultar el historial.</p>
      ) : historialAgrupado.length === 0 ? (
        <p
          style={{
            color: '#64748b',
            padding: 16,
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}
        >
          {busquedaHistorial || periodoHistorial !== 'todos'
            ? 'No se encontraron pagos con los filtros aplicados.'
            : `No hay labores pagadas registradas para ${fincaSeleccionada.nombre}.`}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historialAgrupado.map((grupo) => (
            <article
              key={grupo.idUnico}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  paddingBottom: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <strong style={{ fontSize: '1.1rem', color: '#047857', display: 'block' }}>
                    {grupo.trabajador} {grupo.cedula ? `(C.C. ${grupo.cedula})` : ''}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Día laborado: {grupo.fecha}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>
                    Pagado el: {grupo.fechaPago}
                  </span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                {grupo.labores.map((labor) => {
                  let textoCantidad = `${labor.cantidad} días`;
                  if (labor.modalidad === 'jornal') {
                    const opc = OPCIONES_JORNAL.find((o) => o.valor === String(labor.cantidad));
                    if (opc) textoCantidad = opc.etiqueta;
                  } else {
                    textoCantidad = `${labor.cantidad} kg`;
                  }

                  return (
                    <li
                      key={labor.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.95rem',
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ color: '#334155' }}>
                        • {labor.actividad} ({textoCantidad})
                      </span>
                      <span style={{ color: '#64748b' }}>
                        {dinero(labor.subtotal)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div
                style={{
                  textAlign: 'right',
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: 10,
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#475569', marginRight: 10 }}>
                  Total del día:
                </span>
                <strong style={{ fontSize: '1.2rem', color: '#15803d' }}>
                  {dinero(grupo.totalPagado)}
                </strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
