import { Plus, Scale } from 'lucide-react';
import { Button } from '#components/ui/button';
import PageTitle from '#components/shared/PageTitle';

export default function WorkdayHeader({
  title = 'Jornadas Laborales',
  visibleCount,
  itemLabel = 'jornada',
  secondaryCount = '',
  countVerb = 'visualizadas',
  periodLabel,
  calculatedTotal,
  totalLabel = 'calculado',
  onAddWorkday,
  onAddHarvest,
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <PageTitle>
          {title}
        </PageTitle>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-leaf"
          />
          <span>
            {visibleCount} {visibleCount === 1 ? itemLabel : `${itemLabel}s`}
            {secondaryCount && ` con ${secondaryCount}`} {countVerb} {periodLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span>{calculatedTotal} {totalLabel}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2 min-[440px]:flex-row sm:shrink-0">
        <Button
          className="h-11 rounded-xl border border-border bg-tint px-4 text-primary hover:bg-secondary"
          onClick={onAddHarvest}
          type="button"
          variant="outline"
        >
          <Scale aria-hidden="true" className="size-4" />
          Agregar pesaje
        </Button>
        <Button
          className="h-11 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary-hover"
          onClick={onAddWorkday}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Agregar jornada
        </Button>
      </div>
    </header>
  );
}
