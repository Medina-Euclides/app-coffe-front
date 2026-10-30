import { useState, useEffect } from 'react';
import { leerLocal, guardarLocal } from '#lib/storage';
import { api } from '#services/api';
import {
  guardarCacheFincasYLotes,
  guardarFincaActiva,
} from '#services/farmStorage';
import FincaSelector from './components/FincaSelector.jsx';
import FincaForm from './components/FincaForm.jsx';
import LoteForm from './components/LoteForm.jsx';
import LoteDetalle from './components/LoteDetalle.jsx';
import LotesList from './components/LotesList.jsx';

export default function Fincas({ usuario, subSeccion }) {
  const userId = usuario?.id || 'default';

  const [fincas, setFincas] = useState(() =>
    leerLocal(`cafesmart_fincas_${userId}`, [])
  );

  const [fincaActivaId, setFincaActivaId] = useState(() => {
    const guardada = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return guardada || null;
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
  const [ubicacionFinca, setUbicacionFinca] = useState('');
  const [descripcionFinca, setDescripcionFinca] = useState('');
  const [nombreLote, setNombreLote] = useState('');
  const [variedadLote, setVariedadLote] = useState('Castillo');
  const [hectareasLote, setHectareasLote] = useState('');
  const [descripcionLote, setDescripcionLote] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [avisoEsError, setAvisoEsError] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([api.farms.list(), api.lots.list()])
      .then(([fincasCargadas, lotesCargados]) => {
        if (!active) return;
        setFincas(fincasCargadas);
        setLotes(lotesCargados);
        guardarCacheFincasYLotes(userId, fincasCargadas, lotesCargados);
        const fincaGuardada = localStorage.getItem(
          `cafesmart_finca_activa_${userId}`,
        );
        setFincaActivaId(
          fincasCargadas.some(
            (finca) => String(finca.id) === String(fincaGuardada),
          )
            ? fincaGuardada
            : fincasCargadas[0]?.id || null,
        );
      })
      .catch((error) => {
        if (active) {
          console.error('Error al cargar fincas y lotes:', error);
          setAviso(error.message || 'No se pudieron cargar las fincas y los lotes.');
          setAvisoEsError(true);
        }
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

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
      (f) => String(f.id) === String(fincaActivaId)
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
    fincas.find((f) => String(f.id) === String(fincaActivaId)) ||
    fincas[0] ||
    null;

  const lotesDeFincaActiva = lotes.filter(
    (l) =>
      String(l.fincaId) === String(fincaActivaId) &&
      (verInactivos ? l.estado === 'inactivo' : l.estado !== 'inactivo')
  );

  const jornadaPerteneceAlLote = (jornada, lote) => {
    if (!jornada || !lote) return false;

    const mismoLote =
      String(jornada.lote || '').trim().toLowerCase() ===
      String(lote.nombre || '').trim().toLowerCase();

    if (!mismoLote) return false;

    if (jornada.fincaId !== undefined && jornada.fincaId !== null) {
      return String(jornada.fincaId) === String(lote.fincaId);
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
    const trabajador = trabajadores.find(
      (trab) => String(trab.id) === String(id),
    );
    return trabajador ? trabajador.nombre : 'Trabajador';
  };

  const guardarFinca = async (e) => {
    e.preventDefault();
    setAviso('');
    setGuardando(true);
    try {
      const nuevaFinca = await api.farms.create({
        name: nombreFinca.trim(),
        location: ubicacionFinca.trim(),
        description: descripcionFinca.trim(),
      });
      const fincasActualizadas = [...fincas, nuevaFinca];
      setFincas(fincasActualizadas);
      setFincaActivaId(nuevaFinca.id);
      guardarCacheFincasYLotes(userId, fincasActualizadas, lotes);
      setNombreFinca('');
      setUbicacionFinca('');
      setDescripcionFinca('');
      setMostrarFormFinca(false);
      setMostrarFormLote(false);
      setLoteDetalle(null);
      setAviso('Finca guardada correctamente.');
      setAvisoEsError(false);
    } catch (error) {
      console.error('Error al guardar la finca:', error);
      setAviso(error.message || 'No se pudo guardar la finca.');
      setAvisoEsError(true);
    } finally {
      setGuardando(false);
    }
  };

  const guardarLote = async (e) => {
    e.preventDefault();
    const nombre = nombreLote.trim();
    const hectareas = hectareasLote ? Number(hectareasLote) : null;

    if (!nombre) {
      setAviso('Ingresa el nombre del lote.');
      setAvisoEsError(true);
      return;
    }

    if (hectareas !== null && (!Number.isFinite(hectareas) || hectareas <= 0)) {
      setAviso('Si ingresas hectáreas, deben ser un número mayor que cero.');
      setAvisoEsError(true);
      return;
    }

    if (!loteEnEdicion && !fincaActual) {
      setAviso('Primero debes seleccionar una finca.');
      setAvisoEsError(true);
      return;
    }

    setAviso('');
    setGuardando(true);
    const data = {
      name: nombre,
      coffee_variety: variedadLote,
      area_hectares: hectareas,
      description: descripcionLote.trim(),
      ...(loteEnEdicion ? {} : { id_farm: fincaActual.id }),
    };
    try {
      const loteGuardado = loteEnEdicion
        ? await api.lots.update(loteEnEdicion.id, data)
        : await api.lots.create(data);
      const lotesActualizados = loteEnEdicion
        ? lotes.map((lote) =>
            String(lote.id) === String(loteGuardado.id) ? loteGuardado : lote,
          )
        : [...lotes, loteGuardado];
      setLotes(lotesActualizados);
      guardarCacheFincasYLotes(userId, fincas, lotesActualizados);
      setLoteEnEdicion(null);
      setLoteDetalle(null);
      setAviso(
        loteEnEdicion
          ? 'Lote actualizado correctamente.'
          : 'Lote guardado correctamente.',
      );
      setAvisoEsError(false);
      setNombreLote('');
      setVariedadLote('Castillo');
      setHectareasLote('');
      setDescripcionLote('');
      setMostrarFormLote(false);
    } catch (error) {
      console.error('Error al guardar el lote:', error);
      setAviso(error.message || 'No se pudo guardar el lote.');
      setAvisoEsError(true);
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicionLote = (lote) => {
    if (lote.estado === 'inactivo') {
      setAviso('Debes reactivar el lote para poder editarlo.');
      setAvisoEsError(true);
      return;
    }

    setLoteEnEdicion(lote);
    setNombreLote(lote.nombre);
    setVariedadLote(lote.variedad || 'Castillo');
    setHectareasLote(lote.hectareas ? String(lote.hectareas) : '');
    setDescripcionLote(lote.description || '');
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
    setDescripcionLote('');
  };

  const cambiarEstadoLote = async (loteId, nuevoEstado) => {
    try {
      const loteActualizado = await api.lots.update(loteId, {
        is_active: nuevoEstado !== 'inactivo',
      });
      const lotesActualizados = lotes.map((lote) =>
        String(lote.id) === String(loteActualizado.id)
          ? loteActualizado
          : lote,
      );
      setLotes(lotesActualizados);
      guardarCacheFincasYLotes(userId, fincas, lotesActualizados);
      setLoteDetalle(null);
      setAviso('');
      setAvisoEsError(false);
    } catch (error) {
      console.error('Error al cambiar el estado del lote:', error);
      setAviso(error.message || 'No se pudo actualizar el estado del lote.');
      setAvisoEsError(true);
    }
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
          guardarFincaActiva(userId, id);
          setLoteDetalle(null);
          cancelarFormularioLote();
          setVerInactivos(false);
        }}
      />

      {cargando && (
        <p aria-live="polite" role="status">
          Cargando fincas y lotes…
        </p>
      )}
      {aviso && (
        <p
          aria-live="polite"
          role="status"
          style={{
            background: avisoEsError ? '#fef2f2' : '#f0fdf4',
            borderRadius: '10px',
            color: avisoEsError ? '#991b1b' : '#166534',
            padding: '12px',
          }}
        >
          {aviso}
        </p>
      )}

      {/* FORMULARIO CREAR FINCA */}
      {mostrarFormFinca && (
        <FincaForm
          nombreFinca={nombreFinca}
          setNombreFinca={setNombreFinca}
          ubicacionFinca={ubicacionFinca}
          setUbicacionFinca={setUbicacionFinca}
          descripcionFinca={descripcionFinca}
          setDescripcionFinca={setDescripcionFinca}
          guardando={guardando}
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
          descripcionLote={descripcionLote}
          setDescripcionLote={setDescripcionLote}
          guardando={guardando}
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
