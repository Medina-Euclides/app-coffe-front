import { dinero, hoy } from '#lib/formatters';

export default function LaborForm({
  fincaSeleccionada,
  trabajadores,
  trabajadorId,
  setTrabajadorId,
  actividades,
  actividadSeleccionada,
  setActividadSeleccionada,
  lotesDeFinca,
  loteId,
  setLoteId,
  modalidad,
  setModalidad,
  tarifaKg,
  tarifaJornal,
  fecha,
  setFecha,
  onGuardarJornada,
  campo,
  etiqueta,
  boton,
}) {
  return (
    <form
      id="registrar-labor"
      onSubmit={onGuardarJornada}
      style={{
        background: '#fff',
        padding: 20,
        border: '1px solid #e2e8f0',
        borderRadius: 12,
      }}
    >
      <h3>Asignar labor a un trabajador</h3>

      {!fincaSeleccionada && (
        <p style={{ color: '#b45309' }}>
          Selecciona primero una finca en el selector de arriba.
        </p>
      )}

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
            <option key={t.id} value={t.id}>
              {t.nombre} {t.cedula ? `(C.C. ${t.cedula})` : ''}
            </option>
          ))}
        </select>
      </label>

      <label style={etiqueta}>
        Actividad
        <select
          value={actividadSeleccionada}
          onChange={(e) => {
            const act = e.target.value;
            setActividadSeleccionada(act);
            setModalidad(act === 'Recolección de café' ? 'recoleccion' : 'jornal');
          }}
          required
          style={campo}
        >
          {actividades.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
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
          <option value="">
            {!fincaSeleccionada
              ? 'Selecciona primero una finca arriba...'
              : lotesDeFinca.length === 0
              ? 'Esta finca no tiene lotes registrados'
              : 'Selecciona un lote...'}
          </option>
          {lotesDeFinca.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
              {l.variedad ? ` (${l.variedad})` : ''}
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
          <option value="recoleccion">Por kilogramo — {dinero(Number(tarifaKg))}</option>
          <option value="jornal">Por jornal/día — {dinero(Number(tarifaJornal))}</option>
        </select>
      </label>

      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          color: '#166534',
        }}
      >
        {modalidad === 'recoleccion'
          ? 'Los kilos recolectados se ingresarán cuando vayas a liquidar el pago.'
          : 'El tiempo trabajado (medio día, día completo, etc.) se seleccionará cuando vayas a liquidar el pago.'}
      </div>

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

      <button type="submit" style={boton} disabled={!fincaSeleccionada}>
        Asignar labor
      </button>
    </form>
  );
}
