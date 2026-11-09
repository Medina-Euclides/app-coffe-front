// Barra de acciones del asistente. En el DOM va Atrás → secundarias → principal
// (orden lógico de teclado). En móvil se apila invertida: la acción principal
// queda arriba a ancho completo y «Atrás» al final como acción discreta.
import { Button } from '#components/ui/button';

const btnBase = 'h-12 min-h-12 shrink-0 rounded-xl px-5 text-base sm:flex-1 sm:basis-0';
const btnPrimario = `${btnBase} bg-primary font-semibold text-primary-foreground hover:bg-primary-hover`;
const btnSecundario = `${btnBase} font-medium`;
const btnAtras = `${btnBase} border-transparent bg-transparent font-medium text-muted-foreground shadow-none hover:bg-secondary hover:text-foreground sm:max-w-32`;

export default function WizardActions({
  onBack,
  backDisabled = false,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
  primaryLabel,
  primaryDisabled = false,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center">
      <Button className={btnAtras} disabled={backDisabled} onClick={onBack} type="button" variant="outline">
        Atrás
      </Button>
      {secondaryLabel && (
        <Button
          className={btnSecundario}
          disabled={secondaryDisabled}
          onClick={onSecondary}
          type="button"
          variant="outline"
        >
          {secondaryLabel}
        </Button>
      )}
      <Button className={btnPrimario} disabled={primaryDisabled} type="submit">
        {primaryLabel}
      </Button>
    </div>
  );
}

// Botón principal suelto (p. ej. «Configurar mi finca» en la bienvenida).
export function WizardPrimaryButton({ className = '', ...props }) {
  return <Button className={`${btnPrimario} ${className}`} {...props} />;
}
