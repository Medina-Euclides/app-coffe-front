import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '#components/ui/button';

export default function FarmCard({ farm, lotCount, onView, onEdit }) {
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[#e2e8de] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3e9] text-[#426b48]"
        >
          <MapPin className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-[#263b2c]">
            {farm.nombre || 'Finca sin nombre'}
          </h2>
          <p className="mt-1 text-sm text-[#748074]">
            {lotCount} {lotCount === 1 ? 'lote' : 'lotes'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[#edf0eb] pt-3">
        <Button
          className="min-h-10 rounded-lg text-[#315d3b] hover:bg-[#edf3e9]"
          onClick={() => onView(farm)}
          type="button"
          variant="ghost"
        >
          Administrar lotes
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
        <Button
          className="min-h-10 rounded-lg text-[#526254] hover:bg-[#f1f3ee]"
          onClick={() => onEdit(farm)}
          type="button"
          variant="ghost"
        >
          Editar finca
        </Button>
      </div>
    </article>
  );
}
