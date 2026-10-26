export default function HeaderMobile({ isOnline, onAbrirMenu }) {
  return (
    <div className="header-mobile">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/icon.png"
          alt="Logo CafeSmart"
          style={{ width: '32px', height: '32px', objectFit: 'contain' }}
        />
        <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#6ee7b7' }}>CafeSmart</h1>
        <span
          title={isOnline ? 'Conectado' : 'Sin conexión'}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? '#22c55e' : '#f59e0b',
            boxShadow: isOnline
              ? '0 0 6px rgba(34, 197, 94, 0.8)'
              : '0 0 6px rgba(245, 158, 11, 0.8)',
          }}
        />
      </div>
      <button
        className="btn-hamburguesa"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
      >
        ☰
      </button>
    </div>
  );
}
