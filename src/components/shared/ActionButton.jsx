import { Button } from '#components/ui/button';

/**
 * Botón de acción ghost con estilos consistentes para tarjetas de entidad.
 */
export default function ActionButton({ label, onClick, item, ...props }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="min-h-10 rounded-lg text-primary hover:bg-tint"
      onClick={() => onClick(item)}
      {...props}
    >
      {label}
    </Button>
  );
}
