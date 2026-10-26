export default function FincaForm({
  nombreFinca,
  setNombreFinca,
  onGuardar,
}) {
  return (
    <form
      id="nueva-finca"
      onSubmit={onGuardar}
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

      <label style={{ display: 'block', marginBottom: '16px' }}>
        Nombre de la Finca:
        <input
          type="text"
          placeholder="Ej: Finca San José"
          value={nombreFinca}
          onChange={(e) => setNombreFinca(e.target.value)}
          required
          style={{
            display: 'block',
            width: '100%',
            padding: '10px',
            marginTop: '6px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
          }}
        />
      </label>

      <button
        type="submit"
        style={{
          background: '#047857',
          color: '#fff',
          border: 'none',
          padding: '12px 18px',
          borderRadius: '10px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Guardar Finca
      </button>
    </form>
  );
}
