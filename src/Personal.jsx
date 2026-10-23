
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
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const leer = (clave, valorInicial) => {
  try {
    const dato = localStorage.getItem(clave);
    return dato === null ? valorInicial : JSON.parse(dato);
  } catch {
    return valorInicial;
  }
};

const dinero = (valor) =>
  Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 2,
  });

export default function Personal({ usuario }) {
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
  const [actividadSeleccionada, setActividadSeleccionada] =
    useState('Recolección de café');
  const [modalidad, setModalidad] = useState('recoleccion');
  const [cantidad, setCantidad] = useState('');
  const [kilosLiquidacion, setKilosLiquidacion] = useState({});
  const [fecha, setFecha] = useState(hoy());

  // Recargar fincas y lotes por si se agregaron desde otro módulo.
  useEffect(() => {
    const actualizar = () => {
      setFincas(leer(`cafesmart_fincas_${userId}`, []));
      setLotes(leer(`cafesmart_lotes_${userId}`, []));
    };

    actualizar();
    window.addEventListener('focus', actualizar);

    return () => window.removeEventListener('focus', actualizar);
  }, [userId, vista]);

  // Conservar las claves existentes para mantener los datos guardados.
  useEffect(() => {
    localStorage.setItem(
      `cafesmart_trabajadores_${userId}`,
      JSON.stringify(trabajadores)
    );
  }, [trabajadores, userId]);

  useEffect(() => {
    localStorage.setItem(
      `cafesmart_actividades_${userId}`,
      JSON.stringify(actividades)
    );
  }, [actividades, userId]);

  useEffect(() => {
    localStorage.setItem(
      `cafesmart_jornadas_${userId}`,
      JSON.stringify(jornadas)
    );
  }, [jornadas, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_tarifa_kg_${userId}`, tarifaKg);
    localStorage.setItem(
      `cafesmart_tarifa_jornal_${userId}`,
      tarifaJornal
    );
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

  // Incluye registros antiguos que solo guardaban el nombre del lote.
  const perteneceAFinca = (jornada, idFinca) => {
    if (jornada.fincaId !== undefined && jornada.fincaId !== null) {
      return Number(jornada.fincaId) === Number(idFinca);
    }

    const loteAntiguo = lotes.find(
      (l) =>
        l.nombre === jornada.lote &&
        Number(l.fincaId) === Number(idFinca)
    );

    const coincidencias = lotes.filter(
      (l) => l.nombre === jornada.lote
    );

    // Si el nombre existe en varias fincas, no asignar el registro
    // antiguo automáticamente a una finca porque sería ambiguo.
    return Boolean(loteAntiguo) && coincidencias.length === 1;
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

    const existe = actividades.some(
      (a) => a.toLocaleLowerCase() === nombre.toLocaleLowerCase()
    );

    if (existe) {
      alert('Esta actividad ya existe.');
      return;
    }

    setActividades((anteriores) => [...anteriores, nombre]);
    setActividadSeleccionada(nombre);
    setModalidad(
      nombre === 'Recolección de café' ? 'recoleccion' : 'jornal'
    );
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

    const duplicado = trabajadores.some(
      (t) => t.nombre.trim().toLocaleLowerCase() === nombre.toLocaleLowerCase()
    );

    if (duplicado) {
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
      alert('Primero debes crear o seleccionar una finca.');
      return;
    }

    const trabajador = trabajadores.find(
      (t) => Number(t.id) === Number(trabajadorId)
    );

    const loteSeleccionado = lotesDeFinca.find(
      (l) => String(l.id) === String(loteId)
    );

    const valorCantidad = Number(cantidad);
    const valorTarifa =
      modalidad === 'recoleccion' ? Number(tarifaKg) : Number(tarifaJornal);

    if (!trabajador) {
      alert('Selecciona un trabajador válido.');
      return;
    }

    if (!loteSeleccionado) {
      alert('Selecciona un lote válido de la finca elegida.');
      return;
    }

    // En recolección, los kilos se registran al finalizar la jornada,
    // durante la liquidación. Para jornal sí se registra la cantidad de días.
    if (modalidad === 'jornal') {
      if (!Number.isFinite(valorCantidad) || valorCantidad <= 0) {
        alert('Los días trabajados deben ser un número mayor que cero.');
        return;
      }

      if (!Number.isInteger(valorCantidad)) {
        alert('Los días trabajados deben ser un número entero.');
        return;
      }
    }

    if (!Number.isFinite(valorTarifa) || valorTarifa <= 0) {
      alert('La tarifa debe ser mayor que cero.');
      return;
    }

    if (!fecha) {
      alert('Selecciona la fecha de la labor.');
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
      // Los kilos de recolección se completan al liquidar.
      cantidad: modalidad === 'recoleccion' ? null : valorCantidad,
      tarifaAplicada: valorTarifa,
      subtotal: modalidad === 'recoleccion' ? 0 : valorCantidad * valorTarifa,
      fecha,
      estado: 'pendiente',
    };

    setJornadas((anteriores) => [...anteriores, nuevaJornada]);
    setCantidad('');
    setLoteId('');
    setVista('lista');
    alert('Labor registrada correctamente.');
  };

  const realizarPago = (trabajador) => {
    if (!fincaSeleccionada) {
      alert('Selecciona una finca antes de liquidar.');
      return;
    }

    const pendientes = jornadasPendientes(
      trabajador.id,
      fincaSeleccionada.id
    );

    if (pendientes.length === 0) {
      alert('Este trabajador no tiene pagos pendientes en esta finca.');
      return;
    }

    const pendientesConCantidad = pendientes.map((j) => {
      if (j.modalidad === 'recoleccion') {
        const kilos = Number(kilosLiquidacion[j.id] ?? j.cantidad);
        return {
          ...j,
          cantidad: kilos,
          subtotal: kilos * Number(j.tarifaAplicada || tarifaKg),
        };
      }

      return {
        ...j,
        subtotal: Number(j.cantidad || 0) * Number(j.tarifaAplicada || tarifaJornal),
      };
    });

    const recoleccionIncompleta = pendientesConCantidad.some(
      (j) =>
        j.modalidad === 'recoleccion' &&
        (!Number.isFinite(j.cantidad) || j.cantidad <= 0)
    );

    if (recoleccionIncompleta) {
      alert('Ingresa los kilos recolectados en cada labor de recolección antes de liquidar.');
      return;
    }

    const monto = pendientesConCantidad.reduce(
      (total, j) => total + Number(j.subtotal || 0),
      0
    );

    if (monto <= 0) {
      alert('El valor de la liquidación debe ser mayor que cero.');
      return;
    }

    const confirmado = window.confirm(
      `¿Confirmas el pago de ${dinero(monto)} a ${trabajador.nombre} ` +
      `por las labores pendientes de ${fincaSeleccionada.nombre}?`
    );

    if (!confirmado) return;

    const idsPagados = new Set(pendientes.map((j) => j.id));
    const fechaPago = hoy();

    setJornadas((anteriores) =>
      anteriores.map((j) => {
        const liquidada = pendientesConCantidad.find((pendiente) => pendiente.id === j.id);
        return idsPagados.has(j.id) && liquidada
          ? {
              ...j,
              cantidad: liquidada.cantidad,
              estado: 'pagado',
              fechaPago,
              tarifaAplicada: Number(liquidada.tarifaAplicada || 0),
              subtotal: Number(liquidada.subtotal || 0),
            }
          : j;
      })
    );

    // Registrar un solo egreso para este cierre de liquidación.
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

    alert(`Pago de ${dinero(monto)} registrado para ${trabajador.nombre}.`);
  };

  const cambiarFinca = (valor) => {
    const id = valor ? Number(valor) : null;
    setFincaId(id);
    setLoteId('');

    if (id !== null) {
      localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(id));
    }
  };

  const tarjeta = (titulo, subtitulo, destino) => (
    <button
      key={destino}
      type="button"
      onClick={() => setVista(destino)}
      style={{
        background: vista === destino ? '#ecfdf5' : '#fff',
        border: vista === destino ? '2px solid #047857' : '1px solid #cbd5e1',
        borderRadius: 14,
        padding: 16,
        textAlign: 'left',
        cursor: 'pointer',
        color: '#1e293b',
      }}
    >
      <strong style={{ display: 'block', marginBottom: 5 }}>{titulo}</strong>
      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{subtitulo}</span>
    </button>
  );

  const campo = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 46,
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
    minHeight: 46,
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
      <h2 style={{ color: '#064e3b' }}>Personal y Gestión Laboral</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {tarjeta('Liquidaciones', 'Saldos y pagos', 'lista')}
        {tarjeta('Registrar labor', 'Registrar actividad o jornal', 'nueva_jornada')}
        {tarjeta('Nuevo trabajador', 'Agregar personal', 'nuevo_trabajador')}
        {tarjeta('Tarifas y actividades', 'Precios y labores', 'tarifas')}
      </div>

      <section
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: 16,
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <label style={etiqueta}>
          Finca seleccionada
          <select
            value={fincaId ?? ''}
            onChange={(e) => cambiarFinca(e.target.value)}
            style={campo}
          >
            <option value="">Selecciona una finca...</option>
            {fincas.map((f) => (
              <option key={f.id} value={f.id}>{f.nombre}</option>
            ))}
          </select>
        </label>
        {!fincaSeleccionada && (
          <p style={{ color: '#b45309', marginBottom: 0 }}>
            Crea una finca en el módulo Fincas para registrar labores y liquidaciones.
          </p>
        )}
      </section>

      {vista === 'lista' && (
        <section>
          <h3>Liquidaciones pendientes</h3>
          {!fincaSeleccionada ? (
            <p>Selecciona una finca para consultar sus liquidaciones.</p>
          ) : trabajadores.length === 0 ? (
            <p>No tienes trabajadores registrados. Agrega uno para comenzar.</p>
          ) : (
            trabajadores.map((trabajador) => {
              const pendiente = calcularPendiente(
                trabajador.id,
                fincaSeleccionada.id
              );
              const registros = jornadasPendientes(
                trabajador.id,
                fincaSeleccionada.id
              );

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
                  <p style={{ margin: '0 0 8px', color: '#64748b' }}>
                    {registros.length} labor(es) pendiente(s) en {fincaSeleccionada.nombre}
                  </p>
                  <p
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: pendiente > 0 ? '#b91c1c' : '#047857',
                    }}
                  >
                    Saldo: {dinero(pendiente)}
                  </p>
                  {registros.length > 0 && (
                    <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: 6 }}>Fecha</th>
                            <th style={{ textAlign: 'left', padding: 6 }}>Labor</th>
                            <th style={{ textAlign: 'left', padding: 6 }}>Lote</th>
                            <th style={{ textAlign: 'right', padding: 6 }}>Kilos / días</th>
                            <th style={{ textAlign: 'right', padding: 6 }}>Valor estimado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registros.map((j) => {
                            const loteRelacionado = j.loteId != null
                              ? lotesPorId.get(String(j.loteId))
                              : null;
                            return (
                              <tr key={j.id}>
                                <td style={{ padding: 6 }}>{j.fecha}</td>
                                <td style={{ padding: 6 }}>{j.actividad}</td>
                                <td style={{ padding: 6 }}>
                                  {loteRelacionado?.nombre || j.lote || 'Lote anterior'}
                                </td>
                                <td style={{ padding: 6, textAlign: 'right' }}>
                                  {j.modalidad === 'recoleccion' ? (
                                    <input
                                      aria-label={`Kilos recolectados por ${trabajador.nombre} el ${j.fecha}`}
                                      type="number"
                                      min="0.1"
                                      step="0.1"
                                      value={kilosLiquidacion[j.id] ?? (j.cantidad ?? '')}
                                      onChange={(e) =>
                                        setKilosLiquidacion((anteriores) => ({
                                          ...anteriores,
                                          [j.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Ingresar kg"
                                      style={{ ...campo, minWidth: 110, marginTop: 0 }}
                                    />
                                  ) : (
                                    `${j.cantidad || 0} día(s)`
                                  )}
                                </td>
                                <td style={{ padding: 6, textAlign: 'right' }}>
                                  {j.modalidad === 'recoleccion'
                                    ? dinero(
                                        Number(kilosLiquidacion[j.id] ?? j.cantidad ?? 0) *
                                        Number(j.tarifaAplicada || tarifaKg)
                                      )
                                    : dinero(j.subtotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button
                    type="button"
                    style={{ ...boton, width: '100%' }}
                    disabled={registros.length === 0}
                    onClick={() => realizarPago(trabajador)}
                  >
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
                    <th style={{ textAlign: 'left', padding: 8 }}>Fecha pago</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {jornadas
                    .filter(
                      (j) =>
                        j.estado === 'pagado' &&
                        perteneceAFinca(j, fincaSeleccionada.id)
                    )
                    .map((j) => {
                      const t = trabajadores.find(
                        (trabajador) =>
                          Number(trabajador.id) === Number(j.trabajadorId)
                      );
                      return (
                        <tr key={j.id}>
                          <td style={{ padding: 8 }}>{j.fecha}</td>
                          <td style={{ padding: 8 }}>{t?.nombre || 'Trabajador anterior'}</td>
                          <td style={{ padding: 8 }}>{j.actividad}</td>
                          <td style={{ padding: 8 }}>{j.fechaPago || 'Sin fecha'}</td>
                          <td style={{ padding: 8, textAlign: 'right' }}>
                            {dinero(j.subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {vista === 'nueva_jornada' && (
        <form
          onSubmit={guardarJornada}
          style={{
            background: '#fff',
            padding: 20,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
          }}
        >
          <h3>Registrar labor operativa</h3>

          <label style={etiqueta}>
            Trabajador
            <select
              value={trabajadorId}
              onChange={(e) => setTrabajadorId(e.target.value)}
              required
              style={campo}
            >
              <option value="">Selecciona un trabajador...</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </label>

          <label style={etiqueta}>
            Actividad
            <select
              value={actividadSeleccionada}
              onChange={(e) => {
                setActividadSeleccionada(e.target.value);
                setModalidad(
                  e.target.value === 'Recolección de café'
                    ? 'recoleccion'
                    : 'jornal'
                );
              }}
              required
              style={campo}
            >
              {actividades.map((actividad) => (
                <option key={actividad} value={actividad}>{actividad}</option>
              ))}
            </select>
          </label>

          <label style={etiqueta}>
            Finca
            <select
              value={fincaId ?? ''}
              onChange={(e) => cambiarFinca(e.target.value)}
              required
              style={campo}
            >
              <option value="">Selecciona una finca...</option>
              {fincas.map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
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
              <option value="">Selecciona un lote...</option>
              {lotesDeFinca.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}{l.variedad ? ` (${l.variedad})` : ''}
                </option>
              ))}
            </select>
          </label>

          <label style={etiqueta}>
            Modalidad de pago
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value)}
              style={campo}
            >
              <option value="recoleccion">
                Por kilogramo — {dinero(Number(tarifaKg))}
              </option>
              <option value="jornal">
                Por jornal/día — {dinero(Number(tarifaJornal))}
              </option>
            </select>
          </label>

          <label style={etiqueta}>
            {modalidad === 'recoleccion' ? 'Kilos recolectados (se registran al liquidar)' : 'Días trabajados'}
            {modalidad === 'jornal' ? (
              <input
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                style={campo}
                placeholder="Ej. 1"
              />
            ) : (
              <p style={{ color: '#64748b', fontWeight: 400, margin: '6px 0 0' }}>
                No necesitas conocer los kilos ahora. Podrás ingresarlos al finalizar la jornada,
                en la sección Liquidaciones.
              </p>
            )}
          </label>

          <label style={etiqueta}>
            Fecha de la labor
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              max={hoy()}
              required
              style={campo}
            />
          </label>

          <button type="submit" style={boton}>
            Guardar registro operativo
          </button>
        </form>
      )}

      {vista === 'nuevo_trabajador' && (
        <form
          onSubmit={guardarTrabajador}
          style={{
            background: '#fff',
            padding: 20,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
          }}
        >
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
      )}

      {vista === 'tarifas' && (
        <section>
          <article
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h3>Tarifas de mano de obra</h3>
            <p style={{ color: '#64748b' }}>
              Los nuevos registros guardan la tarifa aplicada. Cambiar una tarifa
              no modifica los valores de las labores ya registradas.
            </p>

            <label style={etiqueta}>
              Tarifa por kilogramo (COP)
              <input
                type="number"
                min="1"
                step="1"
                value={tarifaKg}
                onChange={(e) => setTarifaKg(e.target.value)}
                required
                style={campo}
              />
            </label>

            <label style={etiqueta}>
              Tarifa por jornal/día (COP)
              <input
                type="number"
                min="1"
                step="1"
                value={tarifaJornal}
                onChange={(e) => setTarifaJornal(e.target.value)}
                required
                style={campo}
              />
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

          <article
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 20,
            }}
          >
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
              {actividades.map((actividad) => (
                <li key={actividad} style={{ padding: 6 }}>{actividad}</li>
              ))}
            </ul>
          </article>
        </section>
      )}
    </div>
  );
}
