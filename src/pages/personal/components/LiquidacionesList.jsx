import { dinero } from '#lib/formatters';
import { OPCIONES_JORNAL } from '#lib/constants';

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
  campo,
  boton,
}) {
  return (
    <section id="liquidaciones">
      <h3>Liquidaciones pendientes</h3>

      {!fincaSeleccionada ? (
        <p>Selecciona una finca para consultar sus liquidaciones.</p>
      ) : trabajadores.length === 0 ? (
        <p>No tienes trabajadores registrados. Agrega uno desde el menú lateral.</p>
      ) : trabajadoresConPendientes.length === 0 ? (
        <p>No hay liquidaciones pendientes para {fincaSeleccionada.nombre}.</p>
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
              <p style={{ color: '#64748b' }}>
                {registros.length} labor(es) pendiente(s) en {fincaSeleccionada.nombre}
              </p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b91c1c' }}>
                Valor calculado: {dinero(pendiente)}
              </p>

              <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 6 }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Actividad</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Lote</th>
                      <th style={{ textAlign: 'right', padding: 6 }}>Tiempo / Cantidad</th>
                      <th style={{ textAlign: 'right', padding: 6 }}>Valor</th>
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
                        <tr key={j.id}>
                          <td style={{ padding: 6 }}>{j.fecha}</td>
                          <td style={{ padding: 6 }}>{j.actividad}</td>
                          <td style={{ padding: 6 }}>
                            {lotesPorId.get(String(j.loteId))?.nombre || j.lote || 'Lote anterior'}
                          </td>
                          <td style={{ padding: 6, textAlign: 'right' }}>
                            {j.modalidad === 'recoleccion' ? (
                              <>
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
                                  style={{ ...campo, minWidth: 100, marginTop: 0 }}
                                />
                                <small style={{ display: 'block', color: '#64748b' }}>Kilogramos</small>
                              </>
                            ) : (
                              <>
                                <select
                                  value={cantidadActual}
                                  onChange={(e) =>
                                    setCantidadesLiquidacion((prev) => ({
                                      ...prev,
                                      [j.id]: e.target.value,
                                    }))
                                  }
                                  style={{ ...campo, minWidth: 140, marginTop: 0 }}
                                >
                                  <option value="">Selecciona tiempo...</option>
                                  {OPCIONES_JORNAL.map((opc) => (
                                    <option key={opc.valor} value={opc.valor}>
                                      {opc.etiqueta}
                                    </option>
                                  ))}
                                </select>
                                <small style={{ display: 'block', color: '#64748b' }}>Tiempo trabajado</small>
                              </>
                            )}
                          </td>
                          <td style={{ padding: 6, textAlign: 'right' }}>{dinero(valor)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                style={{ ...boton, width: '100%' }}
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
