import { useState, useEffect } from 'react';

export default function Fincas({ usuario }) {
  const userId = usuario?.id || 'default';

  const [fincas, setFincas] = useState(() => {
    try {
      const guardadas = localStorage.getItem(`cafesmart_fincas_${userId}`);
      return guardadas
        ? JSON.parse(guardadas)
        : [
            {
              id: Date.now(),
              nombre: 'Mi Finca Principal',
              ubicacion: 'Principal',
            },
          ];
    } catch {
      return [
        {
          id: Date.now(),
          nombre: 'Mi Finca Principal',
          ubicacion: 'Principal',
        },
      ];
    }
  });

  const [fincaActivaId, setFincaActivaId] = useState(() => {
    try {
      const guardada = localStorage.getItem(
        `cafesmart_finca_activa_${userId}`
      );
      return guardada ? Number(guardada) : null;
    } catch {
      return null;
    }
  });

  const [lotes, setLotes] = useState(() => {
    try {
      const guardados = localStorage.getItem(`cafesmart_lotes_${userId}`);
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });

  const [jornadas, setJornadas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loteDetalle, setLoteDetalle] = useState(null);

  const [mostrarFormFinca, setMostrarFormFinca] = useState(false);
  const [mostrarFormLote, setMostrarFormLote] = useState(false);
  const [loteEnEdicion, setLoteEnEdicion] = useState(null);
  const [verInactivos, setVerInactivos] = useState(false);

  const [nombreFinca, setNombreFinca] = useState('');
  const [ubicacionFinca, setUbicacionFinca] = useState('');
  const [nombreLote, setNombreLote] = useState('');
  const [variedadLote, setVariedadLote] = useState('Castillo');
  const [hectareasLote, setHectareasLote] = useState('');

  // Garantizar que siempre exista una finca seleccionada.
  useEffect(() => {
    if (fincas.length === 0) return;

    const seleccionValida = fincas.some(
      (f) => Number(f.id) === Number(fincaActivaId)
    );

    if (!seleccionValida) {
      setFincaActivaId(fincas[0].id);
    }
  }, [fincas, fincaActivaId]);

  // Cargar las jornadas y trabajadores del usuario actual.
  useEffect(() => {
    try {
      const jornadasGuardadas = localStorage.getItem(
        `cafesmart_jornadas_${userId}`
      );
      const trabajadoresGuardados = localStorage.getItem(
        `cafesmart_trabajadores_${userId}`
      );

      setJornadas(
        jornadasGuardadas ? JSON.parse(jornadasGuardadas) : []
      );

      setTrabajadores(
        trabajadoresGuardados ? JSON.parse(trabajadoresGuardados) : []
      );
    } catch (error) {
      console.error('Error al cargar los datos de CafeSmart:', error);
      setJornadas([]);
      setTrabajadores([]);
    }
  }, [userId]);

  // Guardar fincas y finca seleccionada.
  useEffect(() => {
    localStorage.setItem(
      `cafesmart_fincas_${userId}`,
      JSON.stringify(fincas)
    );

    if (fincaActivaId !== null) {
      localStorage.setItem(
        `cafesmart_finca_activa_${userId}`,
        String(fincaActivaId)
      );
    }
  }, [fincas, fincaActivaId, userId]);

  // Guardar lotes.
  useEffect(() => {
    localStorage.setItem(
      `cafesmart_lotes_${userId}`,
      JSON.stringify(lotes)
    );
  }, [lotes, userId]);

  const fincaActual =
    fincas.find((f) => Number(f.id) === Number(fincaActivaId)) ||
    fincas[0] ||
    null;

  const lotesDeFincaActiva = lotes.filter(
    (l) =>
      Number(l.fincaId) === Number(fincaActivaId) &&
      (verInactivos
        ? l.estado === 'inactivo'
        : l.estado !== 'inactivo')
  );

  // Determinar si una jornada corresponde a un lote de esta finca.
  const jornadaPerteneceAlLote = (jornada, lote) => {
    if (!jornada || !lote) return false;

    const mismoLote =
      String(jornada.lote || '').trim().toLowerCase() ===
      String(lote.nombre || '').trim().toLowerCase();

    if (!mismoLote) return false;

    // Las jornadas nuevas incluyen fincaId.
    // Si existe, debe coincidir con la finca del lote.
    if (
      jornada.fincaId !== undefined &&
      jornada.fincaId !== null
    ) {
      return Number(jornada.fincaId) === Number(lote.fincaId);
    }

    // Para registros antiguos sin fincaId, solo se puede
    // confirmar la relación si el nombre del lote es único
    // entre todas las fincas.
    const coincidencias = lotes.filter(
      (l) =>
        String(l.nombre || '').trim().toLowerCase() ===
        String(lote.nombre || '').trim().toLowerCase()
    );

    return coincidencias.length === 1;
  };

  // Calcular los kilos recolectados en un lote específico.
  const calcularProduccionLote = (lote) => {
    if (!lote) return 0;

    return jornadas
      .filter(
        (j) =>
          jornadaPerteneceAlLote(j, lote) &&
          j.modalidad === 'recoleccion'
      )
      .reduce((total, j) => {
        const cantidad = Number(j.cantidad || 0);
        return total + (Number.isFinite(cantidad) ? cantidad : 0);
      }, 0);
  };

  const obtenerNombreTrabajador = (id) => {
    const trabajador = trabajadores.find(
      (trab) => Number(trab.id) === Number(id)
    );

    return trabajador ? trabajador.nombre : 'Trabajador';
  };

  const guardarFinca = (e) => {
    e.preventDefault();

    const nombre = nombreFinca.trim();

    if (!nombre) {
      alert('Ingresa el nombre de la finca.');
      return;
    }

    const nuevaFinca = {
      id: Date.now(),
      nombre,
      ubicacion: ubicacionFinca.trim() || 'Principal',
    };

    setFincas((anteriores) => [...anteriores, nuevaFinca]);
    setFincaActivaId(nuevaFinca.id);

    setNombreFinca('');
    setUbicacionFinca('');
    setMostrarFormFinca(false);
    setMostrarFormLote(false);
    setLoteDetalle(null);
  };

  const guardarLote = (e) => {
    e.preventDefault();

    const nombre = nombreLote.trim();
    const hectareas = Number(hectareasLote);

    if (!nombre) {
      alert('Ingresa el nombre del lote.');
      return;
    }

    if (
      hectareasLote === '' ||
      !Number.isFinite(hectareas) ||
      hectareas <= 0
    ) {
      alert('Las hectáreas deben ser un número mayor que cero.');
      return;
    }

    if (!loteEnEdicion && !fincaActual) {
      alert('Primero debes seleccionar una finca.');
      return;
    }

    if (loteEnEdicion) {
      setLotes((anteriores) =>
        anteriores.map((l) =>
          l.id === loteEnEdicion.id
            ? {
                ...l,
                nombre,
                variedad: variedadLote,
                hectareas,
              }
            : l
        )
      );

      setLoteEnEdicion(null);
    } else {
      const nuevoLote = {
        id: Date.now(),
        fincaId: fincaActual.id,
        nombre,
        variedad: variedadLote,
        hectareas,
        estado: 'activo',
      };

      setLotes((anteriores) => [...anteriores, nuevoLote]);
    }

    setNombreLote('');
    setVariedadLote('Castillo');
    setHectareasLote('');
    setMostrarFormLote(false);
  };

  const iniciarEdicionLote = (lote) => {
    setLoteEnEdicion(lote);
    setNombreLote(lote.nombre);
    setVariedadLote(lote.variedad || 'Castillo');
    setHectareasLote(String(lote.hectareas ?? ''));
    setMostrarFormLote(true);
    setMostrarFormFinca(false);
    setLoteDetalle(null);
  };

  const cancelarFormularioLote = () => {
    setMostrarFormLote(false);
    setLoteEnEdicion(null);
    setNombreLote('');
    setVariedadLote('Castillo');
    setHectareasLote('');
  };

  const cambiarEstadoLote = (loteId, nuevoEstado) => {
    setLotes((anteriores) =>
      anteriores.map((l) =>
        l.id === loteId ? { ...l, estado: nuevoEstado } : l
      )
    );

    setLoteDetalle(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* SELECCIÓN DE FINCA */}
      <div
        style={{
          backgroundColor: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          padding: '20px',
          borderRadius: '18px',
        }}
      >
        <span
          style={{
            fontSize: '0.85rem',
            color: '#047857',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Finca Seleccionada:
        </span>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginTop: '10px',
          }}
        >
          <select
            value={fincaActual?.id ?? ''}
            onChange={(e) => {
              setFincaActivaId(Number(e.target.value));
              setLoteDetalle(null);
              cancelarFormularioLote();
              setVerInactivos(false);
            }}
            style={{
              fontWeight: 'bold',
              color: '#064e3b',
              backgroundColor: 'white',
              margin: 0,
            }}
          >
            {fincas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre} ({f.ubicacion})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setMostrarFormFinca(!mostrarFormFinca);
              setMostrarFormLote(false);
              setLoteEnEdicion(null);
              setLoteDetalle(null);
            }}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: 'transparent',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '9px 12px',
              borderRadius: '10px',
              fontWeight: '500',
              cursor: 'pointer',
              minHeight: '40px',
              fontSize: '0.85rem',
            }}
          >
            {mostrarFormFinca
              ? 'Cancelar'
              : '⚙ Administrar fincas (opcional)'}
          </button>
        </div>
      </div>

      {/* FORMULARIO CREAR FINCA */}
      {mostrarFormFinca && (
        <form
          onSubmit={guardarFinca}
          style={{
            backgroundColor: '#ffffff',
            border: '2px solid #047857',
            padding: '22px',
            borderRadius: '18px',
          }}
        >
          <h3 style={{ color: '#064e3b', marginBottom: '18px' }}>
            Agregar otra finca
          </h3>

          <label>Nombre de la Finca:</label>
          <input
            type="text"
            placeholder="Ej: Finca San José"
            value={nombreFinca}
            onChange={(e) => setNombreFinca(e.target.value)}
            required
          />

          <label>Ubicación o Municipio:</label>
          <input
            type="text"
            placeholder="Ej: Piendamó"
            value={ubicacionFinca}
            onChange={(e) => setUbicacionFinca(e.target.value)}
          />

          <button type="submit" className="btn-primary">
            Guardar Finca
          </button>
        </form>
      )}

      {/* ENCABEZADO Y ACCIONES DE LOTES */}
      {!loteDetalle && !mostrarFormFinca && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <h3
            style={{
              color: '#0f172a',
              margin: 0,
              fontSize: '1.2rem',
            }}
          >
            Lotes en {fincaActual?.nombre || 'Finca Principal'}
          </h3>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setVerInactivos(!verInactivos)}
              style={{
                flex: 1,
                backgroundColor: verInactivos ? '#334155' : '#f1f5f9',
                color: verInactivos ? '#ffffff' : '#475569',
                border: '1px solid #cbd5e1',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              {verInactivos ? 'Ver Activos' : 'Ver Inactivos'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (mostrarFormLote) {
                  cancelarFormularioLote();
                } else {
                  setMostrarFormLote(true);
                  setLoteEnEdicion(null);
                  setNombreLote('');
                  setVariedadLote('Castillo');
                  setHectareasLote('');
                }
              }}
              style={{
                flex: 1,
                backgroundColor: mostrarFormLote ? '#dc2626' : '#166534',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
                fontSize: '0.9rem',
              }}
            >
              {mostrarFormLote ? 'Cancelar' : '+ Crear Lote'}
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO CREAR / EDITAR LOTE */}
      {mostrarFormLote && !mostrarFormFinca && (
        <form
          onSubmit={guardarLote}
          style={{
            backgroundColor: '#ffffff',
            border: '2px solid #047857',
            padding: '22px',
            borderRadius: '18px',
          }}
        >
          <h4 style={{ color: '#047857', marginBottom: '18px' }}>
            {loteEnEdicion
              ? `Editar Lote: ${loteEnEdicion.nombre}`
              : `Agregar Lote a ${fincaActual?.nombre || ''}`}
          </h4>

          <label>Nombre del Lote:</label>
          <input
            type="text"
            placeholder="Ej: Lote El Mirador"
            value={nombreLote}
            onChange={(e) => setNombreLote(e.target.value)}
            required
          />

          <label>Variedad de Café:</label>
          <select
            value={variedadLote}
            onChange={(e) => setVariedadLote(e.target.value)}
          >
            <option value="Castillo">Castillo</option>
            <option value="Caturra">Caturra</option>
            <option value="Colombia">Colombia</option>
            <option value="Borbón">Borbón</option>
            <option value="Geisha">Geisha</option>
          </select>

          <label>Área (Hectáreas):</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            placeholder="Ej: 2.5"
            value={hectareasLote}
            onChange={(e) => setHectareasLote(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary">
            {loteEnEdicion ? 'Actualizar Lote' : 'Guardar Lote'}
          </button>
        </form>
      )}

      {/* VISTA DETALLE DE LOTE */}
      {loteDetalle && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <button
            type="button"
            onClick={() => setLoteDetalle(null)}
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
              {loteDetalle.nombre}
            </h3>

            <p style={{ margin: '6px 0', color: '#334155' }}>
              <strong>Variedad:</strong> {loteDetalle.variedad}
            </p>

            <p style={{ margin: '6px 0', color: '#334155' }}>
              <strong>Área:</strong> {loteDetalle.hectareas} Ha
            </p>

            <p style={{ margin: '6px 0', color: '#334155' }}>
              <strong>Estado:</strong>{' '}
              <span
                style={{
                  fontWeight: 'bold',
                  color:
                    loteDetalle.estado === 'inactivo'
                      ? '#dc2626'
                      : '#059669',
                }}
              >
                {loteDetalle.estado === 'inactivo'
                  ? 'Inactivo / En Descanso'
                  : 'Activo en Cosecha'}
              </span>
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => iniciarEdicionLote(loteDetalle)}
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

              {loteDetalle.estado === 'inactivo' ? (
                <button
                  type="button"
                  onClick={() => cambiarEstadoLote(loteDetalle.id, 'activo')}
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
                  onClick={() =>
                    cambiarEstadoLote(loteDetalle.id, 'inactivo')
                  }
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
              {calcularProduccionLote(loteDetalle)} Kg
            </h2>
          </div>

          <h4 style={{ color: '#334155', margin: '6px 0' }}>
            Historial de Trabajos en este Lote:
          </h4>

          {jornadas.filter((j) => jornadaPerteneceAlLote(j, loteDetalle))
            .length === 0 ? (
            <p style={{ color: '#64748b' }}>
              No hay registros de trabajo en este lote.
            </p>
          ) : (
            jornadas
              .filter((j) => jornadaPerteneceAlLote(j, loteDetalle))
              .map((j) => (
                <div
                  key={j.id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong
                      style={{ color: '#047857', fontSize: '1.05rem' }}
                    >
                      {obtenerNombreTrabajador(j.trabajadorId)}
                    </strong>

                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.85rem',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {j.fecha} —{' '}
                      {j.modalidad === 'recoleccion'
                        ? 'Recolección'
                        : 'Jornal'}
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
      )}

      {/* LISTADO DE TARJETAS DE LOTES */}
      {!loteDetalle && !mostrarFormLote && !mostrarFormFinca && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {lotesDeFincaActiva.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                color: '#64748b',
                padding: '30px 20px',
              }}
            >
              <p style={{ margin: 0, fontSize: '1rem' }}>
                {verInactivos
                  ? 'No hay lotes inactivos en esta finca.'
                  : 'Esta finca aún no tiene lotes activos registrados.'}
              </p>

              <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
                Presiona "+ Crear Lote" para comenzar.
              </p>
            </div>
          ) : (
            lotesDeFincaActiva.map((lote) => {
              const kgTotal = calcularProduccionLote(lote);

              return (
                <div
                  key={lote.id}
                  onClick={() => setLoteDetalle(lote)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4
                      style={{
                        color: '#047857',
                        margin: '0 0 6px 0',
                        fontSize: '1.15rem',
                      }}
                    >
                      {lote.nombre}
                    </h4>

                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {lote.variedad} • {lote.hectareas} Ha
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        display: 'block',
                      }}
                    >
                      Producción:
                    </span>

                    <strong
                      style={{ color: '#15803d', fontSize: '1.25rem' }}
                    >
                      {kgTotal} Kg
                    </strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}