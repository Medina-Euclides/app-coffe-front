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

// ── Números ────────────────────────────────────────────────────────────────
const numberFormatters = new Map();
function numberFormatter(maximumFractionDigits) {
  if (!numberFormatters.has(maximumFractionDigits)) {
    numberFormatters.set(
      maximumFractionDigits,
      new Intl.NumberFormat('es-CO', { maximumFractionDigits }),
    );
  }
  return numberFormatters.get(maximumFractionDigits);
}

// Número con separador de miles (por defecto hasta 2 decimales).
export const formatoNumero = (valor, decimales = 2) =>
  numberFormatter(decimales).format(Number(valor || 0));

// "1,2 mil", "3,4 M" para ejes de gráficos.
const compacto = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
export const formatoCompacto = (valor) => compacto.format(Number(valor || 0));

// Kilos sin la unidad; 3 decimales para pesajes, 1 para resúmenes.
export const formatoKilos = (valor, decimales = 3) => formatoNumero(valor, decimales);

// Hectáreas con unidad, o null si no hay dato.
export const formatoArea = (ha) =>
  ha === null || ha === undefined ? null : `${formatoNumero(ha, 2)} ha`;

// Conteo entero (plantas, personas), o null si no hay dato.
export const formatoConteo = (n) =>
  n === null || n === undefined ? null : formatoNumero(Math.round(n), 0);

// "1 jornal" / "3 jornales" / "2,5 kilos".
export const plural = (n, singular, pluralForm = `${singular}s`) =>
  `${formatoNumero(n, 1)} ${n === 1 ? singular : pluralForm}`;

// ── Fechas ─────────────────────────────────────────────────────────────────
const fechaCorta = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const fechaCortaAnio = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const fechaLarga = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const fechaDia = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const hora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });

function aFecha(valor) {
  if (!valor) return null;
  const date =
    valor instanceof Date
      ? valor
      : /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
        ? new Date(`${valor}T00:00:00`)
        : new Date(valor);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "5 nov" (sin puntos de abreviatura).
export const formatoFechaCorta = (valor, vacio = 'Sin fecha') => {
  const date = aFecha(valor);
  return date ? fechaCorta.format(date).replace(/\./g, '') : vacio;
};

// "5 nov 2026".
export const formatoFechaAnio = (valor, vacio = 'Fecha sin registrar') => {
  const date = aFecha(valor);
  return date ? fechaCortaAnio.format(date) : vacio;
};

// "jueves, 5 de noviembre de 2026".
export const formatoFechaLarga = (valor, vacio = 'Fecha sin registrar') => {
  const date = aFecha(valor);
  return date ? fechaLarga.format(date) : vacio;
};

// "jueves, 5 de noviembre".
export const formatoFechaDia = (valor, vacio = 'Fecha sin registrar') => {
  const date = aFecha(valor);
  return date ? fechaDia.format(date) : vacio;
};

// "3:45 p. m.".
export const formatoHora = (valor) => {
  const date = aFecha(valor);
  return date ? hora.format(date) : '';
};

// ── Personas ───────────────────────────────────────────────────────────────
// Primer nombre del usuario autenticado para saludos ('' si no hay).
export function getFirstName(usuario) {
  return (
    usuario?.first_name ||
    usuario?.nombre ||
    usuario?.full_name?.split(' ')[0] ||
    ''
  );
}

// Nombre completo del usuario autenticado.
export function getFullName(usuario, vacio = '') {
  return (
    usuario?.full_name ||
    [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') ||
    usuario?.nombreProductor ||
    vacio
  );
}
