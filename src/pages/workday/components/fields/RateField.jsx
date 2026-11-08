// Tarifa acordada en pesos (por jornal o por kilo), con el signo $ dentro del campo.
import MoneyInput from '#components/shared/MoneyInput';
import { FormField } from '#components/shared/FormFeedback';
import { PAYMENT_MODES } from '#lib/constants';

export default function RateField({ feedback, id, paymentMode, label, hint, value, onChange, name }) {
  const perKilo = paymentMode === PAYMENT_MODES.KILOGRAM;
  const field = feedback.field(id);
  return (
    <FormField
      {...field}
      hint={hint}
      htmlFor={id}
      label={label || (perKilo ? '¿Cuánto se paga por kilo?' : '¿Cuánto vale el jornal?')}
      labelClassName="font-semibold text-primary"
      required
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
        >
          $
        </span>
        <MoneyInput
          aria-describedby={`${id}-error`}
          aria-invalid={field.invalid || undefined}
          className="h-12 rounded-xl border-input bg-card pl-9 text-base font-semibold text-foreground"
          data-required-message={perKilo ? 'Escribe la tarifa por kilo.' : 'Escribe el valor del jornal.'}
          id={id}
          name={name}
          onValueChange={onChange}
          placeholder="Ej. 50.000…"
          required
          value={value}
        />
      </div>
    </FormField>
  );
}
