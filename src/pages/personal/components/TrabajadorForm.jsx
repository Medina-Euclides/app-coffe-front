export default function TrabajadorForm({
  nombreTrabajador,
  setNombreTrabajador,
  cedulaTrabajador,
  setCedulaTrabajador,
  trabajadores,
  onGuardarTrabajador,
  campo,
  etiqueta,
  boton,
}) {
  return (
    <section id="nuevo-trabajador">
      <form
        onSubmit={onGuardarTrabajador}
        style={{
          background: '#fff',
          padding: 20,
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <h3>Crear nuevo trabajador</h3>

        <label style={etiqueta}>
          Nombre completo (Solo letras)
          <input
            type="text"
            value={nombreTrabajador}
            onChange={(e) =>
              setNombreTrabajador(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))
            }
            required
            minLength={2}
            maxLength={100}
            style={campo}
            placeholder="Ej. Carlos Ramírez"
          />
        </label>

        <label style={etiqueta}>
          Número de Cédula (Exactamente 10 números)
          <input
            type="text"
            inputMode="numeric"
            value={cedulaTrabajador}
            onChange={(e) =>
              setCedulaTrabajador(e.target.value.replace(/\D/g, '').slice(0, 10))
            }
            required
            minLength={10}
            maxLength={10}
            style={campo}
            placeholder="Ej. 1061234567"
          />
        </label>

        <button type="submit" style={boton}>
          Guardar trabajador
        </button>
      </form>

      <article
        style={{
          background: '#fff',
          padding: 20,
          border: '1px solid #e2e8f0',
          borderRadius: 12,
        }}
      >
        <h3>Lista de Trabajadores Registrados</h3>
        {trabajadores.length === 0 ? (
          <p style={{ color: '#64748b' }}>No hay trabajadores registrados en la base de datos.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>
                    Cédula
                  </th>
                  <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>
                    Nombre
                  </th>
                </tr>
              </thead>
              <tbody>
                {trabajadores.map((t) => (
                  <tr key={t.id}>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: '1px solid #f1f5f9',
                        color: '#047857',
                        fontWeight: 600,
                      }}
                    >
                      {t.cedula || 'Sin cédula'}
                    </td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>
                      {t.nombre}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
