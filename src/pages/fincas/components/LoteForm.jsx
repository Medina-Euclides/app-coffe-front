export default function LoteForm({
  loteEnEdicion,
  fincaActual,
  nombreLote,
  setNombreLote,
  variedadLote,
  setVariedadLote,
  hectareasLote,
  setHectareasLote,
  descripcionLote,
  setDescripcionLote,
  guardando,
  onGuardar,
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
      <h4 style={{ color: '#047857', marginBottom: '18px' }}>
        {loteEnEdicion
          ? `Editar Lote: ${loteEnEdicion.nombre}`
          : `Agregar Lote a ${fincaActual?.nombre || ''}`}
      </h4>

      <label style={{ display: 'block', marginBottom: '12px' }}>
        Nombre del Lote:
        <input
          type="text"
          placeholder="Ej: Lote El Mirador"
          value={nombreLote}
          onChange={(e) => setNombreLote(e.target.value)}
          maxLength={150}
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

      <label style={{ display: 'block', marginBottom: '12px' }}>
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
          }}
        >
          <option value="Castillo">Castillo</option>
          <option value="Caturra">Caturra</option>
          <option value="Colombia">Colombia</option>
          <option value="Borbón">Borbón</option>
          <option value="Geisha">Geisha</option>
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: '16px' }}>
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
          }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: '16px' }}>
        Descripción (Opcional):
        <textarea
          placeholder="Detalles adicionales del lote"
          value={descripcionLote}
          onChange={(e) => setDescripcionLote(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            marginTop: '6px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
          }}
        />
      </label>

      <button
        disabled={guardando}
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
        {guardando
          ? 'Guardando…'
          : loteEnEdicion
            ? 'Actualizar Lote'
            : 'Guardar Lote'}
      </button>
    </form>
  );
}
