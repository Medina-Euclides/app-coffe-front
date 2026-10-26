export default function IndicadoresCards({ tarjetas }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 12,
      }}
    >
      {tarjetas.map((t) => (
        <article
          key={t.titulo}
          style={{
            background: t.fondo,
            border: `1px solid ${t.borde}`,
            padding: 18,
            borderRadius: 14,
            minWidth: 0,
          }}
        >
          <span style={{ color: '#475569', fontSize: 13, fontWeight: 700 }}>
            {t.titulo}
          </span>
          <h3
            style={{
              color: t.color,
              fontSize: '1.25rem',
              overflowWrap: 'anywhere',
              margin: '8px 0 0',
            }}
          >
            {t.valor}
          </h3>
        </article>
      ))}
    </div>
  );
}
