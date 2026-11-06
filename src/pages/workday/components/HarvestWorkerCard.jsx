// Tarjeta de recolección por trabajador: kilos del periodo como dato principal
// y los pesajes en un modal con lote, fecha, hora y finca.
import { useState } from 'react';
import { CalendarDays, ChevronRight, Clock3, MapPin, Scale } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';

const kilograms = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 });
const shortDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

function formatDate(dateKey) {
  if (!dateKey) return 'Sin fecha';
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : shortDate.format(date).replace(/\./g, '');
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${parts[0][0]}${last}`.toLocaleUpperCase('es');
}

export default function HarvestWorkerCard({ worker, periodLabel }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const count = worker.records.length;
  const lastTime = worker.latestRecord.time.slice(0, 5);
  const listId = `pesajes-${worker.workerId}`;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2.5 sm:px-5">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink-soft">
          <Scale aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {count} {count === 1 ? 'pesaje' : 'pesajes'} {periodLabel}
          </span>
        </p>
        <p className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {lastTime ? `Último ${lastTime}` : 'Sin hora'}
        </p>
      </header>

      <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--cereza),transparent_88%)] font-heading text-lg font-bold text-cereza"
          >
            {getInitials(worker.workerName)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-heading text-lg font-semibold leading-tight text-foreground">
              {worker.workerName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {worker.identification ? `C.C. ${worker.identification}` : 'Sin identificación'}
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="cifra block text-3xl leading-none text-foreground tabular-nums sm:text-4xl">
              {kilograms.format(worker.totalKilograms)}
            </span>
            <span className="mt-1 block text-xs font-medium text-muted-foreground">
              kg recogidos
            </span>
          </p>
        </div>

        <button
          aria-haspopup="dialog"
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-muted px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => setDetailOpen(true)}
          type="button"
        >
          <span>Ver pesajes</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>

      <Dialog onOpenChange={setDetailOpen} open={detailOpen}>
        <DialogContent className="max-h-[min(90dvh,40rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-2xl text-foreground">
              {worker.workerName}
            </DialogTitle>
            <DialogDescription>
              {kilograms.format(worker.totalKilograms)} kg en {count}{' '}
              {count === 1 ? 'pesaje' : 'pesajes'} {periodLabel}
            </DialogDescription>
          </DialogHeader>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-ink-soft" id={listId}>
              Pesajes
            </h3>
            <ul aria-labelledby={listId} className="divide-y divide-border/70">
              {worker.records.map((record) => (
                <li
                  className="flex min-w-0 items-center justify-between gap-3 py-3 text-sm"
                  key={record.id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{record.lotName}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays aria-hidden="true" className="size-3" />
                        {formatDate(record.dateKey)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 aria-hidden="true" className="size-3" />
                        {record.time.slice(0, 5) || 'Sin hora'}
                      </span>
                      {record.farmName && (
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin aria-hidden="true" className="size-3 shrink-0" />
                          <span className="truncate">{record.farmName}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-cereza">
                    {kilograms.format(record.quantityKg)} kg
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </DialogContent>
      </Dialog>
    </article>
  );
}
