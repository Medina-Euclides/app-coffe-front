// Campo de dinero en formato colombiano: muestra «1.250.000,5» mientras se escribe
// (puntos de miles, coma decimal) pero entrega al padre el número limpio «1250000.5».
import { useLayoutEffect, useRef } from 'react';
import { Input } from '#components/ui/input';

const MAX_DECIMALS = 2;
const MAX_INTEGER_DIGITS = 10;

// Valor limpio («1250000.5» o «1250.») → texto visible («1.250.000,5» o «1.250,»).
export function formatMoneyInput(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const [integer = '', decimals] = String(raw).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimals === undefined ? grouped : `${grouped || '0'},${decimals}`;
}

// Texto escrito → valor limpio. Los puntos son de miles; la coma es el decimal.
// El valor debe empezar por un dígito: una coma sin números antes se ignora.
function parseMoneyInput(text) {
  const [integerPart, ...rest] = text.split(',');
  const integerDigits = integerPart.replace(/\D/g, '');
  if (!integerDigits) {
    return rest.join('').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_INTEGER_DIGITS);
  }
  const integer = integerDigits.replace(/^0+(?=\d)/, '').slice(0, MAX_INTEGER_DIGITS);
  if (rest.length === 0) return integer;
  const decimals = rest.join('').replace(/\D/g, '').slice(0, MAX_DECIMALS);
  return `${integer}.${decimals}`;
}

// Cuántos dígitos y comas hay antes de la posición dada (los puntos no cuentan).
const significantBefore = (text, position) =>
  text.slice(0, position).replace(/[^\d,]/g, '').length;

function caretAfterSignificant(text, count) {
  if (count === 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/[\d,]/.test(text[index])) seen += 1;
    if (seen === count) return index + 1;
  }
  return text.length;
}

export default function MoneyInput({ value, onValueChange, ...props }) {
  const inputRef = useRef(null);
  const pendingCaret = useRef(null);
  const display = formatMoneyInput(value);

  // Tras reformatear, deja el cursor junto al mismo dígito que se estaba escribiendo.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (pendingCaret.current === null || !input || document.activeElement !== input) return;
    const position = caretAfterSignificant(display, pendingCaret.current);
    input.setSelectionRange(position, position);
    pendingCaret.current = null;
  });

  const handleChange = (event) => {
    let text = event.target.value;
    let caret = event.target.selectionStart ?? text.length;
    // Borrar un punto de miles no cambia el número: se borra el dígito anterior.
    const removedOnlyADot =
      event.nativeEvent?.inputType === 'deleteContentBackward' &&
      text.replace(/\./g, '') === display.replace(/\./g, '');
    if (removedOnlyADot && caret > 0) {
      text = text.slice(0, caret - 1) + text.slice(caret);
      caret -= 1;
    }
    // Muchos teclados numéricos solo traen «.»: si se acaba de escribir y aún no hay
    // coma, se toma como el separador decimal.
    if (event.nativeEvent?.data === '.' && !text.includes(',')) {
      text = `${text.slice(0, caret - 1)},${text.slice(caret)}`;
    }
    pendingCaret.current = significantBefore(text, caret);
    onValueChange(parseMoneyInput(text));
  };

  return (
    <Input
      {...props}
      autoComplete="off"
      inputMode="decimal"
      onChange={handleChange}
      ref={inputRef}
      type="text"
      value={display}
    />
  );
}
