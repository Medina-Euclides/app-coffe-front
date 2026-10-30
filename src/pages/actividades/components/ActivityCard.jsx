import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';

export default function ActivityCard({ activity, onView, onEdit, onDelete }) {
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[#e2e8de] bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        <Badge
          className="border-[#dce8d9] bg-[#f0f5ed] text-[#426548]"
          variant="outline"
        >
          {activity.is_harvest ? 'Recolección' : 'Labor por jornal'}
        </Badge>
        <h2 className="mt-3 break-words font-semibold text-[#263b2c]">
          {activity.name}
        </h2>
        <p className="mt-1 text-sm leading-5 text-[#748074]">
          {activity.description || 'Se puede asignar en una jornada laboral.'}
        </p>
      </div>
      <div className="flex gap-2 border-t border-[#edf0eb] pt-3">
        <Button
          className="min-h-10 rounded-lg text-[#315d3b] hover:bg-[#edf3e9]"
          onClick={() => onView(activity)}
          type="button"
          variant="ghost"
        >
          Consultar
        </Button>
        <Button
          className="min-h-10 rounded-lg text-[#526254] hover:bg-[#f1f3ee]"
          onClick={() => onEdit(activity)}
          type="button"
          variant="ghost"
        >
          Editar
        </Button>
        <Button
          className="min-h-10 rounded-lg text-red-700 hover:bg-red-50"
          onClick={() => onDelete(activity)}
          type="button"
          variant="ghost"
        >
          Eliminar
        </Button>
      </div>
    </article>
  );
}
