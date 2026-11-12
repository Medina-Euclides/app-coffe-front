// Campo para cantidades con decimales (kilos, hectáreas). Es de texto, no
// `type="number"`: así no entran «e», «-» ni un punto al inicio («.5»), y se
// acepta coma o punto como separador. Entrega al padre el número limpio «35.5».
import { Input } from '#components/ui/input';
import { sanitizeDecimal } from '#lib/validation';

export default function DecimalInput({ decimals = 2, maxInteger = 9, value, onValueChange, ...props }) {
  return (
    <Input
      autoComplete="off"
      inputMode={decimals === 0 ? 'numeric' : 'decimal'}
      {...props}
      onChange={(event) => onValueChange(sanitizeDecimal(event.target.value, { decimals, maxInteger }))}
      type="text"
      value={value ?? ''}
    />
  );
}
