import FincaPersonalFilter from './components/FincaPersonalFilter.jsx';
import HistorialPagos from './components/HistorialPagos.jsx';
import LaborForm from './components/LaborForm.jsx';
import LiquidacionesList from './components/LiquidacionesList.jsx';
import TarifasCatalogo from './components/TarifasCatalogo.jsx';
import TrabajadorForm from './components/TrabajadorForm.jsx';
import usePersonalPage from './usePersonalPage.js';

export default function Personal({ usuario, subSeccion }) {
  const {
    actividades,
    actividadSeleccionada,
    agregarActividad,
    busquedaHistorial,
    cambiarActividadSeleccionada,
    cambiarFinca,
    calcularPendiente,
    cantidadesLiquidacion,
    eliminarActividad,
    errorActividades,
    errorTrabajadores,
    fecha,
    fincaId,
    fincaSeleccionada,
    fincas,
    firstNameTrabajador,
    historialAgrupado,
    identificacionTrabajador,
    jornadasPendientes,
    lastNameTrabajador,
    loteId,
    lotesDeFinca,
    lotesPorId,
    modalidad,
    nuevaActividadDescripcion,
    nuevaActividadEsCosecha,
    nuevaActividadNombre,
    onRealizarPago,
    periodoHistorial,
    setBusquedaHistorial,
    setCantidadesLiquidacion,
    setFecha,
    setFirstNameTrabajador,
    setIdentificacionTrabajador,
    setLastNameTrabajador,
    setLoteId,
    setModalidad,
    setNuevaActividadDescripcion,
    setNuevaActividadEsCosecha,
    setNuevaActividadNombre,
    setPeriodoHistorial,
    setTarifaJornal,
    setTarifaKg,
    setTelefonoTrabajador,
    setTrabajadorId,
    tarifaJornal,
    tarifaKg,
    telefonoTrabajador,
    trabajadorId,
    trabajadores,
    trabajadoresConPendientes,
    vista,
    guardarJornada,
    guardarTrabajador,
  } = usePersonalPage({ usuario, subSeccion });

  return (
    <div>
      <h2 style={{ color: '#064e3b', marginBottom: 20 }}>
        Personal y Gestión Laboral
      </h2>

      {errorTrabajadores && (
        <p
          aria-live="polite"
          role="status"
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 10,
            color: '#92400e',
            marginBottom: 20,
            padding: 12,
          }}
        >
          {errorTrabajadores}
        </p>
      )}
      {errorActividades && (
        <p
          aria-live="polite"
          role="status"
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 10,
            color: '#92400e',
            marginBottom: 20,
            padding: 12,
          }}
        >
          {errorActividades}
        </p>
      )}

      <FincaPersonalFilter
        fincas={fincas}
        fincaId={fincaId}
        fincaSeleccionada={fincaSeleccionada}
        onCambiarFinca={cambiarFinca}
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
            onRealizarPago={onRealizarPago}
          />

          <HistorialPagos
            fincaSeleccionada={fincaSeleccionada}
            busquedaHistorial={busquedaHistorial}
            setBusquedaHistorial={setBusquedaHistorial}
            periodoHistorial={periodoHistorial}
            setPeriodoHistorial={setPeriodoHistorial}
            historialAgrupado={historialAgrupado}
          />
        </>
      )}

      {vista === 'nueva_jornada' && (
        <LaborForm
          fincaSeleccionada={fincaSeleccionada}
          trabajadores={trabajadores.filter((worker) => worker.is_active !== false)}
          trabajadorId={trabajadorId}
          setTrabajadorId={setTrabajadorId}
          actividades={actividades}
          actividadSeleccionada={actividadSeleccionada}
          setActividadSeleccionada={cambiarActividadSeleccionada}
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
        />
      )}

      {vista === 'nuevo_trabajador' && (
        <TrabajadorForm
          firstName={firstNameTrabajador}
          setFirstName={setFirstNameTrabajador}
          lastName={lastNameTrabajador}
          setLastName={setLastNameTrabajador}
          identification={identificacionTrabajador}
          setIdentification={setIdentificacionTrabajador}
          phone={telefonoTrabajador}
          setPhone={setTelefonoTrabajador}
          trabajadores={trabajadores}
          onGuardarTrabajador={guardarTrabajador}
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
          nuevaActividadDescripcion={nuevaActividadDescripcion}
          setNuevaActividadDescripcion={setNuevaActividadDescripcion}
          nuevaActividadEsCosecha={nuevaActividadEsCosecha}
          setNuevaActividadEsCosecha={setNuevaActividadEsCosecha}
          onAgregarActividad={agregarActividad}
          onEliminarActividad={eliminarActividad}
        />
      )}
    </div>
  );
}
