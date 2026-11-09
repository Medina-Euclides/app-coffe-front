import { Link } from 'react-router-dom';
import IconBadge from '#components/shared/IconBadge';
import { cuando } from '../weekSummary.js';

export const enlaceTarjeta =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

// Una fila de «Lo más reciente»: lleva a la página donde está ese registro.
export default function FilaReciente({ item, fechaHoy, fechaAyer }) {
  const { icono, tono, titulo, detalle, valor, dateKey, hora, destino } = item;
  return (
    <li>
      <Link
        className={`flex min-h-16 min-w-0 items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-tint active:bg-secondary sm:px-3 ${enlaceTarjeta}`}
        state={destino.state}
        to={destino.ruta}
      >
        <IconBadge icon={icono} tone={tono} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">{titulo}</span>
          {detalle && (
            <span className="block truncate text-sm text-muted-foreground">{detalle}</span>
          )}
        </span>
        <span className="shrink-0 text-right">
          {valor && (
            <span className="cifra block text-base tabular-nums text-foreground">{valor}</span>
          )}
          <span className="block text-sm first-letter:uppercase text-muted-foreground">
            {cuando(dateKey, fechaHoy, fechaAyer, hora)}
          </span>
        </span>
      </Link>
    </li>
  );
}
