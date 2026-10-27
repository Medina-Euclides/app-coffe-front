import { useEffect, useMemo, useState } from 'react';
import { leerLocal, guardarLocal } from '../../utils/storage';
import { obtenerFechaLocal } from '../../utils/formatters';

export default function Inventario({ usuario, subSeccion }) {
  const userId = usuario?.id || 'default';

  const [fincas, setFincas] = useState(() => leerLocal(`cafesmart_fincas_${userId}`, []));
  const [lotes, setLotes] = useState(() => leerLocal(`cafesmart_lotes_${userId}`, []));
  const [jornadas, setJornadas] = useState(() => leerLocal(`cafesmart_jornadas_${userId}`, []));
  const [movimientos, setMovimientos] = useState(() => leerLocal(`cafesmart_movimientos_${userId}`, []));
  const [inventario, setInventario] = useState(() => leerLocal(`cafesmart_inventario_${userId}`, []));

  const [fincaId, setFincaId] = useState(() => {
    const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return activa ? String(activa) : '';
  });

  const [vista, setVista] = useState('resumen');
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada');
  const [presentacion, setPresentacion] = useState('pergamino');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaLocal());
  const [descripcion, setDescripcion] = useState('');
  const [loteId, setLoteId] = useState('');

  useEffect(() => {
    if (subSeccion === 'inventario-movimientos') setVista('movimientos');
    else setVista('resumen');
  }, [subSeccion]);

  useEffect(() => {
    guardarLocal(`cafesmart_inventario_${userId}`, inventario);
  }, [inventario, userId]);

  const fincaSeleccionada = fincas.find((f) => String(f.id) === String(fincaId));
  const lotesDeFinca = lotes.filter((l) => String(l.fincaId) === String(fincaId));

  const stockActual = useMemo(() => {
    let pergamino = 0;
    let oro = 0;
    inventario
      .filter((i) => String(i.fincaId) === String(fincaId))
      .forEach((i) => {
        const cant = Number(i.cantidad) || 0;
        if (i.tipo === 'entrada') {
          if (i.presentacion === 'pergamino') pergamino += cant;
          if (i.presentacion === 'oro') oro += cant;
        } else if (i.tipo === 'salida') {
          if (i.presentacion === 'pergamino') pergamino -= cant;
          if (i.presentacion === 'oro') oro -= cant;
        }
      });
    return { pergamino, oro };
  }, [inventario, fincaId]);

  const cosechaAcumulada = useMemo(() => {
    return jornadas
      .filter((j) => {
        if (String(j.fincaId) !== String(fincaId)) return false;
        if (j.estado !== 'pagado') return false;
        if (j.modalidad !== 'recoleccion') return false;
        return true;
      })
      .reduce((s, j) => s + Number(j.cantidad || 0), 0);
  }, [jornadas, fincaId]);

  const vendidoKg = useMemo(() => {
    return movimientos
      .filter((m) => {
        if (String(m.fincaId) !== String(fincaId)) return false;
        if (m.tipo !== 'ingreso' && m.tipo !== 'venta') return false;
        if (m.categoria !== 'Venta de café') return false;
        return Number(m.cantidadKg) > 0;
      })
      .reduce((s, m) => s + Number(m.cantidadKg || 0), 0);
  }, [movimientos, fincaId]);

  const registrarMovimiento = (e) => {
    e.preventDefault();
    const cant = Number(cantidad);
    if (!fincaSeleccionada) return alert('Selecciona una finca');
    if (!Number.isFinite(cant) || cant <= 0) return alert('Cantidad inválida');
    const nuevo = {
      id: Date.now(),
      fincaId: fincaSeleccionada.id,
      loteId: loteId || null,
      tipo: tipoMovimiento,
      presentacion,
      cantidad: cant,
      fecha,
      descripcion: descripcion.trim() || `${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'} de café ${presentacion}`,
      registradoPor: userId
    };
    setInventario((prev) => [nuevo, ...prev]);
    setCantidad('');
    setDescripcion('');
    setLoteId('');
    alert('Movimiento de inventario registrado');
    setVista('resumen');
  };

  const movimientosFinca = inventario
    .filter((i) => String(i.fincaId) === String(fincaId))
    .sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  const inputStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: 12, fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ color: '#064e3b', margin: 0 }}>Inventario de Café</h2>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select value={fincaId} onChange={(e) => setFincaId(e.target.value)} style={{ ...inputStyle, maxWidth: 280 }}>
          <option value=''>Selecciona finca</option>
          {fincas.map((f) => (<option key={f.id} value={f.id}>{f.nombre}</option>))}
        </select>
      </div>

      {vista === 'resumen' && fincaSeleccionada && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12 }}>
            <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#9a3412' }}>Café Pergamino</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ea580c' }}>{stockActual.pergamino.toLocaleString('es-CO')} kg</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#166534' }}>Café Oro / Trilla</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{stockActual.oro.toLocaleString('es-CO')} kg</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#1e40af' }}>Cosecha pagada (recolección)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{cosechaAcumulada.toLocaleString('es-CO')} kg</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16 }}>
              <div style={{ color: '#991b1b' }}>Vendido registrado</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{vendidoKg.toLocaleString('es-CO')} kg</div>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: 12 }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Presentación</th>
                  <th style={{ textAlign: 'right', padding: 12 }}>Cantidad (kg)</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Lote</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFinca.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12 }}>{m.fecha}</td>
                    <td style={{ padding: 12 }}>{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</td>
                    <td style={{ padding: 12 }}>{m.presentacion === 'pergamino' ? 'Pergamino' : 'Oro/Trilla'}</td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{Number(m.cantidad).toLocaleString('es-CO')}</td>
                    <td style={{ padding: 12 }}>{lotesDeFinca.find(l=>String(l.id)===String(m.loteId))?.nombre || '-'}</td>
                    <td style={{ padding: 12, color: '#64748b' }}>{m.descripcion}</td>
                  </tr>
                ))}
                {movimientosFinca.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>Sin movimientos de inventario registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {vista === 'movimientos' && fincaSeleccionada && (
        <form onSubmit={registrarMovimiento} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, color: '#064e3b' }}>Registrar movimiento de inventario</h3>
          <label style={labelStyle}>Tipo
            <select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
              <option value='entrada'>Entrada</option>
              <option value='salida'>Salida</option>
            </select>
          </label>
          <label style={labelStyle}>Presentación
            <select value={presentacion} onChange={(e) => setPresentacion(e.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
              <option value='pergamino'>Café Pergamino</option>
              <option value='oro'>Café Oro / Trilla</option>
            </select>
          </label>
          <label style={labelStyle}>Lote (opcional)
            <select value={loteId} onChange={(e) => setLoteId(e.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
              <option value=''>Sin lote</option>
              {lotesDeFinca.map((l) => (<option key={l.id} value={l.id}>{l.nombre}</option>))}
            </select>
          </label>
          <label style={labelStyle}>Cantidad (kg)
            <input type='number' min='0.1' step='0.1' value={cantidad} onChange={(e) => setCantidad(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} required />
          </label>
          <label style={labelStyle}>Fecha
            <input type='date' value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} required />
          </label>
          <label style={labelStyle}>Descripción (opcional)
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder='Detalle del movimiento' />
          </label>
          <button type='submit' style={{ padding: '12px', borderRadius: 10, border: 0, background: '#047857', color: '#fff', fontWeight: 700 }}>Registrar movimiento</button>
        </form>
      )}

      {!fincaSeleccionada && <p style={{ color: '#64748b' }}>Selecciona una finca para ver el inventario.</p>}
    </div>
  );
}
