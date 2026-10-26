/**
 * Constantes y catálogos globales de CafeSmart
 */

export const ACTIVIDADES_INICIALES = [
  'Recolección de café',
  'Deshierbe / Plateo',
  'Abonado / Fertilización',
  'Poda y Zoca',
  'Ahoyado y Siembra',
  'Fumigación / Control de plagas',
];

export const OPCIONES_JORNAL = [
  { valor: '0.25', etiqueta: 'Un cuarto de día (1/4)' },
  { valor: '0.5', etiqueta: 'Medio día (1/2)' },
  { valor: '0.75', etiqueta: 'Tres cuartos de día (3/4)' },
  { valor: '1', etiqueta: '1 Día completo' },
  { valor: '1.5', etiqueta: '1 Día y medio' },
  { valor: '2', etiqueta: '2 Días' },
  { valor: '2.5', etiqueta: '2 Días y medio' },
  { valor: '3', etiqueta: '3 Días' },
  { valor: '3.5', etiqueta: '3 Días y medio' },
  { valor: '4', etiqueta: '4 Días' },
  { valor: '5', etiqueta: '5 Días' },
  { valor: '6', etiqueta: '6 Días (Semana)' },
];

export const MENUS_NAVEGACION = [
  {
    id: 'cultivo',
    titulo: 'Cultivo',
    descripcion: 'Gestión de fincas y lotes',
    modulo: 'fincas',
    opciones: [
      { id: 'fincas-lotes', titulo: 'Fincas y Lotes', detalle: 'Inventario general' },
      { id: 'nuevo-lote', titulo: 'Crear Nuevo Lote', detalle: 'Agregar lote a la finca' },
      { id: 'nueva-finca', titulo: 'Crear Nueva Finca', detalle: 'Registrar finca adicional' },
    ],
  },
  {
    id: 'personal',
    titulo: 'Personal',
    descripcion: 'Gestión de labores y trabajadores',
    modulo: 'personal',
    opciones: [
      { id: 'liquidaciones', titulo: 'Liquidaciones', detalle: 'Saldos y pagos pendientes' },
      { id: 'registrar-labor', titulo: 'Registrar labor', detalle: 'Asignar actividad' },
      { id: 'nuevo-trabajador', titulo: 'Nuevo trabajador', detalle: 'Agregar personal' },
      { id: 'tarifas-actividades', titulo: 'Tarifas y actividades', detalle: 'Precios y catálogo' },
    ],
  },
  {
    id: 'administracion',
    titulo: 'Administración',
    descripcion: 'Control financiero y balances',
    modulo: 'finanzas',
    opciones: [
      { id: 'finanzas-indicadores', titulo: 'Finanzas e indicadores', detalle: 'Balances e historial' },
      { id: 'finanzas-graficos', titulo: 'Gráficas y análisis', detalle: 'Visualización gráfica' },
      { id: 'nuevo-movimiento', titulo: 'Registrar movimiento', detalle: 'Ingresos y egresos' },
    ],
  },
];
