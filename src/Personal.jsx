import { useEffect, useMemo, useState } from 'react';

const ACTIVIDADES_INICIALES = [
  'Recolección de café',
  'Deshierbe / Plateo',
  'Abonado / Fertilización',
  'Poda y Zoca',
  'Ahoyado y Siembra',
  'Fumigación / Control de plagas',
];

const hoy = () => {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
};

const leer = (clave, inicial) => {
  try {
    const dato = localStorage.getItem(clave);
    return dato === null ? inicial : JSON.parse(dato);
  } catch {
    return inicial;
  }
};

const dinero = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2,
  });

export default function Personal({ usuario, subSeccion }) {
  const userId = usuario?.id || 'default';

  const [trabajadores, setTrabajadores] = useState(() =>
    leer(`cafesmart_trabajadores_${userId}`, [])
  );
  const [fincas, setFincas] = useState(() =>
    leer(`cafesmart_fincas_${userId}`, [])
  );
  const [lotes, setLotes] = useState(() =>
    leer(`cafesmart_lotes_${userId}`, [])
  );
  const [actividades, setActividades] = useState(() =>
    leer(`cafesmart_actividades_${userId}`, ACTIVIDADES_INICIALES)
  );
  const [jornadas, setJornadas] = useState(() =>
    leer(`cafesmart_jornadas_${userId}`, [])
  );

  const [fincaId, setFincaId] = useState(() => {
    const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return activa ? Number(activa) : null;
  });

  const [tarifaKg, setTarifaKg] = useState(() =>
    localStorage.getItem(`cafesmart_tarifa_kg_${userId}`) ?? '1000'
  );
  const [tarifaJornal, setTarifaJornal] = useState(() =>
    localStorage.getItem(`cafesmart_tarifa_jornal_${userId}`) ?? '50000'
  );

  const [vista, setVista] = useState('lista');
  const [nombreTrabajador, setNombreTrabajador] = useState('');
  const [nuevaActividadNombre, setNuevaActividadNombre] = useState('');
  const [trabajadorId, setTrabajadorId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState('Recolección de café');
  const [modalidad, setModalidad] = useState('recoleccion');
  const [fecha, setFecha] = useState(hoy());

  const [cantidadesLiquidacion, setCantidadesLiquidacion] = useState({});

  // Control de vista desde la barra lateral
  useEffect(() => {
    if (subSeccion) {
      if (subSeccion === 'liquidaciones') setVista('lista');
      if (subSeccion === 'registrar-labor') setVista('nueva_jornada');
      if (subSeccion === 'nuevo-trabajador') setVista('nuevo_trabajador');
      if (subSeccion === 'tarifas-actividades') setVista('tarifas');
    }
  }, [subSeccion]);

  useEffect(() => {
    const actualizar = () => {
      setFincas(leer(`cafesmart_fincas_${userId}`, []));
      setLotes(leer(`cafesmart_lotes_${userId}`, []));
    };

    actualizar();
    window.addEventListener('focus', actualizar);
    return () => window.removeEventListener('focus', actualizar);
  }, [userId, vista]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_trabajadores_${userId}`, JSON.stringify(trabajadores));
  }, [trabajadores, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_actividades_${userId}`, JSON.stringify(actividades));
  }, [actividades, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_jornadas_${userId}`, JSON.stringify(jornadas));
  }, [jornadas, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_tarifa_kg_${userId}`, tarifaKg);
    localStorage.setItem(`cafesmart_tarifa_jornal_${userId}`, tarifaJornal);
  }, [tarifaKg, tarifaJornal, userId]);

  const fincaSeleccionada = fincas.find(
    (f) => Number(f.id) === Number(fincaId)
  );

  const lotesDeFinca = useMemo(
    () => lotes.filter((l) => Number(l.fincaId) === Number(fincaId)),
    [lotes, fincaId]
  );

  const lotesPorId = useMemo(
    () => new Map(lotes.map((l) => [String(l.id), l])),
    [lotes]
  );

  const perteneceAFinca = (jornada, idFinca) => {
    if (jornada.fincaId !== undefined && jornada.fincaId !== null) {
      return Number(jornada.fincaId) === Number(idFinca);
    }

    if (jornada.loteId !== undefined && jornada.loteId !== null) {
      const lote = lotesPorId.get(String(jornada.loteId));
      return Boolean(lote && Number(lote.fincaId) === Number(idFinca));
    }

    const nombreLote = String(jornada.lote || '').trim().toLowerCase();
    if (!nombreLote) return false;

    const coincidencias = lotes.filter(
      (l) => String(l.nombre || '').trim().toLowerCase() === nombreLote
    );

    return coincidencias.length === 1 &&
      Number(coincidencias[0].fincaId) === Number(idFinca);
  };

  const jornadasPendientes = (idTrabajador, idFinca) =>
    jornadas.filter(
      (j) =>
        Number(j.trabajadorId) === Number(idTrabajador) &&
        j.estado !== 'pagado' &&
        perteneceAFinca(j, idFinca)
    );

  const calcularPendiente = (idTrabajador, idFinca) =>
    jornadasPendientes(idTrabajador, idFinca).reduce(
      (total, j) => total + Number(j.subtotal || 0),
      0
    );

  const agregarActividad = (e) => {
    e.preventDefault();
    const nombre = nuevaActividadNombre.trim();

    if (!nombre) {
      alert('Escribe el nombre de la actividad.');
      return;
    }

    if (actividades.some((a) => a.toLowerCase() === nombre.toLowerCase())) {
      alert('Esta actividad ya existe.');
      return;
    }

    setActividades((anteriores) => [...anteriores, nombre]);
    setActividadSeleccionada(nombre);
    setModalidad(nombre === 'Recolección de café' ? 'recoleccion' : 'jornal');
    setNuevaActividadNombre('');
    alert('Actividad agregada correctamente.');
  };

  const guardarTrabajador = (e) => {
    e.preventDefault();
    const nombre = nombreTrabajador.trim();

    if (nombre.length < 2) {
      alert('Escribe el nombre completo del trabajador.');
      return;
    }

    if (trabajadores.some((t) => t.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      alert('Ya existe un trabajador con ese nombre.');
      return;
    }

    setTrabajadores((anteriores) => [
      ...anteriores,
      { id: Date.now(), nombre },
    ]);

    setNombreTrabajador('');
    setVista('lista');
  };

  const guardarJornada = (e) => {
    e.preventDefault();

    if (!fincaSeleccionada) {
      alert('Primero debes seleccionar una finca en la parte superior.');
      return;
    }

    const trabajador = trabajadores.find(
      (t) => Number(t.id) === Number(trabajadorId)
    );
    const loteSeleccionado = lotesDeFinca.find(
      (l) => String(l.id) === String(loteId)
    );

    if (!trabajador) {
      alert('Selecciona un trabajador válido.');
      return;
    }

    if (!loteSeleccionado) {
      alert('Selecciona un lote válido de la finca elegida.');
      return;
    }

    if (!fecha) {
      alert('Selecciona la fecha de la labor.');
      return;
    }

    const tarifa = modalidad === 'recoleccion'
      ? Number(tarifaKg)
      : Number(tarifaJornal);

    if (!Number.isFinite(tarifa) || tarifa <= 0) {
      alert('La tarifa debe ser mayor que cero.');
      return;
    }

    const nuevaJornada = {
      id: Date.now(),
      trabajadorId: Number(trabajadorId),
      fincaId: Number(fincaSeleccionada.id),
      loteId: loteSeleccionado.id,
      lote: loteSeleccionado.nombre,
      actividad: actividadSeleccionada,
      modalidad,
      cantidad: null,
      tarifaAplicada: tarifa,
      subtotal: 0,
      fecha,
      estado: 'pendiente',
    };

    setJornadas((anteriores) => [...anteriores, nuevaJornada]);
    setLoteId('');
    setVista('lista');
    alert('Labor asignada correctamente. Podrás ingresar la cantidad al liquidar.');
  };

  const realizarPago = (trabajador) => {
    if (!fincaSeleccionada) {
      alert('Selecciona una finca antes de liquidar.');
      return;
    }

    const pendientes = jornadasPendientes(trabajador.id, fincaSeleccionada.id);

    if (pendientes.length === 0) {
      alert('Este trabajador no tiene labores pendientes en esta finca.');
      return;
    }

    const pendientesConCantidad = pendientes.map((j) => {
      const cantidad = Number(cantidadesLiquidacion[j.id] ?? j.cantidad);
      const tarifa = Number(j.tarifaAplicada || (
        j.modalidad === 'recoleccion' ? tarifaKg : tarifaJornal
      ));

      return {
        ...j,
        cantidad,
        subtotal: cantidad * tarifa,
        tarifaAplicada: tarifa,
      };
    });

    const cantidadInvalida = pendientesConCantidad.some(
      (j) =>
        !Number.isFinite(j.cantidad) ||
        j.cantidad <= 0 ||
        (j.modalidad === 'jornal' && !Number.isInteger(j.cantidad))
    );

    if (cantidadInvalida) {
      alert(
        'Completa las cantidades de todas las labores: kilos para recolección y días enteros para jornal.'
      );
      return;
    }

    const monto = pendientesConCantidad.reduce(
      (total, j) => total + j.subtotal,
      0
    );

    if (monto <= 0) {
      alert('El valor de la liquidación debe ser mayor que cero.');
      return;
    }

    const confirmado = window.confirm(
      `¿Confirmas el pago de ${dinero(monto)} a ${trabajador.nombre} por las labores pendientes de ${fincaSeleccionada.nombre}?`
    );

    if (!confirmado) return;

    const idsPagados = new Set(pendientes.map((j) => j.id));
    const liquidadasPorId = new Map(
      pendientesConCantidad.map((j) => [j.id, j])
    );
    const fechaPago = hoy();

    setJornadas((anteriores) =>
      anteriores.map((j) => {
        if (!idsPagados.has(j.id)) return j;

        const liquidada = liquidadasPorId.get(j.id);
        if (!liquidada) return j;

        return {
          ...j,
          cantidad: liquidada.cantidad,
          estado: 'pagado',
          fechaPago,
          tarifaAplicada: liquidada.tarifaAplicada,
          subtotal: liquidada.subtotal,
        };
      })
    );

    const claveMovimientos = `cafesmart_movimientos_${userId}`;
    const movimientos = leer(claveMovimientos, []);

    const nuevoEgreso = {
      id: Date.now(),
      tipo: 'gasto',
      categoria: 'Mano de Obra',
      descripcion: `Pago laboral: ${trabajador.nombre} - ${fincaSeleccionada.nombre}`,
      valor: monto,
      fecha: fechaPago,
      fincaId: fincaSeleccionada.id,
      liquidacionJornadaIds: [...idsPagados],
    };

    localStorage.setItem(
      claveMovimientos,
      JSON.stringify([nuevoEgreso, ...movimientos])
    );

    setCantidadesLiquidacion((anteriores) => {
      const nuevas = { ...anteriores };
      idsPagados.forEach((id) => delete nuevas[id]);
      return nuevas;
    });

    alert(`Pago de ${dinero(monto)} registrado para ${trabajador.nombre}.`);
  };

  const cambiarFinca = (valor) => {
    const id = valor ? Number(valor) : null;
    setFincaId(id);
    setLoteId('');

    if (id !== null) {
      localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(id));
    } else {
      localStorage.removeItem(`cafesmart_finca_activa_${userId}`);
    }
  };

  const trabajadoresConPendientes = useMemo(() => {
    if (!fincaSeleccionada) return [];

    return trabajadores.filter((t) =>
      jornadas.some(
        (j) =>
          Number(j.trabajadorId) === Number(t.id) &&
          j.estado !== 'pagado' &&
          perteneceAFinca(j, fincaSeleccionada.id)
      )
    );
  }, [trabajadores, jornadas, fincaSeleccionada, lotes, lotesPorId]);

  const historialPagado = useMemo(
    () => fincaSeleccionada
      ? jornadas.filter(
          (j) => j.estado === 'pagado' && perteneceAFinca(j, fincaSeleccionada.id)
        )
      : [],
    [jornadas, fincaSeleccionada, lotes, lotesPorId]
  );

  const campo = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 44,
    padding: 10,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    marginTop: 6,
  };

  const etiqueta = {
    display: 'block',
    marginBottom: 16,
    fontWeight: 600,
    color: '#334155',
  };

  const boton = {
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
    <div>
      <h2 style={{ color: '#064e3b', marginBottom: 20 }}>Personal y Gestión Laboral</h2>

      <section style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
      }}>
        <label style={etiqueta}>
          Finca seleccionada
          <select value={fincaId ?? ''} onChange={(e) => cambiarFinca(e.target.value)} style={campo}>
            <option value="">Selecciona una finca...</option>
            {fincas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </label>
        {!fincaSeleccionada && (
          <p style={{ color: '#b45309', marginBottom: 0 }}>
            Crea una finca en el módulo Fincas para registrar labores y liquidaciones.
          </p>
        )}
      </section>

      {vista === 'lista' && (
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
                <article key={trabajador.id} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 14,
                  background: '#fff',
                }}>
                  <h3 style={{ margin: '0 0 8px' }}>{trabajador.nombre}</h3>
                  <p style={{ color: '#64748b' }}>
                    {registros.length} labor(es) pendiente(s) en {fincaSeleccionada.nombre}
                  </p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#b91c1c' }}>
                    Valor calculated: {dinero(pendiente)}
                  </p>

                  <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 6 }}>Fecha</th>
                          <th style={{ textAlign: 'left', padding: 6 }}>Actividad</th>
                          <th style={{ textAlign: 'left', padding: 6 }}>Lote</th>
                          <th style={{ textAlign: 'right', padding: 6 }}>Cantidad para liquidar</th>
                          <th style={{ textAlign: 'right', padding: 6 }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registros.map((j) => {
                          const cantidadActual =
                            cantidadesLiquidacion[j.id] ?? j.cantidad ?? '';
                          const cantidadNumerica = Number(cantidadActual);
                          const tarifa = Number(
                            j.tarifaAplicada ||
                            (j.modalidad === 'recoleccion' ? tarifaKg : tarifaJornal)
                          );
                          const valor = cantidadActual !== '' && cantidadNumerica > 0
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
                                <input
                                  type="number"
                                  min="0.1"
                                  step={j.modalidad === 'jornal' ? '1' : '0.1'}
                                  value={cantidadActual}
                                  onChange={(e) => setCantidadesLiquidacion((prev) => ({
                                    ...prev,
                                    [j.id]: e.target.value,
                                  }))}
                                  placeholder={j.modalidad === 'recoleccion' ? 'Kilos' : 'Días'}
                                  aria-label={j.modalidad === 'recoleccion' ? 'Kilos recolectados' : 'Días trabajados'}
                                  style={{ ...campo, minWidth: 100, marginTop: 0 }}
                                />
                                <small style={{ display: 'block', color: '#64748b' }}>
                                  {j.modalidad === 'recoleccion' ? 'Kilogramos' : 'Días trabajados'}
                                </small>
                              </td>
                              <td style={{ padding: 6, textAlign: 'right' }}>{dinero(valor)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button type="button" style={{ ...boton, width: '100%' }} onClick={() => realizarPago(trabajador)}>
                    Liquidar labores y registrar pago
                  </button>
                </article>
              );
            })
          )}

          <h3 style={{ marginTop: 28 }}>Historial de labores pagadas</h3>
          {!fincaSeleccionada ? (
            <p>Selecciona una finca para consultar el historial.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Fecha labor</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Trabajador</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Actividad</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Cantidad</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Fecha pago</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPagado.map((j) => {
                    const t = trabajadores.find((trab) => Number(trab.id) === Number(j.trabajadorId));
                    return (
                      <tr key={j.id}>
                        <td style={{ padding: 8 }}>{j.fecha}</td>
                        <td style={{ padding: 8 }}>{t?.nombre || 'Trabajador anterior'}</td>
                        <td style={{ padding: 8 }}>{j.actividad}</td>
                        <td style={{ padding: 8 }}>
                          {j.cantidad} {j.modalidad === 'recoleccion' ? 'kg' : 'día(s)'}
                        </td>
                        <td style={{ padding: 8 }}>{j.fechaPago || 'Sin fecha'}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{dinero(j.subtotal)}</td>
                      </tr>
                    );
                  })}
                  {historialPagado.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                        No hay labores pagadas registradas para {fincaSeleccionada.nombre}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {vista === 'nueva_jornada' && (
        <form id="registrar-labor" onSubmit={guardarJornada} style={{
          background: '#fff',
          padding: 20,
          border: '1px solid #e2e8f0',
          borderRadius: 12,
        }}>
          <h3>Asignar labor a un trabajador</h3>

          {!fincaSeleccionada && (
            <p style={{ color: '#b45309' }}>
              Selecciona primero una finca en el selector de arriba.
            </p>
          )}

          <label style={etiqueta}>
            Trabajador
            <select value={trabajadorId} onChange={(e) => setTrabajadorId(e.target.value)} required style={campo}>
              <option value="">Selecciona un trabajador...</option>
              {trabajadores.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </label>

          <label style={etiqueta}>
            Actividad
            <select
              value={actividadSeleccionada}
              onChange={(e) => {
                setActividadSeleccionada(e.target.value);
                setModalidad(e.target.value === 'Recolección de café' ? 'recoleccion' : 'jornal');
              }}
              required
              style={campo}
            >
              {actividades.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <label style={etiqueta}>
            Lote
            <select
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              required
              style={campo}
              disabled={!fincaSeleccionada || lotesDeFinca.length === 0}
            >
              <option value="">
                {!fincaSeleccionada
                  ? 'Selecciona primero una finca arriba...'
                  : lotesDeFinca.length === 0
                    ? 'Esta finca no tiene lotes registrados'
                    : 'Selecciona un lote...'}
              </option>
              {lotesDeFinca.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}{l.variedad ? ` (${l.variedad})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label style={etiqueta}>
            Modalidad de pago
            <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} style={campo}>
              <option value="recoleccion">Por kilogramo — {dinero(Number(tarifaKg))}</option>
              <option value="jornal">Por jornal/día — {dinero(Number(tarifaJornal))}</option>
            </select>
          </label>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#166534',
          }}>
            {modalidad === 'recoleccion'
              ? 'Los kilos recolectados se ingresarán cuando vayas a liquidar el pago.'
              : 'Los días trabajados se ingresarán cuando vayas a liquidar el pago.'}
          </div>

          <label style={etiqueta}>
            Fecha de la labor
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} max={hoy()} required style={campo} />
          </label>

          <button type="submit" style={boton} disabled={!fincaSeleccionada}>
            Asignar labor
          </button>
        </form>
      )}

      {vista === 'nuevo_trabajador' && (
        <section id="nuevo-trabajador">
          <form onSubmit={guardarTrabajador} style={{
            background: '#fff',
            padding: 20,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            marginBottom: 20,
          }}>
            <h3>Crear nuevo trabajador</h3>
            <label style={etiqueta}>
              Nombre completo
              <input
                type="text"
                value={nombreTrabajador}
                onChange={(e) => setNombreTrabajador(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                style={campo}
                placeholder="Ej. Carlos Ramírez"
              />
            </label>
            <button type="submit" style={boton}>Guardar trabajador</button>
          </form>

          <article style={{
            background: '#fff',
            padding: 20,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
          }}>
            <h3>Lista de Trabajadores Registrados</h3>
            {trabajadores.length === 0 ? (
              <p style={{ color: '#64748b' }}>No hay trabajadores registrados en la base de datos.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trabajadores.map((t) => (
                      <tr key={t.id}>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{t.id}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{t.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      )}

      {vista === 'tarifas' && (
        <section id="tarifas-actividades">
          <article style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}>
            <h3>Tarifas de mano de obra</h3>
            <p style={{ color: '#64748b' }}>
              Los nuevos registros guardan la tarifa aplicada. Cambiar una tarifa no modifica los pagos ya cerrados.
            </p>

            <label style={etiqueta}>
              Tarifa por kilogramo (COP)
              <input type="number" min="1" step="1" value={tarifaKg} onChange={(e) => setTarifaKg(e.target.value)} required style={campo} />
            </label>

            <label style={etiqueta}>
              Tarifa por jornal/día (COP)
              <input type="number" min="1" step="1" value={tarifaJornal} onChange={(e) => setTarifaJornal(e.target.value)} required style={campo} />
            </label>

            <button
              type="button"
              style={boton}
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

          <article style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
          }}>
            <h3>Catálogo de actividades laborales</h3>
            <form onSubmit={agregarActividad}>
              <label style={etiqueta}>
                Nombre de la actividad
                <input
                  type="text"
                  value={nuevaActividadNombre}
                  onChange={(e) => setNuevaActividadNombre(e.target.value)}
                  maxLength={100}
                  required
                  style={campo}
                  placeholder="Ej. Preparación de almácigo"
                />
              </label>
              <button type="submit" style={boton}>Agregar actividad</button>
            </form>
            <ul>
              {actividades.map((a) => <li key={a} style={{ padding: 6 }}>{a}</li>)}
            </ul>
          </article>
        </section>
      )}
    </div>
  );
}