/**
 * Franja con la escala de maduración del grano (verde → pintón → cereza → vino).
 * Es la firma visual de CafeSmart: usa los mismos tokens que las gráficas.
 */
const etapas = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];

export default function MaduracionStripe({ className = 'h-1.5' }) {
  return (
    <div aria-hidden="true" className={`flex w-full ${className}`}>
      {etapas.map((etapa) => (
        <span
          className="flex-1"
          key={etapa}
          style={{ backgroundColor: `var(--${etapa})` }}
        />
      ))}
    </div>
  );
}
