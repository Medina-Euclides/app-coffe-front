import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';

export default function LotCard({
  lot,
  farmName,
  onView,
  onEdit,
  onToggleStatus,
}) {
  const isActive = lot.estado !== 'inactivo';

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[#e2e8de] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-[#263b2c]">
            {lot.nombre || 'Lote sin nombre'}
          </h2>
          <p className="mt-1 break-words text-sm text-[#748074]">
            Pertenece a {farmName}
          </p>
        </div>
        <Badge
          className={
            isActive
              ? 'shrink-0 border-[#d5e8d4] bg-[#edf6eb] text-[#35643b]'
              : 'shrink-0 border-[#e6e7e2] bg-[#f3f4f1] text-[#687168]'
          }
          variant="outline"
        >
          {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#68766b]">
        <span>{lot.variedad || 'Variedad no especificada'}</span>
        <span>
          {lot.hectareas
            ? `${new Intl.NumberFormat('es-CO', {
                maximumFractionDigits: 2,
              }).format(Number(lot.hectareas))} ha`
            : 'Área no especificada'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 border-t border-[#edf0eb] pt-3">
        <Button
          className="min-h-10 rounded-lg text-[#315d3b] hover:bg-[#edf3e9]"
          onClick={() => onView(lot)}
          type="button"
          variant="ghost"
        >
          Consultar
        </Button>
        <Button
          className="min-h-10 rounded-lg text-[#526254] hover:bg-[#f1f3ee]"
          onClick={() => onEdit(lot)}
          type="button"
          variant="ghost"
        >
          Editar
        </Button>
        <Button
          className="min-h-10 rounded-lg text-[#526254] hover:bg-[#f1f3ee]"
          onClick={() => onToggleStatus(lot)}
          type="button"
          variant="ghost"
        >
          {isActive ? 'Desactivar' : 'Activar'}
        </Button>
      </div>
    </article>
  );
}
