export default function FincaPersonalFilter({
  fincas,
  fincaId,
  fincaSeleccionada,
  onCambiarFinca,
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
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          fontWeight: 600,
          color: '#334155',
        }}
      >
        Finca seleccionada
        <select
          value={fincaId ?? ''}
          onChange={(e) => onCambiarFinca(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            minHeight: 44,
            padding: 10,
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            marginTop: 6,
            background: '#fff',
          }}
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
        <p style={{ color: '#b45309', marginBottom: 0, fontSize: '0.9rem' }}>
          Crea una finca en el módulo Fincas para registrar labores y liquidaciones.
        </p>
      )}
    </section>
  );
}
