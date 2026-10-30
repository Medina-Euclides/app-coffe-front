import { useState, useEffect } from 'react';
import { obtenerFechaLocal } from '#lib/formatters';
import { leerLocal, guardarLocal } from '#lib/storage';
import FincaSelector from './components/FincaSelector.jsx';
import FincaForm from './components/FincaForm.jsx';
import LoteForm from './components/LoteForm.jsx';
import LoteDetalle from './components/LoteDetalle.jsx';
import LotesList from './components/LotesList.jsx';

export default function Fincas({ usuario, subSeccion }) {
  const userId = usuario?.id || 'default';

  const [fincas, setFincas] = useState(() =>
    leerLocal(`cafesmart_fincas_${userId}`, [
      { id: Date.now(), nombre: 'Mi Finca Principal' },
    ])
  );

  const [fincaActivaId, setFincaActivaId] = useState(() => {
    const guardada = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return guardada ? Number(guardada) : null;
  });

  const [lotes, setLotes] = useState(() =>
    leerLocal(`cafesmart_lotes_${userId}`, [])
  );

  const [jornadas, setJornadas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [loteDetalle, setLoteDetalle] = useState(null);

  const [mostrarFormFinca, setMostrarFormFinca] = useState(false);
  const [mostrarFormLote, setMostrarFormLote] = useState(false);
  const [loteEnEdicion, setLoteEnEdicion] = useState(null);
  const [verInactivos, setVerInactivos] = useState(false);

  const [nombreFinca, setNombreFinca] = useState('');
  const [nombreLote, setNombreLote] = useState('');
  const [variedadLote, setVariedadLote] = useState('Castillo');
  const [hectareasLote, setHectareasLote] = useState('');

  // Sincronización con el menú lateral (App.jsx)
  useEffect(() => {
    if (subSeccion) {
      if (subSeccion === 'fincas-lotes') {
        setMostrarFormFinca(false);
        setMostrarFormLote(false);
        setLoteDetalle(null);
      }
      if (subSeccion === 'nuevo-lote') {
        setMostrarFormLote(true);
        setMostrarFormFinca(false);
        setLoteEnEdicion(null);
        setNombreLote('');
        setVariedadLote('Castillo');
        setHectareasLote('');
        setLoteDetalle(null);
      }
      if (subSeccion === 'nueva-finca') {
        setMostrarFormFinca(true);
        setMostrarFormLote(false);
        setLoteDetalle(null);
      }
    }
  }, [subSeccion]);

  // Garantizar que siempre exista una finca seleccionada válida
  useEffect(() => {
    if (fincas.length === 0) return;

    const seleccionValida = fincas.some(
      (f) => Number(f.id) === Number(fincaActivaId)
    );

    if (!seleccionValida) {
      setFincaActivaId(fincas[0].id);
    }
  }, [fincas, fincaActivaId]);

  // Cargar jornadas y trabajadores del usuario
  useEffect(() => {
    setJornadas(leerLocal(`cafesmart_jornadas_${userId}`, []));
    setTrabajadores(leerLocal(`cafesmart_trabajadores_${userId}`, []));
  }, [userId]);

  // Persistir fincas y selección activa
  useEffect(() => {
    guardarLocal(`cafesmart_fincas_${userId}`, fincas);
    if (fincaActivaId !== null) {
      localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(fincaActivaId));
    }
  }, [fincas, fincaActivaId, userId]);

  // Persistir lotes
  useEffect(() => {
    guardarLocal(`cafesmart_lotes_${userId}`, lotes);
  }, [lotes, userId]);

  const fincaActual =
    fincas.find((f) => Number(f.id) === Number(fincaActivaId)) ||
    fincas[0] ||
    null;

  const lotesDeFincaActiva = lotes.filter(
    (l) =>
      Number(l.fincaId) === Number(fincaActivaId) &&
      (verInactivos ? l.estado === 'inactivo' : l.estado !== 'inactivo')
  );

  const jornadaPerteneceAlLote = (jornada, lote) => {
    if (!jornada || !lote) return false;

    const mismoLote =
      String(jornada.lote || '').trim().toLowerCase() ===
      String(lote.nombre || '').trim().toLowerCase();

    if (!mismoLote) return false;

    if (jornada.fincaId !== undefined && jornada.fincaId !== null) {
      return Number(jornada.fincaId) === Number(lote.fincaId);
    }

    const coincidencias = lotes.filter(
      (l) =>
        String(l.nombre || '').trim().toLowerCase() ===
        String(lote.nombre || '').trim().toLowerCase()
    );

    return coincidencias.length === 1;
  };

  const calcularProduccionLote = (lote) => {
    if (!lote) return 0;

    return jornadas
      .filter((j) => jornadaPerteneceAlLote(j, lote) && j.modalidad === 'recoleccion')
      .reduce((total, j) => {
        const cantidad = Number(j.cantidad || 0);
        return total + (Number.isFinite(cantidad) ? cantidad : 0);
      }, 0);
  };

  const obtenerNombreTrabajador = (id) => {
    const trabajador = trabajadores.find((trab) => Number(trab.id) === Number(id));
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
    };

    setFincas((anteriores) => [...anteriores, nuevaFinca]);
    setFincaActivaId(nuevaFinca.id);
    setNombreFinca('');
    setMostrarFormFinca(false);
    setMostrarFormLote(false);
    setLoteDetalle(null);
    alert('Finca guardada correctamente.');
  };

  const guardarLote = (e) => {
    e.preventDefault();
    const nombre = nombreLote.trim();
    const hectareas = hectareasLote ? Number(hectareasLote) : null;

    if (!nombre) {
      alert('Ingresa el nombre del lote.');
      return;
    }

    if (hectareas !== null && (!Number.isFinite(hectareas) || hectareas <= 0)) {
      alert('Si ingresas hectáreas, deben ser un número mayor que cero.');
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
            ? { ...l, nombre, variedad: variedadLote, hectareas }
            : l
        )
      );
      setLoteEnEdicion(null);
      alert('Lote actualizado correctamente.');
    } else {
      const nuevoLote = {
        id: Date.now(),
        fincaId: fincaActual.id,
        nombre,
        variedad: variedadLote,
        hectareas,
        estado: 'activo',
        fechaCreacion: obtenerFechaLocal(),
        fechaDesactivacion: null,
        fechaReactivacion: null,
      };

      setLotes((anteriores) => [...anteriores, nuevoLote]);
      alert('Lote guardado correctamente.');
    }

    setNombreLote('');
    setVariedadLote('Castillo');
    setHectareasLote('');
    setMostrarFormLote(false);
  };

  const iniciarEdicionLote = (lote) => {
    if (lote.estado === 'inactivo') {
      alert('Debes reactivar el lote para poder editarlo.');
      return;
    }

    setLoteEnEdicion(lote);
    setNombreLote(lote.nombre);
    setVariedadLote(lote.variedad || 'Castillo');
    setHectareasLote(lote.hectareas ? String(lote.hectareas) : '');
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
    const fechaHoy = obtenerFechaLocal();

    setLotes((anteriores) =>
      anteriores.map((l) => {
        if (l.id === loteId) {
          return {
            ...l,
            estado: nuevoEstado,
            ...(nuevoEstado === 'inactivo'
              ? { fechaDesactivacion: fechaHoy }
              : { fechaReactivacion: fechaHoy }),
          };
        }
        return l;
      })
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
      <FincaSelector
        fincas={fincas}
        fincaActivaId={fincaActual?.id}
        onCambiarFinca={(id) => {
          setFincaActivaId(id);
          setLoteDetalle(null);
          cancelarFormularioLote();
          setVerInactivos(false);
        }}
      />

      {/* FORMULARIO CREAR FINCA */}
      {mostrarFormFinca && (
        <FincaForm
          nombreFinca={nombreFinca}
          setNombreFinca={setNombreFinca}
          onGuardar={guardarFinca}
        />
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
          </div>
        </div>
      )}

      {/* FORMULARIO CREAR / EDITAR LOTE */}
      {mostrarFormLote && !mostrarFormFinca && (
        <LoteForm
          loteEnEdicion={loteEnEdicion}
          fincaActual={fincaActual}
          nombreLote={nombreLote}
          setNombreLote={setNombreLote}
          variedadLote={variedadLote}
          setVariedadLote={setVariedadLote}
          hectareasLote={hectareasLote}
          setHectareasLote={setHectareasLote}
          onGuardar={guardarLote}
        />
      )}

      {/* VISTA DETALLE DE LOTE */}
      {loteDetalle && (
        <LoteDetalle
          lote={loteDetalle}
          produccionTotal={calcularProduccionLote(loteDetalle)}
          historialJornadas={jornadas.filter((j) =>
            jornadaPerteneceAlLote(j, loteDetalle)
          )}
          obtenerNombreTrabajador={obtenerNombreTrabajador}
          onVolver={() => setLoteDetalle(null)}
          onIniciarEdicion={iniciarEdicionLote}
          onCambiarEstado={cambiarEstadoLote}
        />
      )}

      {/* LISTADO DE TARJETAS DE LOTES */}
      {!loteDetalle && !mostrarFormLote && !mostrarFormFinca && (
        <LotesList
          lotes={lotesDeFincaActiva}
          verInactivos={verInactivos}
          onSeleccionarLote={setLoteDetalle}
          calcularProduccionLote={calcularProduccionLote}
        />
      )}
    </div>
  );
}
