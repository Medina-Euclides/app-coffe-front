/**
 * Utilidades de formato para la aplicación CafeSmart
 */

/**
 * Retorna la fecha local actual en formato YYYY-MM-DD
 */
export const obtenerFechaLocal = () => {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
};

export const hoy = obtenerFechaLocal;

/**
 * Da formato de moneda colombiana (COP)
 */
export const formatoDinero = (valor, decimales = 0) =>
  Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: decimales,
  });

export const dinero = formatoDinero;

/**
 * Formatea un número agregando separadores de miles
 */
export const formatearMiles = (valor) => {
  if (!valor && valor !== 0) return '';
  const soloNumeros = String(valor).replace(/\D/g, '');
  if (!soloNumeros) return '';
  return Number(soloNumeros).toLocaleString('es-CO');
};

/**
 * Quita el formato de miles y devuelve sólo dígitos
 */
export const desformatearNumero = (valorFormateado) => {
  return String(valorFormateado ?? '').replace(/\D/g, '');
};

// Iniciales de nombre y apellido para los círculos de las tarjetas.
export function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${parts[0][0]}${last}`.toLocaleUpperCase('es');
}
