import { dinero } from '../../../utils/formatters';
import { OPCIONES_JORNAL } from '../../../utils/constants';

export default function LiquidacionesList({
  fincaSeleccionada,
  trabajadores,
  trabajadoresConPendientes,
  jornadasPendientes,
  calcularPendiente,
  cantidadesLiquidacion,
  setCantidadesLiquidacion,
  tarifaKg,
  tarifaJornal,
  lotesPorId,
  onRealizarPago,
}) {
  const campoEstilo = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 40,
    padding: '6px 10px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    marginTop: 0,
    background: '#fff',
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
    width: '100%',
  };

  return (
    <section id="liquidaciones">
      <h3 style={{ marginBottom: 16 }}>Liquidaciones pendientes</h3>

      {!fincaSeleccionada ? (
        <p style={{ color: '#64748b' }}>Selecciona una finca para consultar sus liquidaciones.</p>
      ) : trabajadores.length === 0 ? (
        <p style={{ color: '#64748b' }}>No tienes trabajadores registrados. Agrega uno desde el menú lateral.</p>
      ) : trabajadoresConPendientes.length === 0 ? (
        <p style={{ color: '#64748b' }}>No hay liquidaciones pendientes para {fincaSeleccionada.nombre}.</p>
      ) : (
        trabajadoresConPendientes.map((trabajador) => {
          const registros = jornadasPendientes(trabajador.id, fincaSeleccionada.id);
          const pendiente = calcularPendiente(trabajador.id, fincaSeleccionada.id);

          return (
            <article
              key={trabajador.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 18,
                marginBottom: 14,
                background: '#fff',
              }}
            >
              <h3 style={{ margin: '0 0 8px' }}>{trabajador.nombre}</h3>
              <p style={{ color: '#64748b', margin: '0 0 8px' }}>
                {registros.length} labor(es) pendiente(s) en {fincaSeleccionada.nombre}
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b91c1c', margin: '0 0 14px' }}>
                Valor calculado: {dinero(pendiente)}
              </p>

              <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: 8, color: '#475569', fontSize: 13 }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: 8, color: '#475569', fontSize: 13 }}>Actividad</th>
                      <th style={{ textAlign: 'left', padding: 8, color: '#475569', fontSize: 13 }}>Lote</th>
                      <th style={{ textAlign: 'right', padding: 8, color: '#475569', fontSize: 13 }}>Tiempo / Cantidad</th>
                      <th style={{ textAlign: 'right', padding: 8, color: '#475569', fontSize: 13 }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((j) => {
                      const cantidadActual = cantidadesLiquidacion[j.id] ?? j.cantidad ?? '';
                      const cantidadNumerica = Number(cantidadActual);
                      const tarifa = Number(
                        j.tarifaAplicada ||
                        (j.modalidad === 'recoleccion' ? tarifaKg : tarifaJornal)
                      );
                      const valor =
                        cantidadActual !== '' && cantidadNumerica > 0
                          ? cantidadNumerica * tarifa
                          : 0;

                      return (
                        <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 8, fontSize: 13 }}>{j.fecha}</td>
                          <td style={{ padding: 8, fontSize: 13 }}>{j.actividad}</td>
                          <td style={{ padding: 8, fontSize: 13 }}>
                            {lotesPorId.get(String(j.loteId))?.nombre || j.lote || 'Lote anterior'}
                          </td>
                          <td style={{ padding: 8, textAlign: 'right' }}>
                            {j.modalidad === 'recoleccion' ? (
                              <div style={{ display: 'inline-block', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={cantidadActual}
                                  onChange={(e) =>
                                    setCantidadesLiquidacion((prev) => ({
                                      ...prev,
                                      [j.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Kilos"
                                  style={{ ...campoEstilo, minWidth: 100 }}
                                />
                                <small style={{ display: 'block', color: '#64748b' }}>Kilogramos</small>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-block', textAlign: 'right' }}>
                                <select
                                  value={cantidadActual}
                                  onChange={(e) =>
                                    setCantidadesLiquidacion((prev) => ({
                                      ...prev,
                                      [j.id]: e.target.value,
                                    }))
                                  }
                                  style={{ ...campoEstilo, minWidth: 140 }}
                                >
                                  <option value="">Selecciona tiempo...</option>
                                  {OPCIONES_JORNAL.map((opc) => (
                                    <option key={opc.valor} value={opc.valor}>
                                      {opc.etiqueta}
                                    </option>
                                  ))}
                                </select>
                                <small style={{ display: 'block', color: '#64748b' }}>Tiempo trabajado</small>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: 8, textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                            {dinero(valor)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                style={botonEstilo}
                onClick={() => onRealizarPago(trabajador)}
              >
                Liquidar labores y registrar pago
              </button>
            </article>
          );
        })
      )}
    </section>
  );
}
