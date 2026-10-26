export default function FincaForm({
  nombreFinca,
  setNombreFinca,
  onGuardar,
  onCancelar,
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

      <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600, color: '#334155' }}>
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
            minHeight: '44px',
            boxSizing: 'border-box',
          }}
        />
      </label>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="submit"
          style={{
            flex: 1,
            background: '#047857',
            color: '#fff',
            border: 'none',
            padding: '12px 18px',
            borderRadius: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            minHeight: '46px',
          }}
        >
          Guardar Finca
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '12px 18px',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              minHeight: '46px',
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
