
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

export default function Finanzas({ usuario }) {
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

  const [fincaId, setFincaId] = useState('');
  const [vista, setVista] = useState('historial');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');

  const [tipo, setTipo] = useState('ingreso');
  const [categoria, setCategoria] = useState('Venta de café');
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaLocal());
  const [descripcion, setDescripcion] = useState('');
  const [comprador, setComprador] = useState('');
  const [cantidadKg, setCantidadKg] = useState('');
  const [fincaFormulario, setFincaFormulario] = useState('');

  // Actualizar los datos cuando se vuelve a entrar al módulo.
  useEffect(() => {
    const actualizarDatos = () => {
      setFincas(leerLocal(`cafesmart_fincas_${userId}`, []));
      setLotes(leerLocal(`cafesmart_lotes_${userId}`, []));
      setJornadas(leerLocal(`cafesmart_jornadas_${userId}`, []));
      setMovimientos(leerLocal(`cafesmart_movimientos_${userId}`, []));
    };

    window.addEventListener('focus', actualizarDatos);

    return () => window.removeEventListener('focus', actualizarDatos);
  }, [userId]);

  // Guardar los movimientos en la misma clave que utiliza el proyecto.
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
    setValor('');
    setDescripcion('');
    setComprador('');
    setCantidadKg('');
  };

  const guardarMovimiento = (e) => {
    e.preventDefault();

    const valorNumerico = Number(valor);

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
    setValor('');
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
    // Los movimientos antiguos no tenían fincaId.
    // Se muestran en "Todas las fincas", pero no se asignan
    // automáticamente a una finca específica.
    if (fincaId === '') return true;

    if (registro.fincaId === undefined || registro.fincaId === null) {
      return false;
    }

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

        // Para jornadas antiguas, solo asignar si el nombre del lote
        // identifica una única finca.
        const coincidencias = lotes.filter((l) => l.nombre === j.lote);
        return (
          coincidencias.length === 1 &&
          String(coincidencias[0].fincaId) === String(fincaId)
        );
      }),
    [jornadas, filtroPeriodo, fincaId, lotes]
  );

  const totalIngresos = movimientosFiltrados
    .filter((m) => m.tipo === 'ingreso')
    .reduce((suma, m) => suma + Number(m.valor || 0), 0);

  const totalEgresos = movimientosFiltrados
    .filter((m) => m.tipo === 'gasto')
    .reduce((suma, m) => suma + Number(m.valor || 0), 0);

  const balanceNeto = totalIngresos - totalEgresos;

  const produccionTotalKg = jornadasFiltradas
    .filter((j) => j.modalidad === 'recoleccion')
    .reduce((suma, j) => suma + Number(j.cantidad || 0), 0);

  const kilosVendidos = movimientosFiltrados
    .filter(
      (m) =>
        m.tipo === 'ingreso' &&
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

  const botonPestana = (destino, texto) => ({
    flex: 1,
    minHeight: 48,
    padding: 12,
    borderRadius: 10,
    border: vista === destino ? 'none' : '1px solid #cbd5e1',
    background: vista === destino ? '#059669' : '#fff',
    color: vista === destino ? '#fff' : '#475569',
    fontWeight: 700,
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <h2 style={{ color: '#064e3b', margin: 0 }}>Gestión Financiera</h2>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setVista('historial')}
          style={botonPestana('historial', 'Ver balances')}
        >
          Ver balances
        </button>
        <button
          type="button"
          onClick={() => setVista('nuevo_movimiento')}
          style={botonPestana('nuevo_movimiento', '+ Registrar movimiento')}
        >
          + Registrar movimiento
        </button>
      </div>

      {vista === 'historial' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                onChange={(e) => setFincaId(e.target.value)}
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

          <section>
            <h3 style={{ color: '#0f172a' }}>Historial de transacciones</h3>

            {movimientosFiltrados.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#64748b',
                  padding: 24,
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                }}
              >
                No hay movimientos en el periodo y finca seleccionados.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {movimientosFiltrados.map((m) => {
                  const fincaMovimiento = fincas.find(
                    (f) => String(f.id) === String(m.fincaId)
                  );

                  return (
                    <article
                      key={m.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 16,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fff',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                        <strong
                          style={{
                            display: 'block',
                            color: m.tipo === 'ingreso' ? '#15803d' : '#dc2626',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {m.descripcion || m.categoria}
                        </strong>

                        <span style={{ display: 'block', color: '#64748b', fontSize: 13 }}>
                          {m.fecha} · {m.categoria}
                        </span>

                        <span style={{ display: 'block', color: '#64748b', fontSize: 13 }}>
                          Finca: {fincaMovimiento?.nombre || 'Sin finca asociada'}
                        </span>

                        {m.comprador && (
                          <span style={{ display: 'block', color: '#64748b', fontSize: 13 }}>
                            Comprador: {m.comprador}
                          </span>
                        )}

                        {Number(m.cantidadKg) > 0 && (
                          <span style={{ display: 'block', color: '#64748b', fontSize: 13 }}>
                            Cantidad: {Number(m.cantidadKg).toLocaleString('es-CO')} kg
                          </span>
                        )}
                      </div>

                      <strong
                        style={{
                          color: m.tipo === 'ingreso' ? '#15803d' : '#dc2626',
                          fontSize: '1.1rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.tipo === 'ingreso' ? '+' : '-'} {formatoDinero(m.valor)}
                      </strong>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      )}

      {vista === 'nuevo_movimiento' && (
        <form
          onSubmit={guardarMovimiento}
          style={{
            background: '#fff',
            border: '1px solid #a7f3d0',
            padding: 20,
            borderRadius: 14,
          }}
        >
          <h3 style={{ color: '#064e3b', marginTop: 0 }}>
            Registrar movimiento financiero
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
              type="number"
              min="1"
              step="1"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              style={estiloCampo}
              placeholder="Ej. 850000"
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
              background: fincas.length === 0 ? '#94a3b8' : '#047857',
              color: '#fff',
              fontWeight: 700,
              cursor: fincas.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Guardar movimiento
          </button>
        </form>
      )}
    </div>
  );
}
