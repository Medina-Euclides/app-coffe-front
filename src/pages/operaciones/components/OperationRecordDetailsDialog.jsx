import {
  CalendarDays,
  ClipboardList,
  MapPin,
  Sprout,
  UserRound,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { formatOperationDate } from '../operationsData.js';

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#65806a]" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-[#748074]">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm font-medium text-[#294533]">
          {value}
        </dd>
      </div>
    </div>
  );
}

export default function OperationRecordDetailsDialog({
  onClose,
  record,
  section,
}) {
  const isHarvest = section === 'recoleccion';

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent className="rounded-2xl p-5 sm:max-w-md sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            Detalle de {isHarvest ? 'recolección' : 'jornada'}
          </DialogTitle>
          <DialogDescription>
            Información del registro de {record.trabajador}.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-4 rounded-xl bg-[#f7f8f3] p-4">
          <DetailItem icon={UserRound} label="Trabajador" value={record.trabajador} />
          <DetailItem icon={CalendarDays} label="Fecha" value={formatOperationDate(record.fecha)} />
          <DetailItem icon={MapPin} label="Lote" value={record.lote} />
          <DetailItem
            icon={isHarvest ? Sprout : ClipboardList}
            label="Actividad"
            value={record.actividad}
          />
          {isHarvest ? (
            <>
              <DetailItem
                icon={Sprout}
                label="Cantidad recolectada"
                value={`${record.kilogramos} kg`}
              />
              <DetailItem
                icon={CalendarDays}
                label="Hora del pesaje"
                value={record.hora}
              />
              <DetailItem
                icon={ClipboardList}
                label="Tarifa acordada"
                value={`$${Number(record.tarifaAcordada).toLocaleString('es-CO')}/kg`}
              />
            </>
          ) : (
            <>
              <DetailItem
                icon={ClipboardList}
                label="Pago acordado"
                value={`$${Number(record.tarifaAcordada).toLocaleString('es-CO')} por jornal`}
              />
              <DetailItem
                icon={CalendarDays}
                label="Estado de liquidación"
                value={record.estadoLiquidacion === 'liquidada' ? 'Liquidada' : 'Pendiente'}
              />
            </>
          )}
        </dl>
        <DialogFooter>
          <Button
            className="h-10 rounded-xl bg-[#214b32] px-4 text-white hover:bg-[#173d2b]"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
