// Fincas y lotes: lectura tolerante de cifras (caché local y API) y reglas de validación
// compartidas por Fincas y lotes y el asistente de configuración.
import { isDuplicate } from '#lib/validation';

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

// Área opcional: vacía (null) o un número mayor que cero.
export const isValidLotArea = (area) => area === null || (Number.isFinite(area) && area > 0);

// Plantas opcionales: vacías (null) o un entero ≥ 0.
export const isValidPlantCount = (count) =>
  count === null || (Number.isInteger(count) && count >= 0);

// Mensaje de error para el formulario de finca, o '' si es válida.
export function validateFarm(data, farms, editingId) {
  if (data.name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
  if (isDuplicate(farms, (farm) => farm.nombre, data.name, editingId)) {
    return 'Ya existe una finca con ese nombre.';
  }
  return '';
}

// Mensaje de error para el formulario de lote, o '' si es válido.
export function validateLot({ nombre, hectareas, plantCount }, lots, farmId, editingId) {
  if (nombre.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
  if (!isValidLotArea(hectareas)) return 'El área debe ser un número mayor que cero.';
  if (!isValidPlantCount(plantCount)) {
    return 'El número de plantas debe ser un entero igual o mayor que cero.';
  }
  const farmLots = (lots || []).filter((lot) => String(lot.fincaId) === String(farmId));
  if (isDuplicate(farmLots, (lot) => lot.nombre, nombre, editingId)) {
    return 'Ya existe un lote con ese nombre en esta finca.';
  }
  return '';
}
