import { formatoDinero } from '#lib/formatters';

export default function FinanzasGraficos({
  fincas,
  fincaId,
  setFincaId,
  filtroPeriodo,
  setFiltroPeriodo,
  userId,
  totalIngresos,
  totalEgresos,
  balanceNeto,
  resumenPorCategoria,
  maxCategoriaValor,
}) {
  const estiloEtiqueta = {
    display: 'block',
    marginBottom: 0,
    color: '#334155',
    fontWeight: 600,
  };

  const estiloCampo = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 46,
    padding: 10,
    marginTop: 6,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#fff',
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #cbd5e1',
          padding: 18,
          borderRadius: 14,
        }}
      >
        <h3 style={{ margin: 0, color: '#064e3b' }}>Gráficas y análisis</h3>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          Visualización de ingresos, egresos y distribución por categoría con base en los filtros aplicados.
        </p>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #cbd5e1',
          padding: 18,
          borderRadius: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          alignItems: 'end',
        }}
      >
        <label style={estiloEtiqueta}>
          Filtrar por finca
          <select
            value={fincaId}
            onChange={(e) => {
              const val = e.target.value;
              setFincaId(val);
              if (val) {
                localStorage.setItem(`cafesmart_finca_activa_${userId}`, val);
              } else {
                localStorage.removeItem(`cafesmart_finca_activa_${userId}`);
              }
            }}
            style={estiloCampo}
          >
            <option value="">Todas las fincas</option>
            {fincas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={estiloEtiqueta}>
          Filtrar por periodo
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            style={estiloCampo}
          >
            <option value="todos">Histórico completo</option>
            <option value="este_mes">Este mes</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="este_ano">Año actual</option>
          </select>
        </label>
      </div>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        <article
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>
              Comparativo Ingresos vs Egresos
            </h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
              Visualización sencilla de lo registrado en el periodo
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 120 }}>
                <div
                  style={{
                    width: '46%',
                    background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                    borderRadius: '10px 10px 0 0',
                    height: totalIngresos > 0
                      ? `${Math.max((totalIngresos / Math.max(totalIngresos, totalEgresos, 1)) * 100, 12)}px`
                      : '12px',
                  }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ color: '#15803d', fontSize: 13 }}>Ingresos</strong>
                <div style={{ color: '#64748b', fontSize: 11 }}>{formatoDinero(totalIngresos)}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 120 }}>
                <div
                  style={{
                    width: '46%',
                    background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)',
                    borderRadius: '10px 10px 0 0',
                    height: totalEgresos > 0
                      ? `${Math.max((totalEgresos / Math.max(totalIngresos, totalEgresos, 1)) * 100, 12)}px`
                      : '12px',
                  }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ color: '#dc2626', fontSize: 13 }}>Egresos</strong>
                <div style={{ color: '#64748b', fontSize: 11 }}>{formatoDinero(totalEgresos)}</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            Balance neto:{' '}
            <strong style={{ color: balanceNeto >= 0 ? '#047857' : '#dc2626' }}>
              {formatoDinero(balanceNeto)}
            </strong>
          </div>
        </article>

        <article
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>
              Distribución por categoría
            </h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
              Agrupado con base en los movimientos registrados
            </p>
          </div>
          {resumenPorCategoria.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 16 }}>
              Sin movimientos para graficar
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resumenPorCategoria.slice(0, 8).map((item) => {
                const ingresoPct = (item.ingreso / maxCategoriaValor) * 100;
                const gastoPct = (item.gasto / maxCategoriaValor) * 100;

                return (
                  <div key={item.categoria} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          color: '#1e293b',
                          fontWeight: 600,
                          fontSize: 12,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.categoria}
                      </span>
                      <span style={{ color: '#64748b', fontSize: 11, flexShrink: 0 }}>
                        {formatoDinero(item.ingreso + item.gasto)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {item.ingreso > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 999 }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.max(ingresoPct, 6)}%`,
                                background: '#22c55e',
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: '#15803d', minWidth: 70, textAlign: 'right' }}>
                            +{formatoDinero(item.ingreso)}
                          </span>
                        </div>
                      )}
                      {item.gasto > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 999 }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.max(gastoPct, 6)}%`,
                                background: '#f87171',
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: '#dc2626', minWidth: 70, textAlign: 'right' }}>
                            -{formatoDinero(item.gasto)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </section>
  );
}
