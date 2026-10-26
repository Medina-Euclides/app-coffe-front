import { dinero, hoy } from '../../../utils/formatters';

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
}) {
  const campoEstilo = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 44,
    padding: 10,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    marginTop: 6,
    background: '#fff',
  };

  const etiquetaEstilo = {
    display: 'block',
    marginBottom: 16,
    fontWeight: 600,
    color: '#334155',
  };

  const botonEstilo = {
    minHeight: 44,
    border: 0,
    borderRadius: 8,
    padding: '10px 16px',
    background: '#047857',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  };

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
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Asignar labor a un trabajador</h3>

      {!fincaSeleccionada && (
        <p style={{ color: '#b45309', marginBottom: 16 }}>
          Selecciona primero una finca en el selector de arriba.
        </p>
      )}

      <label style={etiquetaEstilo}>
        Trabajador
        <select
          value={trabajadorId}
          onChange={(e) => setTrabajadorId(e.target.value)}
          required
          style={campoEstilo}
        >
          <option value="">Selecciona un trabajador...</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} {t.cedula ? `(C.C. ${t.cedula})` : ''}
            </option>
          ))}
        </select>
      </label>

      <label style={etiquetaEstilo}>
        Actividad
        <select
          value={actividadSeleccionada}
          onChange={(e) => {
            const act = e.target.value;
            setActividadSeleccionada(act);
            setModalidad(act === 'Recolección de café' ? 'recoleccion' : 'jornal');
          }}
          required
          style={campoEstilo}
        >
          {actividades.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label style={etiquetaEstilo}>
        Lote
        <select
          value={loteId}
          onChange={(e) => setLoteId(e.target.value)}
          required
          style={campoEstilo}
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

      <label style={etiquetaEstilo}>
        Modalidad de pago
        <select
          value={modalidad}
          onChange={(e) => setModalidad(e.target.value)}
          style={campoEstilo}
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
          fontSize: '0.9rem',
        }}
      >
        {modalidad === 'recoleccion'
          ? 'Los kilos recolectados se ingresarán cuando vayas a liquidar el pago.'
          : 'El tiempo trabajado (medio día, día completo, etc.) se seleccionará cuando vayas a liquidar el pago.'}
      </div>

      <label style={etiquetaEstilo}>
        Fecha de la labor
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          max={hoy()}
          required
          style={campoEstilo}
        />
      </label>

      <button
        type="submit"
        style={botonEstilo}
        disabled={!fincaSeleccionada}
      >
        Asignar labor
      </button>
    </form>
  );
}
