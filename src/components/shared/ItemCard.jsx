import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';

/**
 * Tarjeta genérica de entidad: avatar opcional, título, subtítulo, detalles,
 * badge y fila de acciones. Reutilizada en listados de trabajadores, fincas,
 * actividades y lotes.
 */
export default function ItemCard({
  avatar,
  title,
  subtitle,
  details,
  badge,
  badgeProps = {},
  actions = [],
  className,
}) {
  return (
    <article
      className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 ${className || ''}`}
    >
      <div className="min-w-0">
        {avatar && <div className="mb-3 min-w-0">{avatar}</div>}
        {badge && <Badge variant="outline" {...badgeProps}>{badge}</Badge>}
        <h2 className="mt-3 break-words font-semibold text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{subtitle}</p>
        )}
        {details && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {details}
          </div>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              className={action.className || 'min-h-10 rounded-lg text-primary hover:bg-tint'}
              onClick={() => action.onClick(action.item)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}
