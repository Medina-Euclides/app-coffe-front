// Tarjeta de recolección por trabajador: kilos del periodo como dato principal
// y los pesajes en un modal con lote, fecha, hora y finca.
import { useState } from 'react';
import { CalendarDays, Clock3, MapPin, Scale } from 'lucide-react';
import CardShell, { CardHeaderStrip, CardIdentity } from '#components/shared/CardShell';
import DetailButton from '#components/shared/DetailButton';
import DetailDialog, { AmountHighlight, DetailList } from '#components/shared/DetailDialog';
import IconBadge from '#components/shared/IconBadge';
import { formatoFechaCorta, formatoKilos, plural } from '#lib/formatters';

export default function HarvestWorkerCard({ worker, periodLabel }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const count = worker.records.length;
  const lastTime = worker.latestRecord.time.slice(0, 5);
  const totalKg = formatoKilos(worker.totalKilograms);
  const countLabel = `${plural(count, 'pesaje')} ${periodLabel}`;
  const badge = <IconBadge name={worker.workerName} tone="harvest" />;

  return (
    <CardShell
      header={
        <CardHeaderStrip
          aside={
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <Clock3 aria-hidden="true" className="size-4" />
              {lastTime ? `Último ${lastTime}` : 'Sin hora'}
            </span>
          }
          icon={Scale}
        >
          {countLabel}
        </CardHeaderStrip>
      }
    >
      <CardIdentity
        aside={
          <p className="shrink-0 text-right">
            <span className="cifra block text-2xl leading-none tabular-nums text-foreground">
              {totalKg}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">kg</span>
          </p>
        }
        badge={badge}
        title={worker.workerName}
      >
        <p className="text-sm text-muted-foreground">
          {worker.identification ? `C.C. ${worker.identification}` : 'Sin identificación'}
        </p>
      </CardIdentity>

      <DetailButton icon={Scale} onClick={() => setDetailOpen(true)}>
        Pesajes
      </DetailButton>

      {detailOpen && (
        <DetailDialog
          badge={badge}
          description={countLabel}
          onOpenChange={setDetailOpen}
          open
          title={worker.workerName}
        >
          <AmountHighlight label="Kilos recogidos" value={`${totalKg} kg`} />
          <DetailList empty="No hay pesajes en este periodo." title="Pesajes">
            {worker.records.map((record) => (
              <li className="flex min-w-0 items-center justify-between gap-3 py-3" key={record.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{record.lotName}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="size-4" />
                      {formatoFechaCorta(record.dateKey)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 aria-hidden="true" className="size-4" />
                      {record.time.slice(0, 5) || 'Sin hora'}
                    </span>
                    {record.farmName && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin aria-hidden="true" className="size-4 shrink-0" />
                        <span className="truncate">{record.farmName}</span>
                      </span>
                    )}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums text-cereza">
                  {formatoKilos(record.quantityKg)} kg
                </p>
              </li>
            ))}
          </DetailList>
        </DetailDialog>
      )}
    </CardShell>
  );
}
