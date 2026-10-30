import { useEffect, useMemo, useState, useCallback } from 'react';
import { hoy, dinero } from '#lib/formatters';
import { leerLocal, guardarLocal } from '#lib/storage';
import { ACTIVIDADES_INICIALES } from '#lib/constants';
import FincaPersonalFilter from './components/FincaPersonalFilter.jsx';
import LiquidacionesList from './components/LiquidacionesList.jsx';
import HistorialPagos from './components/HistorialPagos.jsx';
import LaborForm from './components/LaborForm.jsx';
import TrabajadorForm from './components/TrabajadorForm.jsx';
import TarifasCatalogo from './components/TarifasCatalogo.jsx';

export default function Personal({ usuario, subSeccion }) {
  const userId = usuario?.id || 'default';

  const [trabajadores, setTrabajadores] = useState(() =>
    leerLocal(`cafesmart_trabajadores_${userId}`, [])
  );
  const [fincas, setFincas] = useState(() =>
    leerLocal(`cafesmart_fincas_${userId}`, [])
  );
  const [lotes, setLotes] = useState(() =>
    leerLocal(`cafesmart_lotes_${userId}`, [])
  );
  const [actividades, setActividades] = useState(() =>
    leerLocal(`cafesmart_actividades_${userId}`, ACTIVIDADES_INICIALES)
  );
  const [jornadas, setJornadas] = useState(() =>
    leerLocal(`cafesmart_jornadas_${userId}`, [])
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
  const [cedulaTrabajador, setCedulaTrabajador] = useState('');
  const [nuevaActividadNombre, setNuevaActividadNombre] = useState('');
  const [trabajadorId, setTrabajadorId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState('Recolección de café');
  const [modalidad, setModalidad] = useState('recoleccion');
  const [fecha, setFecha] = useState(hoy());

  const [cantidadesLiquidacion, setCantidadesLiquidacion] = useState({});
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [periodoHistorial, setPeriodoHistorial] = useState('todos');

  // Sincronización con subSección del menú lateral
  useEffect(() => {
    if (subSeccion) {
      if (subSeccion === 'liquidaciones') setVista('lista');
      else if (subSeccion === 'registrar-labor') setVista('nueva_jornada');
      else if (subSeccion === 'nuevo-trabajador') setVista('nuevo_trabajador');
      else if (subSeccion === 'tarifas-actividades') setVista('tarifas');
      else setVista('lista');
    } else {
      setVista('lista');
    }
  }, [subSeccion]);

  // Recargar datos al enfocar
  useEffect(() => {
    const actualizar = () => {
      setFincas(leerLocal(`cafesmart_fincas_${userId}`, []));
      setLotes(leerLocal(`cafesmart_lotes_${userId}`, []));
    };

    actualizar();
    window.addEventListener('focus', actualizar);
    return () => window.removeEventListener('focus', actualizar);
  }, [userId, vista]);

  // Guardar en localStorage
  useEffect(() => {
    guardarLocal(`cafesmart_trabajadores_${userId}`, trabajadores);
  }, [trabajadores, userId]);

  useEffect(() => {
    guardarLocal(`cafesmart_actividades_${userId}`, actividades);
  }, [actividades, userId]);

  useEffect(() => {
    guardarLocal(`cafesmart_jornadas_${userId}`, jornadas);
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

  const perteneceAFinca = useCallback(
    (jornada, idFinca) => {
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

      return (
        coincidencias.length === 1 &&
        Number(coincidencias[0].fincaId) === Number(idFinca)
      );
    },
    [lotes, lotesPorId]
  );

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

  const eliminarActividad = (actividadAEliminar) => {
    if (actividades.length <= 1) {
      alert('Debes mantener al menos una actividad registrada en el catálogo.');
      return;
    }

    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar la actividad "${actividadAEliminar}"?`
    );
    if (!confirmado) return;

    setActividades((anteriores) => {
      const filtradas = anteriores.filter((a) => a !== actividadAEliminar);
      if (actividadSeleccionada === actividadAEliminar) {
        setActividadSeleccionada(filtradas[0]);
      }
      return filtradas;
    });

    alert(`La actividad "${actividadAEliminar}" fue eliminada.`);
  };

  const guardarTrabajador = (e) => {
    e.preventDefault();
    const nombre = nombreTrabajador.trim();
    const cedula = cedulaTrabajador.trim();

    if (nombre.length < 2) {
      alert('Escribe el nombre completo del trabajador.');
      return;
    }

    if (cedula.length !== 10) {
      alert('La cédula debe contener exactamente 10 dígitos.');
      return;
    }

    if (trabajadores.some((t) => String(t.cedula).trim() === cedula)) {
      alert('Ya existe un trabajador registrado con este número de cédula.');
      return;
    }

    setTrabajadores((anteriores) => [
      ...anteriores,
      { id: Date.now(), nombre, cedula },
    ]);

    setNombreTrabajador('');
    setCedulaTrabajador('');
    setVista('lista');
    alert('Trabajador registrado correctamente.');
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

    const tarifa =
      modalidad === 'recoleccion' ? Number(tarifaKg) : Number(tarifaJornal);

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
    alert(
      'Labor asignada correctamente. Podrás ingresar la cantidad al liquidar.'
    );
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
      const tarifa = Number(
        j.tarifaAplicada ||
          (j.modalidad === 'recoleccion' ? tarifaKg : tarifaJornal)
      );

      return {
        ...j,
        cantidad,
        subtotal: cantidad * tarifa,
        tarifaAplicada: tarifa,
      };
    });

    const cantidadInvalida = pendientesConCantidad.some(
      (j) => !Number.isFinite(j.cantidad) || j.cantidad <= 0
    );

    if (cantidadInvalida) {
      alert('Completa las cantidades de todas las labores para poder liquidar.');
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
    const movimientos = leerLocal(claveMovimientos, []);

    const nuevoEgreso = {
      id: Date.now(),
      tipo: 'gasto',
      categoria: 'Mano de Obra',
      descripcion: `Pago laboral: ${trabajador.nombre} (${fincaSeleccionada.nombre})`,
      valor: monto,
      fecha: fechaPago,
      fincaId: fincaSeleccionada.id,
      liquidacionJornadaIds: [...idsPagados],
    };

    guardarLocal(claveMovimientos, [nuevoEgreso, ...movimientos]);

    // Entrada automática al inventario al liquidar recolección
    try {
      const claveInventario = `cafesmart_inventario_${userId}`;
      const inventarioActual = leerLocal(claveInventario, []);
      const entradasInventario = [];

      pendientesConCantidad.forEach((j) => {
        if (j.modalidad === 'recoleccion' && Number(j.cantidad) > 0) {
          entradasInventario.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            fincaId: fincaSeleccionada.id,
            loteId: j.loteId || null,
            tipo: 'entrada',
            presentacion: 'pergamino',
            cantidad: Number(j.cantidad),
            fecha: fechaPago,
            descripcion: `Entrada por recolección liquidada - ${trabajador.nombre} (${j.actividad})`,
            registradoPor: userId,
            jornadaId: j.id,
          });
        }
      });

      if (entradasInventario.length > 0) {
        guardarLocal(claveInventario, [...entradasInventario, ...inventarioActual]);
      }
    } catch (error) {
      console.error('Error al actualizar inventario por liquidación:', error);
    }

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
  }, [trabajadores, jornadas, fincaSeleccionada, perteneceAFinca]);

  const historialPagado = useMemo(
    () =>
      fincaSeleccionada
        ? jornadas.filter(
            (j) =>
              j.estado === 'pagado' && perteneceAFinca(j, fincaSeleccionada.id)
          )
        : [],
    [jornadas, fincaSeleccionada, perteneceAFinca]
  );

  const historialAgrupado = useMemo(() => {
    const grupos = {};

    historialPagado.forEach((j) => {
      const t = trabajadores.find(
        (trab) => Number(trab.id) === Number(j.trabajadorId)
      );
      const nombreTrabajadorTexto = String(t?.nombre || 'Trabajador anterior');
      const cedulaTrabajadorTexto = String(t?.cedula || '');

      if (periodoHistorial !== 'todos' && j.fecha) {
        const partes = String(j.fecha).split('-').map(Number);
        if (partes.length === 3 && !partes.some(Number.isNaN)) {
          const [anio, mes] = partes;
          const ahora = new Date();

          if (periodoHistorial === 'este_mes') {
            if (anio !== ahora.getFullYear() || mes !== ahora.getMonth() + 1)
              return;
          } else if (periodoHistorial === 'mes_anterior') {
            const anterior = new Date(
              ahora.getFullYear(),
              ahora.getMonth() - 1,
              1
            );
            if (
              anio !== anterior.getFullYear() ||
              mes !== anterior.getMonth() + 1
            )
              return;
          } else if (periodoHistorial === 'este_ano') {
            if (anio !== ahora.getFullYear()) return;
          }
        }
      }

      const termino = String(busquedaHistorial || '').trim().toLowerCase();
      if (termino) {
        const coincideNombre = nombreTrabajadorTexto
          .toLowerCase()
          .includes(termino);
        const coincideCedula = cedulaTrabajadorTexto
          .toLowerCase()
          .includes(termino);
        if (!coincideNombre && !coincideCedula) return;
      }

      const clave = `${j.fecha}_${j.trabajadorId}`;

      if (!grupos[clave]) {
        grupos[clave] = {
          idUnico: clave,
          fecha: j.fecha,
          fechaPago: j.fechaPago,
          trabajador: nombreTrabajadorTexto,
          cedula: cedulaTrabajadorTexto,
          totalPagado: 0,
          labores: [],
        };
      }

      grupos[clave].totalPagado += Number(j.subtotal || 0);
      grupos[clave].labores.push(j);
    });

    return Object.values(grupos).sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
  }, [historialPagado, trabajadores, busquedaHistorial, periodoHistorial]);

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
      <h2 style={{ color: '#064e3b', marginBottom: 20 }}>
        Personal y Gestión Laboral
      </h2>

      <FincaPersonalFilter
        fincas={fincas}
        fincaId={fincaId}
        fincaSeleccionada={fincaSeleccionada}
        onCambiarFinca={cambiarFinca}
        campo={campo}
        etiqueta={etiqueta}
      />

      {vista === 'lista' && (
        <>
          <LiquidacionesList
            fincaSeleccionada={fincaSeleccionada}
            trabajadores={trabajadores}
            trabajadoresConPendientes={trabajadoresConPendientes}
            jornadasPendientes={jornadasPendientes}
            calcularPendiente={calcularPendiente}
            cantidadesLiquidacion={cantidadesLiquidacion}
            setCantidadesLiquidacion={setCantidadesLiquidacion}
            tarifaKg={tarifaKg}
            tarifaJornal={tarifaJornal}
            lotesPorId={lotesPorId}
            onRealizarPago={realizarPago}
            campo={campo}
            boton={boton}
          />

          <HistorialPagos
            fincaSeleccionada={fincaSeleccionada}
            busquedaHistorial={busquedaHistorial}
            setBusquedaHistorial={setBusquedaHistorial}
            periodoHistorial={periodoHistorial}
            setPeriodoHistorial={setPeriodoHistorial}
            historialAgrupado={historialAgrupado}
            campo={campo}
          />
        </>
      )}

      {vista === 'nueva_jornada' && (
        <LaborForm
          fincaSeleccionada={fincaSeleccionada}
          trabajadores={trabajadores}
          trabajadorId={trabajadorId}
          setTrabajadorId={setTrabajadorId}
          actividades={actividades}
          actividadSeleccionada={actividadSeleccionada}
          setActividadSeleccionada={setActividadSeleccionada}
          lotesDeFinca={lotesDeFinca}
          loteId={loteId}
          setLoteId={setLoteId}
          modalidad={modalidad}
          setModalidad={setModalidad}
          tarifaKg={tarifaKg}
          tarifaJornal={tarifaJornal}
          fecha={fecha}
          setFecha={setFecha}
          onGuardarJornada={guardarJornada}
          campo={campo}
          etiqueta={etiqueta}
          boton={boton}
        />
      )}

      {vista === 'nuevo_trabajador' && (
        <TrabajadorForm
          nombreTrabajador={nombreTrabajador}
          setNombreTrabajador={setNombreTrabajador}
          cedulaTrabajador={cedulaTrabajador}
          setCedulaTrabajador={setCedulaTrabajador}
          trabajadores={trabajadores}
          onGuardarTrabajador={guardarTrabajador}
          campo={campo}
          etiqueta={etiqueta}
          boton={boton}
        />
      )}

      {vista === 'tarifas' && (
        <TarifasCatalogo
          tarifaKg={tarifaKg}
          setTarifaKg={setTarifaKg}
          tarifaJornal={tarifaJornal}
          setTarifaJornal={setTarifaJornal}
          actividades={actividades}
          nuevaActividadNombre={nuevaActividadNombre}
          setNuevaActividadNombre={setNuevaActividadNombre}
          onAgregarActividad={agregarActividad}
          onEliminarActividad={eliminarActividad}
          campo={campo}
          etiqueta={etiqueta}
          boton={boton}
        />
      )}
    </div>
  );
}
