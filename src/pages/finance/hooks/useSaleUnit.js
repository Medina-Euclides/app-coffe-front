// Cantidad y precio de una venta en la unidad que elige el productor (arrobas o kilos).
// Se escriben en la unidad que se muestra y al guardar se pasan a kilos y precio por kilo.
import { useState } from 'react';
import { KG_PER_ARROBA } from '#lib/constants';
import { formatoDinero, formatoNumero } from '#lib/formatters';
import { guardarLocal, leerLocal } from '#lib/storage';
import {
  arrobasToKg,
  kgToArrobas,
  pricePerArrobaToKg,
  pricePerKgToArroba,
} from '#lib/domain/movements';

const UNIT_STORAGE_KEY = 'cafesmart:sale-unit';

const readSavedUnit = () => (leerLocal(UNIT_STORAGE_KEY, 'arroba') === 'kg' ? 'kg' : 'arroba');

// Unidad con la que se abre el formulario. Una venta existente se abre en arrobas
// solo si sus kilos dan arrobas enteras o medias (25 kg → 2 @); si no (37 kg), en kilos.
function initialUnit(movement) {
  const kg = Number(movement?.quantity_kg);
  if (!(kg > 0)) return readSavedUnit();
  return Number.isInteger((kg / KG_PER_ARROBA) * 2) ? 'arroba' : 'kg';
}

const toFieldValue = (number) => (Number.isFinite(number) && number > 0 ? String(number) : '');

export function useSaleUnit(movement) {
  const [unit, setUnit] = useState(() => initialUnit(movement));
  const [quantity, setQuantity] = useState(() => {
    if (!movement?.quantity_kg) return '';
    return unit === 'arroba'
      ? toFieldValue(kgToArrobas(movement.quantity_kg))
      : String(movement.quantity_kg);
  });
  const [unitPrice, setUnitPrice] = useState(() => {
    if (!movement?.unit_price) return '';
    return unit === 'arroba'
      ? toFieldValue(pricePerKgToArroba(movement.unit_price))
      : String(movement.unit_price);
  });
  const isArroba = unit === 'arroba';

  // Cambia la unidad convirtiendo lo ya escrito, para que no se pierda ni quede mal.
  const changeUnit = (nextUnit) => {
    if (nextUnit === unit) return;
    const toArroba = nextUnit === 'arroba';
    if (Number(quantity) > 0) {
      setQuantity(toFieldValue(toArroba ? kgToArrobas(quantity) : arrobasToKg(quantity)));
    }
    if (Number(unitPrice) > 0) {
      setUnitPrice(toFieldValue(toArroba ? pricePerKgToArroba(unitPrice) : pricePerArrobaToKg(unitPrice)));
    }
    setUnit(nextUnit);
    guardarLocal(UNIT_STORAGE_KEY, nextUnit);
  };

  const quantityNumber = Number(quantity);
  const priceNumber = Number(unitPrice);
  const quantityKg = isArroba ? arrobasToKg(quantityNumber) : quantityNumber;
  const total = quantityNumber > 0 && priceNumber > 0 ? quantityNumber * priceNumber : 0;
  // «2 @ = 25 kg · Total $ 300.000».
  const summary =
    quantityNumber > 0
      ? [
          isArroba
            ? `${formatoNumero(quantityNumber)} @ = ${formatoNumero(quantityKg)} kg`
            : `${formatoNumero(quantityNumber)} kg = ${formatoNumero(kgToArrobas(quantityNumber))} @`,
          total > 0 ? `Total ${formatoDinero(total)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

  return {
    unit,
    isArroba,
    changeUnit,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    summary,
    quantityKg,
    pricePerKg: isArroba ? pricePerArrobaToKg(priceNumber) : priceNumber,
  };
}
