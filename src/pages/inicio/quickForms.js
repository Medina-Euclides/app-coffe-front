// Tipos de formulario rápido que son movimientos financieros, y la precarga del suyo.
export const tipoMovimiento = { venta: 'sale', gasto: 'expense' };

export const cargarFormularioMovimiento = () =>
  import('#pages/finance/components/MovementFormDialog.jsx');
