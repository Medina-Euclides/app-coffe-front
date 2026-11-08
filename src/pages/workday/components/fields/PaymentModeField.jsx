// Modalidad de pago (jornal o kilo) como dos botones grandes. El pago por kilo
// solo se habilita para actividades de recolección.
import { cn } from '#lib/utils';
import { PAYMENT_MODES } from '#lib/constants';

const options = [
  { value: PAYMENT_MODES.JOURNAL, label: 'Por jornal' },
  { value: PAYMENT_MODES.KILOGRAM, label: 'Pago por kg' },
];

export default function PaymentModeField({
  name,
  value,
  onChange,
  kilogramAvailable,
  showKilogramHint = false,
  className,
}) {
  return (
    <fieldset className={cn('min-w-0 space-y-2', className)}>
      <legend className="text-sm font-semibold text-primary">
        Modalidad de pago <span aria-hidden="true">*</span>
      </legend>
      <div className="grid h-12 grid-cols-2 rounded-xl border border-border bg-muted p-1">
        {options.map((option) => {
          const disabled = option.value === PAYMENT_MODES.KILOGRAM && !kilogramAvailable;
          return (
            <label
              className={cn(
                'flex items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                disabled
                  ? 'cursor-not-allowed text-subtle'
                  : 'cursor-pointer text-ink-soft has-[:checked]:bg-primary has-[:checked]:text-primary-foreground',
              )}
              key={option.value}
            >
              <input
                checked={value === option.value}
                className="sr-only"
                disabled={disabled}
                name={name}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {showKilogramHint && !kilogramAvailable && (
        <p className="text-xs leading-5 text-muted-foreground">
          El pago por kg está disponible para actividades de recolección.
        </p>
      )}
    </fieldset>
  );
}
