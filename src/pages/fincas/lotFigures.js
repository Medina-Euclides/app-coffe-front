// Lectura de cifras de lotes tolerante a los dos formatos (caché local y API).
const numero = new Intl.NumberFormat('es-CO');
const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

function aNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

export function getLotArea(lot) {
  return aNumero(lot.hectareas ?? lot.area_hectares);
}

export function getLotPlants(lot) {
  return aNumero(lot.plant_count ?? lot.plantas);
}

export const formatArea = (ha) => (ha === null ? null : `${decimal.format(ha)} ha`);
export const formatCount = (n) => (n === null ? null : numero.format(Math.round(n)));
