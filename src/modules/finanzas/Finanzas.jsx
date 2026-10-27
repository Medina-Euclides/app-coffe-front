import { useEffect, useMemo, useState, useCallback } from 'react';
import { obtenerFechaLocal, formatoDinero } from '../../utils/formatters';
import { leerLocal, guardarLocal } from '../../utils/storage';

import FinanzasFiltros from './components/FinanzasFiltros';
import IndicadoresCards from './components/IndicadoresCards';
import MovimientosTabla from './components/MovimientosTabla';
import FinanzasGraficos from './components/FinanzasGraficos';
import MovimientoForm from './components/MovimientoForm';

export default function Finanzas({ usuario, subSeccion }) {
  const userId = usuario?.id || 'default';

  const [movimientos, setMovimientos] = useState(() =>
    leerLocal(`cafesmart_movimientos_${userId}`, [])
  );
  const [jornadas, setJornadas] = useState(() =>
    leerLocal(`cafesmart_jornadas_${userId}`, [])
  );
  const [fincas, setFincas] = useState(() =>
    leerLocal(`cafesmart_fincas_${userId}`, [])
  );
  const [lotes, setLotes] = useState(() =>
    leerLocal(`cafesmart_lotes_${userId}`, [])
  );

  const [fincaId, setFincaId] = useState(() => {
    const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return activa ? String(activa) : '';
  });

  const [vista, setVista] = useState('historial');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [busquedaMovimientos, setBusquedaMovimientos] = useState('');

  const [tipo, setTipo] = useState('ingreso');
  const [categoria, setCategoria] = useState('Venta de café');
  const [valorTexto, setValorTexto] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaLocal());
  const [descripcion, setDescripcion] = useState('');
  const [comprador, setComprador] = useState('');
  const [cantidadKg, setCantidadKg] = useState('');
  const [fincaFormulario, setFincaFormulario] = useState(() => {
    const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
    return activa ? String(activa) : '';
  });

  // Sincronización con subSección del menú lateral
  useEffect(() => {
    if (subSeccion) {
      if (
        subSeccion === 'finanzas-indicadores' ||
        subSeccion === 'historial-movimientos' ||
        subSeccion === 'resumen'
      ) {
        setVista('historial');
      }
      if (subSeccion === 'finanzas-graficos') {
        setVista('graficos');
      }
      if (
        subSeccion === 'nuevo-movimiento' ||
        subSeccion === 'nuevo-gasto' ||
        subSeccion === 'nuevo-ingreso'
      ) {
        if (subSeccion === 'nuevo-ingreso') {
          setTipo('ingreso');
          setCategoria('Venta de café');
        } else if (subSeccion === 'nuevo-gasto') {
          setTipo('gasto');
          setCategoria('Insumos y Fertilizantes');
        }
        setVista('nuevo_movimiento');
      }
    } else {
      setVista('historial');
    }
  }, [subSeccion]);

  // Actualizar datos al reenfocar
  useEffect(() => {
    const actualizarDatos = () => {
      const fincasCargadas = leerLocal(`cafesmart_fincas_${userId}`, []);
      setFincas(fincasCargadas);
      setLotes(leerLocal(`cafesmart_lotes_${userId}`, []));
      setJornadas(leerLocal(`cafesmart_jornadas_${userId}`, []));
      setMovimientos(leerLocal(`cafesmart_movimientos_${userId}`, []));

      const activa = localStorage.getItem(`cafesmart_finca_activa_${userId}`);
      if (activa) {
        setFincaId(String(activa));
        setFincaFormulario(String(activa));
      } else if (fincasCargadas.length > 0 && !fincaFormulario) {
        setFincaFormulario(String(fincasCargadas[0].id));
      }
    };

    actualizarDatos();
    window.addEventListener('focus', actualizarDatos);
    return () => window.removeEventListener('focus', actualizarDatos);
  }, [userId, vista]);

  // Persistir movimientos
  useEffect(() => {
    guardarLocal(`cafesmart_movimientos_${userId}`, movimientos);
  }, [movimientos, userId]);

  const fincaSeleccionada = fincas.find(
    (f) => String(f.id) === String(fincaId)
  );

  const fincaDelFormulario = fincas.find(
    (f) => String(f.id) === String(fincaFormulario)
  );

  const esVentaCafe = tipo === 'ingreso' && categoria === 'Venta de café';

  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setCategoria(
      nuevoTipo === 'ingreso' ? 'Venta de café' : 'Insumos y Fertilizantes'
    );
    setValorTexto('');
    setDescripcion('');
    setComprador('');
    setCantidadKg('');
  };

  const guardarMovimiento = (e) => {
    if (e?.preventDefault) e.preventDefault();

    const valorNumerico = Number(valorTexto);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      window.alert('El valor debe ser un número mayor que cero.');
      return;
    }

    if (!fecha) {
      window.alert('Selecciona la fecha del movimiento.');
      return;
    }

    if (!fincaDelFormulario) {
      window.alert('Selecciona la finca a la que corresponde el movimiento.');
      return;
    }

    let kilos = null;

    if (esVentaCafe) {
      const kilosTexto = String(cantidadKg || '').replace(',', '.');
      kilos = Number(kilosTexto);

      if (!Number.isFinite(kilos) || kilos <= 0) {
        window.alert('Los kilogramos vendidos deben ser mayores que cero.');
        return;
      }

      if (!comprador.trim()) {
        window.alert('Escribe el nombre del comprador.');
        return;
      }
    }

    const nuevoMovimiento = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tipo,
      categoria,
      descripcion:
        descripcion.trim() ||
        (esVentaCafe
          ? `Venta de ${kilos} kg de café a ${comprador.trim()}`
          : categoria),
      valor: valorNumerico,
      fecha,
      fincaId: fincaDelFormulario.id,
      ...(esVentaCafe
        ? {
            cantidadKg: kilos,
            comprador: comprador.trim(),
          }
        : {}),
    };

    setMovimientos((anteriores) => [nuevoMovimiento, ...anteriores]);

    setFincaId(String(fincaDelFormulario.id));
    localStorage.setItem(`cafesmart_finca_activa_${userId}`, String(fincaDelFormulario.id));

    setValorTexto('');
    setDescripcion('');
    setComprador('');
    setCantidadKg('');
    setVista('historial');

    window.alert('Movimiento financiero guardado correctamente.');
  };

  const filtrarPorFecha = useCallback((fechaItem) => {
    if (filtroPeriodo === 'todos') return true;
    if (!fechaItem) return false;

    const partes = fechaItem.split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) return false;

    const [anio, mes] = partes;
    const ahora = new Date();

    if (filtroPeriodo === 'este_mes') {
      return anio === ahora.getFullYear() && mes === ahora.getMonth() + 1;
    }

    if (filtroPeriodo === 'mes_anterior') {
      const anterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      return anio === anterior.getFullYear() && mes === anterior.getMonth() + 1;
    }

    if (filtroPeriodo === 'este_ano') {
      return anio === ahora.getFullYear();
    }

    return true;
  }, [filtroPeriodo]);

  const perteneceAFinca = useCallback((registro) => {
    if (fincaId === '') return true;
    if (registro.fincaId === undefined || registro.fincaId === null) return false;
    return String(registro.fincaId) === String(fincaId);
  }, [fincaId]);

  const movimientosFiltrados = useMemo(() => {
    const term = busquedaMovimientos.trim().toLowerCase();
    return movimientos.filter((m) => {
      if (!filtrarPorFecha(m.fecha) || !perteneceAFinca(m)) return false;
      if (!term) return true;

      const fincaMovimiento = fincas.find((f) => String(f.id) === String(m.fincaId));
      const campos = [
        m.descripcion,
        m.categoria,
        m.comprador,
        m.fecha,
        fincaMovimiento?.nombre,
        m.tipo,
      ]
        .filter(Boolean)
        .map((c) => String(c).toLowerCase());

      return campos.some((c) => c.includes(term));
    });
  }, [movimientos, filtrarPorFecha, perteneceAFinca, busquedaMovimientos, fincas]);

  const jornadasFiltradas = useMemo(
    () =>
      jornadas.filter((j) => {
        if (!filtrarPorFecha(j.fecha)) return false;
        if (fincaId === '') return true;
        if (j.fincaId !== undefined && j.fincaId !== null) {
          return String(j.fincaId) === String(fincaId);
        }
        const coincidencias = lotes.filter((l) => l.nombre === j.lote);
        return (
          coincidencias.length === 1 &&
          String(coincidencias[0].fincaId) === String(fincaId)
        );
      }),
    [jornadas, filtrarPorFecha, fincaId, lotes]
  );

  const totalIngresos = movimientosFiltrados
    .filter((m) => m.tipo === 'ingreso' || m.tipo === 'venta')
    .reduce((suma, m) => suma + Number(m.valor || 0), 0);

  const totalEgresos = movimientosFiltrados
    .filter((m) => m.tipo === 'gasto' || m.tipo === 'egreso')
    .reduce((suma, m) => suma + Number(m.valor || 0), 0);

  const balanceNeto = totalIngresos - totalEgresos;

  const produccionTotalKg = jornadasFiltradas
    .filter((j) => j.modalidad === 'recoleccion' && j.estado === 'pagado')
    .reduce((suma, j) => suma + Number(j.cantidad || 0), 0);

  const kilosVendidos = movimientosFiltrados
    .filter(
      (m) =>
        (m.tipo === 'ingreso' || m.tipo === 'venta') &&
        m.categoria === 'Venta de café' &&
        Number(m.cantidadKg) > 0
    )
    .reduce((suma, m) => suma + Number(m.cantidadKg || 0), 0);

  const tarjetas = [
    {
      titulo: 'Ingresos totales',
      valor: formatoDinero(totalIngresos),
      fondo: '#f0fdf4',
      borde: '#bbf7d0',
      color: '#15803d',
    },
    {
      titulo: 'Egresos totales',
      valor: formatoDinero(totalEgresos),
      fondo: '#fef2f2',
      borde: '#fecaca',
      color: '#dc2626',
    },
    {
      titulo: 'Balance neto',
      valor: formatoDinero(balanceNeto),
      fondo: balanceNeto >= 0 ? '#ecfdf5' : '#fff1f2',
      borde: balanceNeto >= 0 ? '#a7f3d0' : '#fecaca',
      color: balanceNeto >= 0 ? '#047857' : '#e11d48',
    },
    {
      titulo: 'Café cosechado',
      valor: `${produccionTotalKg.toLocaleString('es-CO')} kg`,
      fondo: '#fff',
      borde: '#e2e8f0',
      color: '#0f172a',
    },
    {
      titulo: 'Café vendido registrado',
      valor: `${kilosVendidos.toLocaleString('es-CO')} kg`,
      fondo: '#fff',
      borde: '#e2e8f0',
      color: '#0f172a',
    },
  ];

  const resumenPorCategoria = useMemo(() => {
    const mapa = new Map();
    movimientosFiltrados.forEach((m) => {
      const clave = m.categoria || 'Sin categoría';
      const actual = mapa.get(clave) || { categoria: clave, ingreso: 0, gasto: 0, total: 0 };
      const valor = Number(m.valor || 0);
      if (m.tipo === 'ingreso' || m.tipo === 'venta') {
        actual.ingreso += valor;
      } else {
        actual.gasto += valor;
      }
      actual.total = actual.ingreso - actual.gasto;
      mapa.set(clave, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.gasto + b.ingreso - (a.gasto + a.ingreso));
  }, [movimientosFiltrados]);

  const maxCategoriaValor = resumenPorCategoria.reduce((max, item) => {
    const val = Math.max(item.ingreso, item.gasto);
    return val > max ? val : max;
  }, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <h2 style={{ color: '#064e3b', margin: 0 }}>Gestión Financiera</h2>

      {vista === 'historial' && (
        <section id="finanzas-indicadores" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FinanzasFiltros
            fincas={fincas}
            fincaId={fincaId}
            setFincaId={setFincaId}
            filtroPeriodo={filtroPeriodo}
            setFiltroPeriodo={setFiltroPeriodo}
            fincaSeleccionada={fincaSeleccionada}
            userId={userId}
          />

          <IndicadoresCards tarjetas={tarjetas} />

          <MovimientosTabla
            movimientos={movimientosFiltrados}
            fincas={fincas}
            busqueda={busquedaMovimientos}
            setBusqueda={setBusquedaMovimientos}
          />
        </section>
      )}

      {vista === 'graficos' && (
        <FinanzasGraficos
          fincas={fincas}
          fincaId={fincaId}
          setFincaId={setFincaId}
          filtroPeriodo={filtroPeriodo}
          setFiltroPeriodo={setFiltroPeriodo}
          userId={userId}
          totalIngresos={totalIngresos}
          totalEgresos={totalEgresos}
          balanceNeto={balanceNeto}
          resumenPorCategoria={resumenPorCategoria}
          maxCategoriaValor={maxCategoriaValor}
        />
      )}

      {vista === 'nuevo_movimiento' && (
        <MovimientoForm
          fincas={fincas}
          fincaFormulario={fincaFormulario}
          setFincaFormulario={setFincaFormulario}
          tipo={tipo}
          cambiarTipo={cambiarTipo}
          categoria={categoria}
          setCategoria={setCategoria}
          valorTexto={valorTexto}
          setValorTexto={setValorTexto}
          fecha={fecha}
          setFecha={setFecha}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          comprador={comprador}
          setComprador={setComprador}
          cantidadKg={cantidadKg}
          setCantidadKg={setCantidadKg}
          esVentaCafe={esVentaCafe}
          onGuardarMovimiento={guardarMovimiento}
        />
      )}
    </div>
  );
}
