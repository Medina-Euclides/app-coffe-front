import { useState, useEffect } from 'react';

export default function Personal({ usuario }) {
  const userId = usuario?.id || 'default';

  const [trabajadores, setTrabajadores] = useState(() => {
    try {
      const guardados = localStorage.getItem(`cafesmart_trabajadores_${userId}`);
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });

  const [fincas, setFincas] = useState(() => {
    try {
      const guardadas = localStorage.getItem(`cafesmart_fincas_${userId}`);
      return guardadas ? JSON.parse(guardadas) : [];
    } catch {
      return [];
    }
  });

  const [fincaId, setFincaId] = useState(() => {
    const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return activa ? Number(activa) : (fincas[0]?.id || 1);
  });

  const [lotes, setLotes] = useState(() => {
    try {
      const guardados = localStorage.getItem(`cafesmart_lotes_${userId}`);
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });

  const [actividades, setActividades] = useState(() => {
    try {
      const guardadas = localStorage.getItem(`cafesmart_actividades_${userId}`);
      return guardadas ? JSON.parse(guardadas) : [
        'Recolección de café',
        'Deshierbe / Plateo',
        'Abonado / Fertilización',
        'Poda y Zoca',
        'Ahoyado y Siembra',
        'Fumigación / Control de plagas'
      ];
    } catch {
      return ['Recolección de café', 'Deshierbe / Plateo', 'Abonado / Fertilización'];
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

  const [tarifaKg, setTarifaKg] = useState(() => localStorage.getItem(`cafesmart_tarifa_kg_${userId}`) || '1000');
  const [tarifaJornal, setTarifaJornal] = useState(() => localStorage.getItem(`cafesmart_tarifa_jornal_${userId}`) || '50000');

  const [vista, setVista] = useState('lista'); 
  const [nuevaActividadNombre, setNuevaActividadNombre] = useState('');

  // Formulario de Trabajador
  const [nombreTrabajador, setNombreTrabajador] = useState('');

  // Formulario de Jornada / Recolección
  const [trabajadorId, setTrabajadorId] = useState('');
  const [lote, setLote] = useState('');
  const [actividadSeleccionada, setActividadSeleccionada] = useState('Recolección de café');
  const [modalidad, setModalidad] = useState('recoleccion');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    try {
      const fincasG = localStorage.getItem(`cafesmart_fincas_${userId}`);
      if (fincasG) setFincas(JSON.parse(fincasG));

      const lotesG = localStorage.getItem(`cafesmart_lotes_${userId}`);
      if (lotesG) setLotes(JSON.parse(lotesG));
    } catch (e) {
      console.error(e);
    }
  }, [vista, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_trabajadores_${userId}`, JSON.stringify(trabajadores));
  }, [trabajadores, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_actividades_${userId}`, JSON.stringify(actividades));
  }, [actividades, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_jornadas_${userId}`, JSON.stringify(jornadas));
  }, [jornadas, userId]);

  useEffect(() => {
    localStorage.setItem(`cafesmart_tarifa_kg_${userId}`, tarifaKg);
    localStorage.setItem(`cafesmart_tarifa_jornal_${userId}`, tarifaJornal);
  }, [tarifaKg, tarifaJornal, userId]);

  const lotesDeFincaSeleccionada = lotes.filter(l => Number(l.fincaId) === Number(fincaId));

  const agregarNuevaActividad = (e) => {
    e.preventDefault();
    if (!nuevaActividadNombre.trim()) return;
    if (actividades.includes(nuevaActividadNombre.trim())) {
      alert('Esta actividad ya existe en el catálogo.');
      return;
    }
    setActividades([...actividades, nuevaActividadNombre.trim()]);
    setActividadSeleccionada(nuevaActividadNombre.trim());
    setNuevaActividadNombre('');
  };

  const guardarTrabajador = (e) => {
    e.preventDefault();
    if (!nombreTrabajador.trim()) return;
    const nuevo = { id: Date.now(), nombre: nombreTrabajador.trim() };
    setTrabajadores([...trabajadores, nuevo]);
    setNombreTrabajador('');
    setVista('lista');
  };

  const guardarJornada = (e) => {
    e.preventDefault();
    if (!trabajadorId || !lote || !cantidad) return;
    const tarifaAplicada = modalidad === 'recoleccion' ? Number(tarifaKg) : Number(tarifaJornal);
    const subtotal = Number(cantidad) * tarifaAplicada;

    const nuevaRegistro = {
      id: Date.now(),
      trabajadorId: Number(trabajadorId),
      fincaId: Number(fincaId),
      lote,
      actividad: actividadSeleccionada,
      modalidad,
      cantidad: Number(cantidad),
      tarifaAplicada,
      subtotal,
      fecha,
      estado: 'pendiente'
    };

    setJornadas([...jornadas, nuevaRegistro]);
    setCantidad('');
    setLote('');
    setVista('lista');
  };

  const calcularLiquidacionPendiente = (id) => {
    return jornadas
      .filter(j => j.trabajadorId === id && j.estado !== 'pagado')
      .reduce((acumulado, registro) => acumulado + Number(registro.subtotal || 0), 0);
  };

  const realizarPagoLiquidacion = (trabajador) => {
    const montoAPagar = calcularLiquidacionPendiente(trabajador.id);
    if (montoAPagar <= 0) return;

    const jornadasActualizadas = jornadas.map(j => {
      if (j.trabajadorId === trabajador.id && j.estado !== 'pagado') {
        return { ...j, estado: 'pagado', fechaPago: new Date().toISOString().split('T')[0] };
      }
      return j;
    });

    setJornadas(jornadasActualizadas);

    const movimientosExistentes = JSON.parse(localStorage.getItem(`cafesmart_movimientos_${userId}`)) || [];
    const nuevoEgresoManoObra = {
      id: Date.now(),
      tipo: 'gasto',
      categoria: 'Mano de Obra',
      descripcion: `Pago liquidación: ${trabajador.nombre}`,
      valor: montoAPagar,
      fecha: new Date().toISOString().split('T')[0]
    };

    localStorage.setItem(`cafesmart_movimientos_${userId}`, JSON.stringify([nuevoEgresoManoObra, ...movimientosExistentes]));
    alert(`Pago de $${montoAPagar.toLocaleString()} COP registrado con éxito para ${trabajador.nombre}.`);
  };

  return (
    <div>
      <h2 style={{ color: '#064e3b', marginBottom: '16px' }}>Personal y Gestión Laboral</h2>

      {/* NAVEGACIÓN BASADA EN TARJETAS MODERNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        
        <div 
          onClick={() => setVista('lista')} 
          style={{ 
            backgroundColor: vista === 'lista' ? '#ecfdf5' : '#ffffff', 
            border: vista === 'lista' ? '2px solid #047857' : '1px solid #cbd5e1', 
            borderRadius: '14px', 
            padding: '16px 14px', 
            cursor: 'pointer',
            boxShadow: vista === 'lista' ? '0 4px 12px rgba(4, 120, 87, 0.12)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <strong style={{ display: 'block', color: vista === 'lista' ? '#047857' : '#1e293b', fontSize: '0.95rem', marginBottom: '4px' }}>Liquidaciones</strong>
          <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.2', display: 'block' }}>Saldos y pagos a personal</span>
        </div>

        <div 
          onClick={() => setVista('nueva_jornada')} 
          style={{ 
            backgroundColor: vista === 'nueva_jornada' ? '#ecfdf5' : '#ffffff', 
            border: vista === 'nueva_jornada' ? '2px solid #047857' : '1px solid #cbd5e1', 
            borderRadius: '14px', 
            padding: '16px 14px', 
            cursor: 'pointer',
            boxShadow: vista === 'nueva_jornada' ? '0 4px 12px rgba(4, 120, 87, 0.12)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <strong style={{ display: 'block', color: vista === 'nueva_jornada' ? '#047857' : '#1e293b', fontSize: '0.95rem', marginBottom: '4px' }}>Registrar Labor</strong>
          <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.2', display: 'block' }}>Anotar Kg o jornadas</span>
        </div>

        <div 
          onClick={() => setVista('nuevo_trabajador')} 
          style={{ 
            backgroundColor: vista === 'nuevo_trabajador' ? '#ecfdf5' : '#ffffff', 
            border: vista === 'nuevo_trabajador' ? '2px solid #047857' : '1px solid #cbd5e1', 
            borderRadius: '14px', 
            padding: '16px 14px', 
            cursor: 'pointer',
            boxShadow: vista === 'nuevo_trabajador' ? '0 4px 12px rgba(4, 120, 87, 0.12)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <strong style={{ display: 'block', color: vista === 'nuevo_trabajador' ? '#047857' : '#1e293b', fontSize: '0.95rem', marginBottom: '4px' }}>Nuevo Trabajador</strong>
          <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.2', display: 'block' }}>Agregar personal</span>
        </div>

        <div 
          onClick={() => setVista('tarifas')} 
          style={{ 
            backgroundColor: vista === 'tarifas' ? '#ecfdf5' : '#ffffff', 
            border: vista === 'tarifas' ? '2px solid #047857' : '1px solid #cbd5e1', 
            borderRadius: '14px', 
            padding: '16px 14px', 
            cursor: 'pointer',
            boxShadow: vista === 'tarifas' ? '0 4px 12px rgba(4, 120, 87, 0.12)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <strong style={{ display: 'block', color: vista === 'tarifas' ? '#047857' : '#1e293b', fontSize: '0.95rem', marginBottom: '4px' }}>Tarifas y Catálogo</strong>
          <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.2', display: 'block' }}>Precios y labores</span>
        </div>

      </div>

      {/* VISTA 1: LISTADO Y LIQUIDACIÓN PENDIENTE */}
      {vista === 'lista' && (
        <div>
          <h3 style={{ color: '#0f172a', marginBottom: '14px' }}>Liquidación Pendiente por Trabajador</h3>
          {trabajadores.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
              <p style={{ margin: 0 }}>No tienes trabajadores registrados en tu finca.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Haz clic en la tarjeta "Nuevo Trabajador" para agregar uno.</p>
            </div>
          ) : (
            trabajadores.map(t => {
              const totalPendiente = calcularLiquidacionPendiente(t.id);
              return (
                <div key={t.id} className="card" style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ color: '#0f172a', margin: 0, fontSize: '1.1rem' }}>{t.nombre}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Saldo Pendiente:</span>
                      <h3 style={{ color: totalPendiente > 0 ? '#dc2626' : '#059669', margin: 0, fontSize: '1.2rem' }}>
                        $ {totalPendiente.toLocaleString()} COP
                      </h3>
                    </div>
                  </div>

                  {totalPendiente > 0 ? (
                    <button 
                      onClick={() => realizarPagoLiquidacion(t)}
                      style={{ width: '100%', backgroundColor: '#047857', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                      Registrar Pago y Cerrar Liquidación ($ {totalPendiente.toLocaleString()})
                    </button>
                  ) : (
                    <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 'bold' }}>
                      Sin saldo pendiente (Al día)
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISTA 2: REGISTRAR LABOR OPERATIVA */}
      {vista === 'nueva_jornada' && (
        <form onSubmit={guardarJornada} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '18px' }}>Registrar Labor Operativa</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Trabajador:</label>
            <select value={trabajadorId} onChange={e => setTrabajadorId(e.target.value)} required style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }}>
              <option value="">Seleccione un trabajador...</option>
              {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Actividad / Labor Realizada:</label>
            <select 
              value={actividadSeleccionada} 
              onChange={e => {
                setActividadSeleccionada(e.target.value);
                if (e.target.value === 'Recolección de café') {
                  setModalidad('recoleccion');
                } else {
                  setModalidad('jornal');
                }
              }} 
              required
              style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #047857', fontWeight: 'bold' }}
            >
              {actividades.map((act, idx) => (
                <option key={idx} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Finca:</label>
            <select value={fincaId} onChange={e => { setFincaId(Number(e.target.value)); setLote(''); }} required style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '2px solid #059669', fontWeight: 'bold' }}>
              {fincas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Lote de la Finca:</label>
            <select value={lote} onChange={e => setLote(e.target.value)} required style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }}>
              <option value="">{lotesDeFincaSeleccionada.length === 0 ? 'Esta finca no tiene lotes creados' : 'Seleccione un lote...'}</option>
              {lotesDeFincaSeleccionada.map(l => <option key={l.id} value={l.nombre}>{l.nombre} ({l.variedad})</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Modalidad de Pago:</label>
            <select value={modalidad} onChange={e => setModalidad(e.target.value)} style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }}>
              <option value="recoleccion">Pago por Kilo ($ {Number(tarifaKg).toLocaleString()}/Kg)</option>
              <option value="jornal">Pago por Jornal / Día ($ {Number(tarifaJornal).toLocaleString()}/Día)</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>
              {modalidad === 'recoleccion' ? 'Cantidad Recolectada (Kg):' : 'Días Trabajados:'}
            </label>
            <input type="number" step="0.1" value={cantidad} onChange={e => setCantidad(e.target.value)} required placeholder="Ej: 45" style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Fecha:</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }} />
          </div>

          <button type="submit" className="btn-primary" style={{ minHeight: '52px', fontSize: '1rem' }}>Guardar Registro Operativo</button>
        </form>
      )}

      {/* VISTA 3: CREAR NUEVO TRABAJADOR */}
      {vista === 'nuevo_trabajador' && (
        <form onSubmit={guardarTrabajador} style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '18px' }}>Crear Nuevo Trabajador</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Nombre Completo del Trabajador:</label>
            <input 
              type="text" 
              placeholder="Ej: Carlos Ramírez" 
              value={nombreTrabajador} 
              onChange={e => setNombreTrabajador(e.target.value)} 
              required 
              style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ minHeight: '52px', fontSize: '1rem' }}>Guardar Trabajador</button>
        </form>
      )}

      {/* VISTA 4: TARIFAS Y CATÁLOGO DE ACTIVIDADES */}
      {vista === 'tarifas' && (
        <div>
          <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 style={{ color: '#064e3b', marginBottom: '16px' }}>Tarifas Oficiales de la Finca</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Tarifa por Kilo Recolectado ($ COP):</label>
              <input type="number" value={tarifaKg} onChange={e => setTarifaKg(e.target.value)} style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>Tarifa por Día de Jornal ($ COP):</label>
              <input type="number" value={tarifaJornal} onChange={e => setTarifaJornal(e.target.value)} style={{ width: '100%', minHeight: '48px', padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1' }} />
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ color: '#064e3b', marginBottom: '8px' }}>Catálogo de Actividades Laborales</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
              Agrega labores personalizadas para usarlas al registrar las jornadas de tu personal.
            </p>

            <form onSubmit={agregarNuevaActividad} style={{ border: 'none', padding: 0, boxShadow: 'none', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Ej: Preparación de almácigo" 
                  value={nuevaActividadNombre} 
                  onChange={e => setNuevaActividadNombre(e.target.value)}
                  style={{ marginBottom: 0, minHeight: '48px', borderRadius: '10px', border: '2px solid #cbd5e1' }}
                />
                <button type="submit" style={{ backgroundColor: '#047857', color: 'white', border: 'none', padding: '0 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '48px' }}>
                  + Agregar
                </button>
              </div>
            </form>

            <h4 style={{ color: '#334155', marginBottom: '10px' }}>Actividades Disponibles:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {actividades.map((act, index) => (
                <div key={index} style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.92rem', color: '#0f172a', fontWeight: '600' }}>
                  {act}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}