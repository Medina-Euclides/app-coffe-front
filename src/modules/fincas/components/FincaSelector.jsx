export default function FincaSelector({
  fincas,
  fincaActivaId,
  onCambiarFinca,
}) {
  return (
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
          value={fincaActivaId ?? ''}
          onChange={(e) => onCambiarFinca(Number(e.target.value))}
          style={{
            fontWeight: 'bold',
            color: '#064e3b',
            backgroundColor: 'white',
            margin: 0,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
          }}
        >
          {fincas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
