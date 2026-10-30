export default function TrabajadorForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  identification,
  setIdentification,
  phone,
  setPhone,
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
          Nombre
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            minLength={2}
            maxLength={150}
            style={campo}
            placeholder="Ej. Carlos"
          />
        </label>

        <label style={etiqueta}>
          Apellido
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            minLength={2}
            maxLength={150}
            style={campo}
            placeholder="Ej. Ramírez"
          />
        </label>

        <label style={etiqueta}>
          Identificación (Opcional)
          <input
            type="text"
            value={identification}
            onChange={(e) => setIdentification(e.target.value)}
            maxLength={150}
            style={campo}
            placeholder="Ej. 1061234567"
          />
        </label>

        <label style={etiqueta}>
          Teléfono (Opcional)
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={150}
            style={campo}
            placeholder="Ej. 3001234567"
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
