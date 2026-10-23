import { useState, useEffect } from 'react';

export default function Finanzas({ usuario }) {
  const userId = usuario?.id || 'default';

  const [movimientos, setMovimientos] = useState(() => {
    try {
      const guardados = localStorage.getItem(`cafesmart_movimientos_${userId}`);
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });

  const [jornadas, setJornadas] = useState(() => {
    try {
      const guardadas = localStorage.getItem(`cafesmart_jornadas_${userId}`);
      return guardadas ? JSON.parse(guardadas) : [];
    } catch {
      return [];
    }
  });

  const [vista, setVista] = useState('historial');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');

  // Campos de formulario
  const [tipo, setTipo] = useState('ingreso');
  const [categoria, setCategoria] = useState('Venta de café');
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_movimientos_${userId}`, JSON.stringify(movimientos));
  }, [movimientos, userId]);

  const guardarMovimiento = (e) => {
    e.preventDefault();
    if (!valor) return;

    const nuevo = {
      id: Date.now(),
      tipo,
      categoria,
      descripcion: categoria,
      valor: Number(valor),
      fecha
    };

    setMovimientos([nuevo, ...movimientos]);
    setValor('');
    setVista('historial');
  };

  const filtrarPorFecha = (itemFecha) => {
    if (filtroPeriodo === 'todos' || !itemFecha) return true;

    const fechaItem = new Date(itemFecha);
    const ahora = new Date();

    if (filtroPeriodo === 'este_mes') {
      return fechaItem.getMonth() === ahora.getMonth() && fechaItem.getFullYear() === ahora.getFullYear();
    }
    if (filtroPeriodo === 'mes_anterior') {
      const mesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      return fechaItem.getMonth() === mesPasado.getMonth() && fechaItem.getFullYear() === mesPasado.getFullYear();
    }
    if (filtroPeriodo === 'este_ano') {
      return fechaItem.getFullYear() === ahora.getFullYear();
    }
    return true;
  };

  const movimientosFiltrados = movimientos.filter(m => filtrarPorFecha(m.fecha));
  const jornadasFiltradas = jornadas.filter(j => filtrarPorFecha(j.fecha));

  const totalIngresos = movimientosFiltrados
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + Number(m.valor || 0), 0);

  const totalEgresos = movimientosFiltrados
    .filter(m => m.tipo === 'gasto')
    .reduce((sum, m) => sum + Number(m.valor || 0), 0);

  const balanceNeto = totalIngresos - totalEgresos;

  const produccionTotalKg = jornadasFiltradas
    .filter(j => j.modalidad === 'recoleccion')
    .reduce((sum, j) => sum + Number(j.cantidad || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <h2 style={{ color: '#064e3b', margin: '0 0 2px 0', fontSize: '1.4rem' }}>Gestión Financiera</h2>

      {/* PESTAÑAS TÁCTILES AMPLIAS */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setVista('historial')}
          style={{
            flex: 1,
            backgroundColor: vista === 'historial' ? '#059669' : '#ffffff',
            color: vista === 'historial' ? '#ffffff' : '#475569',
            border: vista === 'historial' ? 'none' : '1.5px solid #cbd5e1',
            borderRadius: '14px',
            padding: '14px 8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            minHeight: '52px',
            boxShadow: vista === 'historial' ? '0 4px 12px rgba(5, 150, 105, 0.2)' : 'none'
          }}
        >
          Ver Balances
        </button>

        <button 
          onClick={() => setVista('nuevo_movimiento')}
          style={{
            flex: 1,
            backgroundColor: vista === 'nuevo_movimiento' ? '#059669' : '#ffffff',
            color: vista === 'nuevo_movimiento' ? '#ffffff' : '#475569',
            border: vista === 'nuevo_movimiento' ? 'none' : '1.5px solid #cbd5e1',
            borderRadius: '14px',
            padding: '14px 8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            minHeight: '52px',
            boxShadow: vista === 'nuevo_movimiento' ? '0 4px 12px rgba(5, 150, 105, 0.2)' : 'none'
          }}
        >
          + Registrar Dato
        </button>
      </div>

      {/* VISTA 1: BALANCES E HISTORIAL */}
      {vista === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TARJETA FILTRO DE PERIODO */}
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', padding: '18px', borderRadius: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>
              Filtrar por Periodo:
            </label>
            <select 
              value={filtroPeriodo} 
              onChange={e => setFiltroPeriodo(e.target.value)}
              style={{ fontWeight: 'bold', color: '#064e3b', backgroundColor: '#ecfdf5', margin: 0 }}
            >
              <option value="todos">Ver Histórico Completo</option>
              <option value="este_mes">Este Mes</option>
              <option value="mes_anterior">Mes Anterior</option>
              <option value="este_ano">Año Actual</option>
            </select>
          </div>

          {/* TARJETAS DE INDICADORES (UNA POR FILA PARA MAYOR LECTURABILIDAD) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '20px', borderRadius: '18px' }}>
              <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos Totales</span>
              <h3 style={{ color: '#15803d', margin: '6px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold' }}>$ {totalIngresos.toLocaleString()} COP</h3>
            </div>

            <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', padding: '20px', borderRadius: '18px' }}>
              <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Egresos Totales</span>
              <h3 style={{ color: '#dc2626', margin: '6px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold' }}>$ {totalEgresos.toLocaleString()} COP</h3>
            </div>

            <div style={{ backgroundColor: balanceNeto >= 0 ? '#ecfdf5' : '#fff1f2', border: balanceNeto >= 0 ? '1.5px solid #a7f3d0' : '1.5px solid #fecaca', padding: '20px', borderRadius: '18px' }}>
              <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance Neto</span>
              <h3 style={{ color: balanceNeto >= 0 ? '#047857' : '#e11d48', margin: '6px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold' }}>$ {balanceNeto.toLocaleString()} COP</h3>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', padding: '20px', borderRadius: '18px' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Café Cosechado</span>
              <h3 style={{ color: '#0f172a', margin: '6px 0 0 0', fontSize: '1.6rem', fontWeight: 'bold' }}>{produccionTotalKg} Kg</h3>
            </div>

          </div>

          {/* HISTORIAL DE MOVIMIENTOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <h3 style={{ color: '#0f172a', margin: 0, fontSize: '1.2rem' }}>Historial de Transacciones</h3>

            {movimientosFiltrados.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '30px 20px' }}>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>No hay movimientos registrados en el periodo seleccionado.</p>
              </div>
            ) : (
              movimientosFiltrados.map(m => (
                <div key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: m.tipo === 'ingreso' ? '#15803d' : '#dc2626', fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>
                      {m.descripcion || m.categoria}
                    </strong>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{m.fecha}</span>
                  </div>

                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: m.tipo === 'ingreso' ? '#15803d' : '#dc2626' }}>
                    {m.tipo === 'ingreso' ? '+' : '-'} $ {Number(m.valor).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* VISTA 2: FORMULARIO NUEVO MOVIMIENTO */}
      {vista === 'nuevo_movimiento' && (
        <form onSubmit={guardarMovimiento} style={{ backgroundColor: '#ffffff', border: '2px solid #059669', padding: '22px', borderRadius: '18px' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '20px', fontSize: '1.2rem' }}>Registrar Movimiento Financiero</h3>

          <label>Tipo de Movimiento:</label>
          <select 
            value={tipo} 
            onChange={e => {
              setTipo(e.target.value);
              setCategoria(e.target.value === 'ingreso' ? 'Venta de café' : 'Insumos y Fertilizantes');
            }}
          >
            <option value="ingreso">Ingreso (Venta)</option>
            <option value="gasto">Egreso / Gasto</option>
          </select>

          <label>Categoría:</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)}>
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
              </>
            )}
          </select>

          <label>Valor ($ COP):</label>
          <input 
            type="number" 
            placeholder="Ej: 850000" 
            value={valor} 
            onChange={e => setValor(e.target.value)} 
            required 
          />

          <label>Fecha del Registro:</label>
          <input 
            type="date" 
            value={fecha} 
            onChange={e => setFecha(e.target.value)} 
            required 
          />

          <button type="submit" className="btn-primary">
            Guardar Transacción
          </button>
        </form>
      )}
    </div>
  );
}