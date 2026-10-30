export default function FincaPersonalFilter({
  fincas,
  fincaId,
  fincaSeleccionada,
  onCambiarFinca,
  campo,
  etiqueta,
}) {
  return (
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
          onChange={(e) => onCambiarFinca(e.target.value)}
          style={campo}
        >
          <option value="">Selecciona una finca...</option>
          {fincas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </label>
      {!fincaSeleccionada && (
        <p style={{ color: '#b45309', marginBottom: 0 }}>
          Crea una finca en el módulo Fincas para registrar labores y liquidaciones.
        </p>
      )}
    </section>
  );
}
