import { useEffect, useMemo, useState } from 'react';

const obtenerFechaLocal = () => {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
};

const leerLocal = (clave, valorInicial) => {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado === null ? valorInicial : JSON.parse(guardado);
  } catch {
    return valorInicial;
  }
};

const formatoDinero = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

const formatearMiles = (valor) => {
  if (!valor && valor !== 0) return '';
  const soloNumeros = String(valor).replace(/\D/g, '');
  if (!soloNumeros) return '';
  return Number(soloNumeros).toLocaleString('es-CO');
};

const desformatearNumero = (valorFormateado) => {
  return String(valorFormateado).replace(/\D/g, '');
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

const estiloEtiqueta = {
  display: 'block',
  marginBottom: 16,
  color: '#334155',
  fontWeight: 600,
};

export default function Finanzas({ usuario, subSeccion }) {
  const userId = usuario?.id || 'default';

  const [movimientos, setMovimientos] = useState(() =>
    leerLocal(`cafesmart_movimientos_${userId}`, [])
  );

  const [jornadas, setJornadas] = useState(() =>
    leerLocal(`cafesmart_jornadas_${userId}`, [])
  );

  const [fincas, setFincas] = useState(() =>
    leerLocal(`cafesmart_fincas_${userId}`, [])
  );

  const [lotes, setLotes] = useState(() =>
    leerLocal(`cafesmart_lotes_${userId}`, [])
  );

  const [fincaId, setFincaId] = useState(() => {
    const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return activa ? String(activa) : '';
  });

  const [vista, setVista] = useState('historial');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');

  const [tipo, setTipo] = useState('ingreso');
  const [categoria, setCategoria] = useState('Venta de café');
  const [valorTexto, setValorTexto] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaLocal());
  const [descripcion, setDescripcion] = useState('');
  const [comprador, setComprador] = useState('');
  const [cantidadKg, setCantidadKg] = useState('');
  const [fincaFormulario, setFincaFormulario] = useState(() => {
    const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return activa ? String(activa) : '';
  });

  // Sincronización con las opciones del menú lateral en App.jsx
  useEffect(() => {
    if (subSeccion) {
      if (subSeccion === 'finanzas-indicadores' || subSeccion === 'historial-movimientos' || subSeccion === 'resumen') {
        setVista('historial');
      }
      if (subSeccion === 'nuevo-movimiento' || subSeccion === 'nuevo-gasto' || subSeccion === 'nuevo-ingreso') {
        if (subSeccion === 'nuevo-ingreso') {
          setTipo('ingreso');
          setCategoria('Venta de café');
        } else if (subSeccion === 'nuevo-gasto') {
          setTipo('gasto');
          setCategoria('Insumos y Fertilizantes');
        }
        setVista('nuevo_movimiento');
      }
    } else {
      setVista('historial');
    }
  }, [subSeccion]);

  // Actualizar los datos cuando se vuelve a entrar al módulo
  useEffect(() => {
    const actualizarDatos = () => {
      const fincasCargadas = leerLocal(`cafesmart_fincas_${userId}`, []);
      setFincas(fincasCargadas);
      setLotes(leerLocal(`cafesmart_lotes_${userId}`, []));
      setJornadas(leerLocal(`cafesmart_jornadas_${userId}`, []));
      setMovimientos(leerLocal(`cafesmart_movimientos_${userId}`, []));

      const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
      if (activa) {
        setFincaId(String(activa));
        setFincaFormulario(String(activa));
      } else if (fincasCargadas.length > 0 && !fincaFormulario) {
        setFincaFormulario(String(fincasCargadas[0].id));
      }
    };

    actualizarDatos();
    window.addEventListener('focus', actualizarDatos);
    return () => window.removeEventListener('focus', actualizarDatos);
  }, [userId, vista]);

  // Guardar los movimientos en localStorage
  useEffect(() => {
    localStorage.setItem(
      `cafesmart_movimientos_${userId}`,
      JSON.stringify(movimientos)
    );
  }, [movimientos, userId]);

  const fincaSeleccionada = fincas.find(
    (f) => String(f.id) === String(fincaId)
  );

  const fincaDelFormulario = fincas.find(
    (f) => String(f.id) === String(fincaFormulario)
  );

  const esVentaCafe = tipo === 'ingreso' && categoria === 'Venta de café';

  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setCategoria(
      nuevoTipo === 'ingreso' ? 'Venta de café' : 'Insumos y Fertilizantes'
    );
    setValorTexto('');
    setDescripcion('');
    setComprador('');
    setCantidadKg('');
  };

  const guardarMovimiento = (e) => {
    e.preventDefault();

    const valorNumerico = Number(valorTexto);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      alert('El valor debe ser un número mayor que cero.');
      return;
    }

    if (!fecha) {
      alert('Selecciona la fecha del movimiento.');
      return;
    }

    if (!fincaDelFormulario) {
      alert('Selecciona la finca a la que corresponde el movimiento.');
      return;
    }

    let kilos = null;

    if (esVentaCafe) {
      kilos = Number(cantidadKg);

      if (!Number.isFinite(kilos) || kilos <= 0) {
        alert('Los kilogramos vendidos deben ser mayores que cero.');
        return;
      }

      if (!comprador.trim()) {
        alert('Escribe el nombre del comprador.');
        return;
      }
    }

    const nuevoMovimiento = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tipo,
      categoria,
      descripcion:
        descripcion.trim() ||
        (esVentaCafe
          ? `Venta de ${kilos} kg de café a ${comprador.trim()}`
          : categoria),
      valor: valorNumerico,
      fecha,
      fincaId: fincaDelFormulario.id,
      ...(esVentaCafe
        ? {
            cantidadKg: kilos,
            comprador: comprador.trim(),
          }
        : {}),
    };

    setMovimientos((anteriores) => [nuevoMovimiento, ...anteriores]);

    setFincaId(String(fincaDelFormulario.id));
    localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(fincaDelFormulario.id));

    setValorTexto('');
    setDescripcion('');
    setComprador('');
    setCantidadKg('');
    setVista('historial');

    alert('Movimiento financiero guardado correctamente.');
  };

  const filtrarPorFecha = (fechaItem) => {
    if (filtroPeriodo === 'todos') return true;
    if (!fechaItem) return false;

    const partes = fechaItem.split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) return false;

    const [anio, mes] = partes;
    const ahora = new Date();

    if (filtroPeriodo === 'este_mes') {
      return anio === ahora.getFullYear() && mes === ahora.getMonth() + 1;
    }

    if (filtroPeriodo === 'mes_anterior') {
      const anterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      return anio === anterior.getFullYear() && mes === anterior.getMonth() + 1;
    }

    if (filtroPeriodo === 'este_ano') {
      return anio === ahora.getFullYear();
    }

    return true;
  };

  const perteneceAFinca = (registro) => {
    if (fincaId === '') return true;
    if (registro.fincaId === undefined || registro.fincaId === null) return false;
    return String(registro.fincaId) === String(fincaId);
  };

  const movimientosFiltrados = useMemo(
    () =>
      movimientos.filter(
        (m) => filtrarPorFecha(m.fecha) && perteneceAFinca(m)
      ),
    [movimientos, filtroPeriodo, fincaId]
  );

  const jornadasFiltradas = useMemo(
    () =>
      jornadas.filter((j) => {
        if (!filtrarPorFecha(j.fecha)) return false;
        if (fincaId === '') return true;
        if (j.fincaId !== undefined && j.fincaId !== null) {
          return String(j.fincaId) === String(fincaId);
        }
        const coincidencias = lotes.filter((l) => l.nombre === j.lote);
        return (
          coincidencias.length === 1 &&
          String(coincidencias[0].fincaId) === String(fincaId)
        );
      }),
    [jornadas, filtroPeriodo, fincaId, lotes]
  );

  const totalIngresos = movimientosFiltrados
    .filter((m) => m.tipo === 'ingreso' || m.tipo === 'venta')
    .reduce((suma, m) => suma + Number(m.valor || 0), 0);

  const totalEgresos = movimientosFiltrados
    .filter((m) => m.tipo === 'gasto' || m.tipo === 'egreso')
    .reduce((suma, m) => suma + Number(m.valor || 0), 0);

  const balanceNeto = totalIngresos - totalEgresos;

  const produccionTotalKg = jornadasFiltradas
    .filter((j) => j.modalidad === 'recoleccion' && j.estado === 'pagado')
    .reduce((suma, j) => suma + Number(j.cantidad || 0), 0);

  const kilosVendidos = movimientosFiltrados
    .filter(
      (m) =>
        (m.tipo === 'ingreso' || m.tipo === 'venta') &&
        m.categoria === 'Venta de café' &&
        Number(m.cantidadKg) > 0
    )
    .reduce((suma, m) => suma + Number(m.cantidadKg || 0), 0);

  const tarjetas = [
    {
      titulo: 'Ingresos totales',
      valor: formatoDinero(totalIngresos),
      fondo: '#f0fdf4',
      borde: '#bbf7d0',
      color: '#15803d',
    },
    {
      titulo: 'Egresos totales',
      valor: formatoDinero(totalEgresos),
      fondo: '#fef2f2',
      borde: '#fecaca',
      color: '#dc2626',
    },
    {
      titulo: 'Balance neto',
      valor: formatoDinero(balanceNeto),
      fondo: balanceNeto >= 0 ? '#ecfdf5' : '#fff1f2',
      borde: balanceNeto >= 0 ? '#a7f3d0' : '#fecaca',
      color: balanceNeto >= 0 ? '#047857' : '#e11d48',
    },
    {
      titulo: 'Café cosechado',
      valor: `${produccionTotalKg.toLocaleString('es-CO')} kg`,
      fondo: '#fff',
      borde: '#e2e8f0',
      color: '#0f172a',
    },
    {
      titulo: 'Café vendido registrado',
      valor: `${kilosVendidos.toLocaleString('es-CO')} kg`,
      fondo: '#fff',
      borde: '#e2e8f0',
      color: '#0f172a',
    },
  ];

  const resumenPorCategoria = useMemo(() => {
    const mapa = new Map();
    movimientosFiltrados.forEach((m) => {
      const clave = m.categoria || 'Sin categoría';
      const actual = mapa.get(clave) || { categoria: clave, ingreso: 0, gasto: 0, total: 0 };
      const valor = Number(m.valor || 0);
      if (m.tipo === 'ingreso' || m.tipo === 'venta') {
        actual.ingreso += valor;
      } else {
        actual.gasto += valor;
      }
      actual.total = actual.ingreso - actual.gasto;
      mapa.set(clave, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => (b.gasto + b.ingreso) - (a.gasto + a.ingreso));
  }, [movimientosFiltrados]);

  const maxCategoriaValor = resumenPorCategoria.reduce((max, item) => {
    const val = Math.max(item.ingreso, item.gasto);
    return val > max ? val : max;
  }, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <h2 style={{ color: '#064e3b', margin: 0 }}>Gestión Financiera</h2>

      {vista === 'historial' && (
        <section id="finanzas-indicadores" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              padding: 18,
              borderRadius: 14,
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

            {fincaId !== '' && !fincaSeleccionada && (
              <p style={{ color: '#b45309' }}>
                La finca seleccionada ya no está disponible. Elige otra finca.
              </p>
            )}

            <p style={{ marginBottom: 0, color: '#64748b', fontSize: 14 }}>
              Los registros antiguos sin finca asignada aparecen en “Todas las fincas”.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 12,
            }}
          >
            {tarjetas.map((t) => (
              <article
                key={t.titulo}
                style={{
                  background: t.fondo,
                  border: `1px solid ${t.borde}`,
                  padding: 18,
                  borderRadius: 14,
                  minWidth: 0,
                }}
              >
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 700 }}>
                  {t.titulo}
                </span>
                <h3
                  style={{
                    color: t.color,
                    fontSize: '1.25rem',
                    overflowWrap: 'anywhere',
                    margin: '8px 0 0',
                  }}
                >
                  {t.valor}
                </h3>
              </article>
            ))}
          </div>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <article style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, width: '100%', boxSizing: 'border-box' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>Comparativo Ingresos vs Egresos</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Visualización sencilla de lo registrado en el periodo</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 120 }}>
                    <div style={{ width: '46%', background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)', borderRadius: '10px 10px 0 0', height: totalIngresos > 0 ? `${Math.max((totalIngresos / Math.max(totalIngresos, totalEgresos, 1)) * 100, 12)}px` : '12px' }}></div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ color: '#15803d', fontSize: 13 }}>Ingresos</strong>
                    <div style={{ color: '#64748b', fontSize: 11 }}>{formatoDinero(totalIngresos)}</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 120 }}>
                    <div style={{ width: '46%', background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)', borderRadius: '10px 10px 0 0', height: totalEgresos > 0 ? `${Math.max((totalEgresos / Math.max(totalIngresos, totalEgresos, 1)) * 100, 12)}px` : '12px' }}></div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <strong style={{ color: '#dc2626', fontSize: 13 }}>Egresos</strong>
                    <div style={{ color: '#64748b', fontSize: 11 }}>{formatoDinero(totalEgresos)}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                Balance neto: <strong style={{ color: balanceNeto >= 0 ? '#047857' : '#dc2626' }}>{formatoDinero(balanceNeto)}</strong>
              </div>
            </article>

            <article style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, width: '100%', boxSizing: 'border-box' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem' }}>Distribución por categoría</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Agrupado con base en los movimientos registrados</p>
              </div>
              {resumenPorCategoria.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: 16 }}>Sin movimientos para graficar</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {resumenPorCategoria.slice(0, 6).map((item) => {
                    const ingresoPct = (item.ingreso / maxCategoriaValor) * 100;
                    const gastoPct = (item.gasto / maxCategoriaValor) * 100;
                    return (
                      <div key={item.categoria} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.categoria}</span>
                          <span style={{ color: '#64748b', fontSize: 11, flexShrink: 0 }}>{formatoDinero(item.ingreso + item.gasto)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {item.ingreso > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 999 }}>
                                <div style={{ height: '100%', width: `${Math.max(ingresoPct, 6)}%`, background: '#22c55e', borderRadius: 999 }}></div>
                              </div>
                              <span style={{ fontSize: 11, color: '#15803d', minWidth: 70, textAlign: 'right' }}>+{formatoDinero(item.ingreso)}</span>
                            </div>
                          )}
                          {item.gasto > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 999 }}>
                                <div style={{ height: '100%', width: `${Math.max(gastoPct, 6)}%`, background: '#f87171', borderRadius: 999 }}></div>
                              </div>
                              <span style={{ fontSize: 11, color: '#dc2626', minWidth: 70, textAlign: 'right' }}>-{formatoDinero(item.gasto)}</span>
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

          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ color: '#0f172a', margin: 0, fontSize: '1.05rem' }}>Tabla de transacciones registradas</h3>
              <span style={{ color: '#64748b', fontSize: 12 }}>{movimientosFiltrados.length} registro(s)</span>
            </div>

            {movimientosFiltrados.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#64748b',
                  padding: 20,
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  marginTop: 12,
                }}
              >
                No hay movimientos en el periodo y finca seleccionados.
              </div>
            ) : (
              <div style={{ marginTop: 12, overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 14, WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>Finca</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>Tipo</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>Categoría</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontSize: 12 }}>Descripción</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>Valor (COP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosFiltrados.map((m) => {
                      const fincaMovimiento = fincas.find(
                        (f) => String(f.id) === String(m.fincaId)
                      );
                      const esIngreso = m.tipo === 'ingreso' || m.tipo === 'venta';
                      return (
                        <tr key={m.id} style={{ borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                          <td style={{ padding: '10px 12px', color: '#1e293b', fontSize: 13, whiteSpace: 'nowrap' }}>{m.fecha}</td>
                          <td style={{ padding: '10px 12px', color: '#475569', fontSize: 13, whiteSpace: 'nowrap' }}>{fincaMovimiento?.nombre || 'Sin finca'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: esIngreso ? '#dcfce7' : '#fee2e2', color: esIngreso ? '#166534' : '#991b1b' }}>
                              {esIngreso ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569', fontSize: 13 }}>{m.categoria}</td>
                          <td style={{ padding: '10px 12px', color: '#475569', fontSize: 13, minWidth: 200 }}>
                            <div style={{ overflowWrap: 'anywhere' }}>
                              {m.descripcion || '-'}
                              {m.comprador ? ` | Comprador: ${m.comprador}` : ''}
                              {Number(m.cantidadKg) > 0 ? ` | ${Number(m.cantidadKg).toLocaleString('es-CO')} kg` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: esIngreso ? '#15803d' : '#dc2626', whiteSpace: 'nowrap' }}>
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
        </section>
      )}

      {vista === 'nuevo_movimiento' && (
        <form
          id="nuevo-movimiento"
          onSubmit={guardarMovimiento}
          style={{
            background: '#fff',
            border: `2px solid ${tipo === 'ingreso' ? '#a7f3d0' : '#fecaca'}`,
            padding: 20,
            borderRadius: 14,
            maxWidth: '600px',
          }}
        >
          <h3 style={{ color: tipo === 'ingreso' ? '#064e3b' : '#991b1b', marginTop: 0 }}>
            Registrar {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} Financiero
          </h3>

          <label style={estiloEtiqueta}>
            Finca
            <select
              value={fincaFormulario}
              onChange={(e) => setFincaFormulario(e.target.value)}
              required
              style={estiloCampo}
            >
              <option value="">Selecciona una finca...</option>
              {fincas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </label>

          {fincas.length === 0 && (
            <p style={{ color: '#b45309' }}>
              Primero debes registrar una finca en el módulo Fincas.
            </p>
          )}

          <label style={estiloEtiqueta}>
            Tipo de movimiento
            <select
              value={tipo}
              onChange={(e) => cambiarTipo(e.target.value)}
              style={estiloCampo}
            >
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Egreso / Gasto</option>
            </select>
          </label>

          <label style={estiloEtiqueta}>
            Categoría
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={estiloCampo}
            >
              {tipo === 'ingreso' ? (
                <>
                  <option value="Venta de café">Venta de café</option>
                  <option value="Subproductos">Subproductos</option>
                  <option value="Otros ingresos">Otros ingresos</option>
                </>
              ) : (
                <>
                  <option value="Insumos y Fertilizantes">Insumos y Fertilizantes</option>
                  <option value="Herramientas y Equipos">Herramientas y Equipos</option>
                  <option value="Transporte y Fletes">Transporte y Fletes</option>
                  <option value="Alimentación">Alimentación</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Mano de Obra">Mano de Obra</option>
                  <option value="Otros gastos">Otros gastos</option>
                </>
              )}
            </select>
          </label>

          {esVentaCafe && (
            <>
              <label style={estiloEtiqueta}>
                Nombre del comprador
                <input
                  type="text"
                  value={comprador}
                  onChange={(e) => setComprador(e.target.value)}
                  required
                  maxLength={120}
                  style={estiloCampo}
                  placeholder="Ej. Cooperativa cafetera"
                />
              </label>

              <label style={estiloEtiqueta}>
                Cantidad vendida (kg)
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={cantidadKg}
                  onChange={(e) => setCantidadKg(e.target.value)}
                  required
                  style={estiloCampo}
                  placeholder="Ej. 125.5"
                />
              </label>
            </>
          )}

          <label style={estiloEtiqueta}>
            Valor total (COP)
            <input
              type="text"
              inputMode="numeric"
              value={formatearMiles(valorTexto)}
              onChange={(e) => setValorTexto(desformatearNumero(e.target.value))}
              required
              style={estiloCampo}
              placeholder="Ej. 850.000"
            />
          </label>

          <label style={estiloEtiqueta}>
            Fecha del movimiento
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              max={obtenerFechaLocal()}
              required
              style={estiloCampo}
            />
          </label>

          <label style={estiloEtiqueta}>
            Descripción adicional (opcional)
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={200}
              style={estiloCampo}
              placeholder="Detalles adicionales del movimiento"
            />
          </label>

          <button
            type="submit"
            disabled={fincas.length === 0}
            style={{
              width: '100%',
              minHeight: 48,
              border: 0,
              borderRadius: 9,
              background: fincas.length === 0 ? '#94a3b8' : tipo === 'ingreso' ? '#047857' : '#dc2626',
              color: '#fff',
              fontWeight: 700,
              cursor: fincas.length === 0 ? 'not-allowed' : 'pointer',
              marginTop: 10,
            }}
          >
            Guardar {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
          </button>
        </form>
      )}
    </div>
  );
}