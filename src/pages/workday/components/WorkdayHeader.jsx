import { Plus, Scale } from 'lucide-react';
import { Button } from '#components/ui/button';

export default function WorkdayHeader({
  visibleCount,
  periodLabel,
  calculatedTotal,
  onAddWorkday,
  onAddHarvest,
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-[#183d2b] sm:text-3xl">
          Jornadas Laborales
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-[#738076]">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-[#57a276]"
          />
          <span>
            {visibleCount} {visibleCount === 1 ? 'jornada' : 'jornadas'}{' '}
            visualizadas {periodLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span>{calculatedTotal} calculado</span>
        </p>
      </div>

      <div className="flex flex-col gap-2 min-[440px]:flex-row sm:shrink-0">
        <Button
          className="h-10 rounded-xl border border-[#dbe9dc] bg-[#e8f3e8] px-4 text-[#254d37] hover:bg-[#dcebdc]"
          onClick={onAddHarvest}
          type="button"
          variant="outline"
        >
          <Scale aria-hidden="true" className="size-4" />
          Agregar pesaje
        </Button>
        <Button
          className="h-10 rounded-xl bg-[#173d30] px-4 text-white hover:bg-[#214b32]"
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
