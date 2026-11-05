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
      className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-[#e2e8de] bg-white p-4 shadow-sm sm:p-5 ${className || ''}`}
    >
      <div className="min-w-0">
        {avatar && <div className="mb-3 min-w-0">{avatar}</div>}
        {badge && <Badge variant="outline" {...badgeProps}>{badge}</Badge>}
        <h2 className="mt-3 break-words font-semibold text-[#263b2c]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-5 text-[#748074]">{subtitle}</p>
        )}
        {details && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#68766b]">
            {details}
          </div>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-[#edf0eb] pt-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              className={action.className || 'min-h-10 rounded-lg text-[#315d3b] hover:bg-[#edf3e9]'}
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
