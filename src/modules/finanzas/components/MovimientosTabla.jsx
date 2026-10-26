import { formatoDinero } from '../../../utils/formatters';

export default function MovimientosTabla({
  movimientos,
  fincas,
}) {
  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <h3 style={{ color: '#0f172a', margin: 0, fontSize: '1.05rem' }}>
          Tabla de transacciones registradas
        </h3>
        <span style={{ color: '#64748b', fontSize: 12 }}>
          {movimientos.length} registro(s)
        </span>
      </div>

      {movimientos.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: '#64748b',
            padding: 20,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            marginTop: 12,
            background: '#fff',
          }}
        >
          No hay movimientos en el periodo y finca seleccionados.
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            overflowX: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            WebkitOverflowScrolling: 'touch',
            background: '#fff',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                  Fecha
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                  Finca
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                  Tipo
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                  Categoría
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12 }}>
                  Descripción
                </th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                  Valor (COP)
                </th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => {
                const fincaMovimiento = fincas.find(
                  (f) => String(f.id) === String(m.fincaId)
                );
                const esIngreso = m.tipo === 'ingreso' || m.tipo === 'venta';

                return (
                  <tr key={m.id} style={{ borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                    <td style={{ padding: '10px 12px', color: '#1e293b', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {m.fecha}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {fincaMovimiento?.nombre || 'Sin finca'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: esIngreso ? '#dcfce7' : '#fee2e2',
                          color: esIngreso ? '#166534' : '#991b1b',
                        }}
                      >
                        {esIngreso ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: 13 }}>
                      {m.categoria}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', fontSize: 13, minWidth: 200 }}>
                      <div style={{ overflowWrap: 'anywhere' }}>
                        {m.descripcion || '-'}
                        {m.comprador ? ` | Comprador: ${m.comprador}` : ''}
                        {Number(m.cantidadKg) > 0
                          ? ` | ${Number(m.cantidadKg).toLocaleString('es-CO')} kg`
                          : ''}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: 13,
                        color: esIngreso ? '#15803d' : '#dc2626',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {esIngreso ? '+' : '-'} {formatoDinero(m.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
