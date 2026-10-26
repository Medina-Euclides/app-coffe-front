export default function LoteForm({
  loteEnEdicion,
  fincaActual,
  nombreLote,
  setNombreLote,
  variedadLote,
  setVariedadLote,
  hectareasLote,
  setHectareasLote,
  onGuardar,
  onCancelar,
}) {
  return (
    <form
      id="nuevo-lote"
      onSubmit={onGuardar}
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid #047857',
        padding: '22px',
        borderRadius: '18px',
      }}
    >
      <h4 style={{ color: '#047857', marginBottom: '18px', fontSize: '1.15rem' }}>
        {loteEnEdicion
          ? `Editar Lote: ${loteEnEdicion.nombre}`
          : `Agregar Lote a ${fincaActual?.nombre || ''}`}
      </h4>

      <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#334155' }}>
        Nombre del Lote:
        <input
          type="text"
          placeholder="Ej: Lote El Mirador"
          value={nombreLote}
          onChange={(e) => setNombreLote(e.target.value)}
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

      <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#334155' }}>
        Variedad de Café:
        <select
          value={variedadLote}
          onChange={(e) => setVariedadLote(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px',
            marginTop: '6px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            minHeight: '44px',
            backgroundColor: '#fff',
            boxSizing: 'border-box',
          }}
        >
          <option value="Castillo">Castillo</option>
          <option value="Caturra">Caturra</option>
          <option value="Colombia">Colombia</option>
          <option value="Borbón">Borbón</option>
          <option value="Geisha">Geisha</option>
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: '16px', fontWeight: 600, color: '#334155' }}>
        Área en Hectáreas (Opcional):
        <input
          type="number"
          min="0.1"
          step="0.1"
          placeholder="Ej: 2.5 (Opcional)"
          value={hectareasLote}
          onChange={(e) => setHectareasLote(e.target.value)}
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
          {loteEnEdicion ? 'Actualizar Lote' : 'Guardar Lote'}
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
