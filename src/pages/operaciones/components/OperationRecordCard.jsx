import {
  CalendarDays,
  ClipboardList,
  Eye,
  MapPin,
  Pencil,
  Sprout,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { formatOperationDate } from '../operationsData.js';

export default function OperationRecordCard({
  onEdit,
  onView,
  record,
  section,
}) {
  const isHarvest = section === 'recoleccion';
  const Icon = isHarvest ? Sprout : ClipboardList;

  return (
    <article className="rounded-2xl border border-[#e5e9e1] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            isHarvest
              ? 'bg-[#e8f2e5] text-[#397248]'
              : 'bg-[#e9f1f3] text-[#426976]'
          }`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words font-semibold text-[#233b2b]">
              {record.trabajador}
            </h2>
            {isHarvest && (
              <span className="rounded-full bg-[#edf5e9] px-2.5 py-1 text-xs font-semibold text-[#426b48]">
                Recolección
              </span>
            )}
          </div>
          <p className="mt-1 break-words text-sm text-[#68766b]">
            {isHarvest ? 'Café recolectado' : record.actividad}
          </p>
          {!isHarvest && (
            <p className="mt-1 text-xs font-medium text-[#748074]">
              Jornal: ${Number(record.tarifaAcordada).toLocaleString('es-CO')}
            </p>
          )}
        </div>
        {isHarvest && (
          <p className="shrink-0 text-right">
            <span className="block text-xl font-bold tabular-nums text-[#214b32]">
              {record.kilogramos}
            </span>
            <span className="text-xs text-[#748074]">kg</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#edf0e9] pt-3 text-sm text-[#68766b]">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="size-4 text-[#849184]" />
          {formatOperationDate(record.fecha)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="size-4 text-[#849184]" />
          {record.lote}
        </span>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          aria-label={`Ver detalle de ${record.trabajador}`}
          className="h-9 rounded-lg border-[#dfe5dc] px-3 text-[#526254] hover:bg-[#f4f6f1]"
          onClick={() => onView(record)}
          type="button"
          variant="outline"
        >
          <Eye aria-hidden="true" />
          <span>Detalle</span>
        </Button>
        <Button
          aria-label={`Editar registro de ${record.trabajador}`}
          className="h-9 rounded-lg bg-[#214b32] px-3 text-white hover:bg-[#173d2b]"
          onClick={() => onEdit(record)}
          type="button"
        >
          <Pencil aria-hidden="true" />
          <span>Editar</span>
        </Button>
      </div>
    </article>
  );
}
