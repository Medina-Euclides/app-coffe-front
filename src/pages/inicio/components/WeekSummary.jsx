// Indicadores de la semana (kilos y jornales); cada uno lleva a Jornadas ya filtrado.
import { ChevronRight, Cherry, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatoKilos, plural } from '#lib/formatters';
import { enlaceTarjeta } from './FilaReciente.jsx';

export default function WeekSummary({ resumen }) {
  const indicadores = [
    {
      etiqueta: 'Kilos',
      valor: resumen && formatoKilos(resumen.kilos, 1),
      unidad: 'kg',
      detalle: resumen && plural(resumen.pesajes, 'pesaje', 'pesajes'),
      color: 'text-cereza',
      icono: Cherry,
      destino: { section: 'harvest', period: 'week', modality: 'all' },
    },
    {
      etiqueta: 'Jornales',
      valor: resumen && formatoKilos(resumen.jornales, 1),
      unidad: '',
      detalle: resumen && `en ${plural(resumen.jornadas, 'jornada', 'jornadas')}`,
      color: 'text-primary',
      icono: ClipboardList,
      destino: { section: 'workdays', period: 'week', modality: 'jornal' },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {indicadores.map(({ etiqueta, valor, unidad, detalle, color, icono: Icono, destino }) => (
        <Link
          aria-busy={!resumen}
          className={`flex min-h-36 min-w-0 flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-tint active:bg-secondary sm:p-5 ${enlaceTarjeta}`}
          key={etiqueta}
          state={destino}
          to="/jornada-laboral"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icono aria-hidden="true" className={`size-4 shrink-0 ${color}`} />
            {etiqueta}
          </span>
          <span className={`cifra mt-3 break-words text-4xl leading-none tabular-nums sm:text-5xl ${color}`}>
            {valor ?? '–'}
            {unidad && valor != null && <span className="ml-1 text-lg sm:text-xl">{unidad}</span>}
          </span>
          <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm text-muted-foreground">
            <span className="min-w-0 truncate">{detalle ?? 'Cargando…'}</span>
            <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
          </span>
        </Link>
      ))}
    </div>
  );
}
