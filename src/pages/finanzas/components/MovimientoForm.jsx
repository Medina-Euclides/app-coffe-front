import { obtenerFechaLocal, formatearMiles, desformatearNumero } from '#lib/formatters';

export default function MovimientoForm({
  fincas,
  fincaFormulario,
  setFincaFormulario,
  tipo,
  cambiarTipo,
  categoria,
  setCategoria,
  valorTexto,
  setValorTexto,
  fecha,
  setFecha,
  descripcion,
  setDescripcion,
  comprador,
  setComprador,
  cantidadKg,
  setCantidadKg,
  esVentaCafe,
  onGuardarMovimiento,
}) {
  const estiloEtiqueta = {
    display: 'block',
    marginBottom: 16,
    color: '#334155',
    fontWeight: 600,
  };

  const estiloCampo = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 46,
    padding: 10,
    marginTop: 6,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#fff',
  };

  return (
    <form
      id="nuevo-movimiento"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardarMovimiento(e);
      }}
      noValidate
      style={{
        background: '#fff',
        border: `2px solid ${tipo === 'ingreso' ? '#a7f3d0' : '#fecaca'}`,
        padding: 18,
        borderRadius: 14,
        maxWidth: '600px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ color: tipo === 'ingreso' ? '#064e3b' : '#991b1b', marginTop: 0 }}>
        Registrar {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} Financiero
      </h3>

      <label style={estiloEtiqueta}>
        Finca
        <select
          value={fincaFormulario}
          onChange={(e) => setFincaFormulario(e.target.value)}
          required
          style={estiloCampo}
        >
          <option value="">Selecciona una finca...</option>
          {fincas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </label>

      {fincas.length === 0 && (
        <p style={{ color: '#b45309', marginBottom: 16 }}>
          Primero debes registrar una finca en el módulo Fincas.
        </p>
      )}

      <label style={estiloEtiqueta}>
        Tipo de movimiento
        <select
          value={tipo}
          onChange={(e) => cambiarTipo(e.target.value)}
          style={estiloCampo}
        >
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Egreso / Gasto</option>
        </select>
      </label>

      <label style={estiloEtiqueta}>
        Categoría
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          style={estiloCampo}
        >
          {tipo === 'ingreso' ? (
            <>
              <option value="Venta de café">Venta de café</option>
              <option value="Subproductos">Subproductos</option>
              <option value="Otros ingresos">Otros ingresos</option>
            </>
          ) : (
            <>
              <option value="Insumos y Fertilizantes">Insumos y Fertilizantes</option>
              <option value="Herramientas y Equipos">Herramientas y Equipos</option>
              <option value="Transporte y Fletes">Transporte y Fletes</option>
              <option value="Alimentación">Alimentación</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Mano de Obra">Mano de Obra</option>
              <option value="Otros gastos">Otros gastos</option>
            </>
          )}
        </select>
      </label>

      {esVentaCafe && (
        <>
          <label style={estiloEtiqueta}>
            Nombre del comprador
            <input
              type="text"
              value={comprador}
              onChange={(e) => setComprador(e.target.value)}
              required
              maxLength={120}
              style={estiloCampo}
              placeholder="Ej. Cooperativa cafetera"
            />
          </label>

          <label style={estiloEtiqueta}>
            Cantidad vendida (kg)
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={cantidadKg}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                setCantidadKg(val);
              }}
              required
              style={estiloCampo}
              placeholder="Ej. 125.5"
              autoComplete="off"
            />
          </label>
        </>
      )}

      <label style={estiloEtiqueta}>
        Valor total (COP)
        <input
          type="text"
          inputMode="numeric"
          value={formatearMiles(valorTexto)}
          onChange={(e) => setValorTexto(desformatearNumero(e.target.value))}
          required
          style={estiloCampo}
          placeholder="Ej. 850.000"
        />
      </label>

      <label style={estiloEtiqueta}>
        Fecha del movimiento
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          max={obtenerFechaLocal()}
          required
          style={estiloCampo}
        />
      </label>

      <label style={estiloEtiqueta}>
        Descripción adicional (opcional)
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={200}
          style={estiloCampo}
          placeholder="Detalles adicionales del movimiento"
        />
      </label>

      <button
        type="submit"
        disabled={fincas.length === 0}
        style={{
          width: '100%',
          minHeight: 52,
          border: 0,
          borderRadius: 12,
          background: fincas.length === 0 ? '#94a3b8' : tipo === 'ingreso' ? '#047857' : '#dc2626',
          color: '#fff',
          fontWeight: 700,
          cursor: fincas.length === 0 ? 'not-allowed' : 'pointer',
          marginTop: 12,
          fontSize: '1rem',
        }}
      >
        Guardar {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
      </button>
    </form>
  );
}
