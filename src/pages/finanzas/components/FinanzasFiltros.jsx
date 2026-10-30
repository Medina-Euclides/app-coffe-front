export default function FinanzasFiltros({
  fincas,
  fincaId,
  setFincaId,
  filtroPeriodo,
  setFiltroPeriodo,
  fincaSeleccionada,
  userId,
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
    <div
      style={{
        background: '#fff',
        border: '1px solid #cbd5e1',
        padding: 18,
        borderRadius: 14,
      }}
    >
      <label style={estiloEtiqueta}>
        Filtrar por finca
        <select
          value={fincaId}
          onChange={(e) => {
            const val = e.target.value;
            setFincaId(val);
            if (val) {
              localStorage.setItem(`cafesmart_finca_activa_${userId}`, val);
            } else {
              localStorage.removeItem(`cafesmart_finca_activa_${userId}`);
            }
          }}
          style={estiloCampo}
        >
          <option value="">Todas las fincas</option>
          {fincas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </label>

      <label style={estiloEtiqueta}>
        Filtrar por periodo
        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          style={estiloCampo}
        >
          <option value="todos">Histórico completo</option>
          <option value="este_mes">Este mes</option>
          <option value="mes_anterior">Mes anterior</option>
          <option value="este_ano">Año actual</option>
        </select>
      </label>

      {fincaId !== '' && !fincaSeleccionada && (
        <p style={{ color: '#b45309' }}>
          La finca seleccionada ya no está disponible. Elige otra finca.
        </p>
      )}

      <p style={{ marginBottom: 0, color: '#64748b', fontSize: 14 }}>
        Los registros antiguos sin finca asignada aparecen en “Todas las fincas”.
      </p>
    </div>
  );
}
