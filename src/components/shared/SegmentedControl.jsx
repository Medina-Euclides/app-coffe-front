// Grupo de opciones excluyentes (periodo, tipo de movimiento…). Mismo estilo en toda la app:
// la opción elegida en verde sólido y cada botón de 40 px dentro de un grupo de 48 px.
export default function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div
      aria-label={label}
      className="inline-flex w-full shrink-0 rounded-xl bg-muted p-1 sm:w-fit"
      role="group"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-pressed={selected}
            className={`min-h-10 min-w-0 flex-1 cursor-pointer rounded-lg px-2 text-sm sm:px-4 font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-none ${
              selected
                ? 'bg-primary text-primary-foreground'
                : 'text-ink-soft hover:bg-card hover:text-foreground'
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
