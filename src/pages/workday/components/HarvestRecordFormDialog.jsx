import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  Scale,
  UserRound,
} from 'lucide-react';
import { api } from '#services/api';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

const MAX_KILOGRAMS = 9_999_999.999;

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLocalTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
}

function formatWorkdayDate(value) {
  if (!value) return 'Fecha sin registrar';
  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha sin registrar'
    : dateFormatter.format(date);
}

function getWorkerName(workday) {
  if (typeof workday.worker === 'object' && workday.worker !== null) {
    const worker = workday.worker;
    return (
      worker.nombre ||
      worker.name ||
      worker.full_name ||
      [worker.first_name, worker.last_name].filter(Boolean).join(' ')
    );
  }
  return workday.worker_name || workday.nombre_trabajador || '';
}

function getWorkerIdentification(workday) {
  const worker =
    typeof workday.worker === 'object' && workday.worker !== null
      ? workday.worker
      : null;
  return (
    worker?.identification ||
    worker?.cedula ||
    workday.worker_identification ||
    ''
  );
}

function getHarvestDetails(workdays, activities, today) {
  const harvestActivityIds = new Set(
    activities
      .filter((activity) => activity.is_harvest)
      .map((activity) => String(activity.id)),
  );

  return workdays.flatMap((workday) => {
    const date = workday.date || '';
    const dateKey = String(date).slice(0, 10);
    if (!workday.id || !dateKey || dateKey > today) return [];

    const workerId =
      typeof workday.worker === 'object' && workday.worker !== null
        ? workday.worker.id
        : workday.worker;
    const workerName = getWorkerName(workday);
    if (!workerId || !workerName || workday.worker?.is_active === false) {
      return [];
    }

    const details = Array.isArray(workday.details) ? workday.details : [];
    return details.flatMap((detail) => {
      if (!detail.id || !harvestActivityIds.has(String(detail.activity_type))) {
        return [];
      }

      const lotName = detail.lot_name || 'Lote sin nombre';
      const farmName = detail.farm_name || '';
      const activity = activities.find(
        (item) => String(item.id) === String(detail.activity_type),
      );

      return [
        {
          id: String(detail.id),
          workdayId: String(workday.id),
          workerId: String(workerId),
          workerName,
          workerIdentification: getWorkerIdentification(workday),
          date,
          dateKey,
          activityName: detail.activity_name || activity?.name || 'Recolección',
          lotName,
          farmName,
          paymentMode: workday.payment_mode,
          rate: Number(workday.agreed_rate) || 0,
          existingRecords: Array.isArray(detail.harvest_records)
            ? detail.harvest_records
            : [],
        },
      ];
    });
  });
}

function SelectField({ children, htmlFor, label }) {
  return (
    <div className="min-w-0 space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-wide text-[#244b38]"
        htmlFor={htmlFor}
      >
        {label} <span aria-hidden="true">*</span>
      </label>
      {children}
    </div>
  );
}

export default function HarvestRecordFormDialog({
  open,
  onOpenChange,
  onSave,
}) {
  const [workdays, setWorkdays] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [detailId, setDetailId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [time, setTime] = useState(getLocalTime);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [today] = useState(getLocalDate);

  useEffect(() => {
    let active = true;
    Promise.all([api.workdays.list(), api.activities.list()])
      .then(([loadedWorkdays, loadedActivities]) => {
        if (!active) return;
        setWorkdays(loadedWorkdays);
        setActivities(loadedActivities);
        setLoadError('');
      })
      .catch((loadError) => {
        if (!active) return;
        console.error('Error al cargar jornadas de recolección:', loadError);
        setLoadError(
          loadError.message ||
            'No se pudieron cargar las jornadas de actividades de recolección.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  const harvestDetails = useMemo(
    () => getHarvestDetails(workdays, activities, today),
    [activities, today, workdays],
  );

  const workers = useMemo(() => {
    const uniqueWorkers = new Map();
    for (const detail of harvestDetails) {
      if (!uniqueWorkers.has(detail.workerId)) {
        uniqueWorkers.set(detail.workerId, detail);
      }
    }
    return [...uniqueWorkers.values()].sort((first, second) =>
      first.workerName.localeCompare(second.workerName, 'es'),
    );
  }, [harvestDetails]);

  const selectedWorker = workers.find((worker) => worker.workerId === workerId);
  const workerDetails = harvestDetails.filter(
    (detail) => detail.workerId === workerId,
  );
  const selectedDetail = workerDetails.find((detail) => detail.id === detailId);

  const handleWorkerChange = (nextWorkerId) => {
    setWorkerId(nextWorkerId);
    setDetailId('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedWorker || !selectedDetail) {
      setError('Selecciona un recolector y el lote correspondiente.');
      document
        .getElementById(!selectedWorker ? 'harvest-worker' : 'harvest-detail')
        ?.focus();
      return;
    }

    const kilograms = Number(quantityKg);
    if (
      !Number.isFinite(kilograms) ||
      kilograms <= 0 ||
      kilograms > MAX_KILOGRAMS
    ) {
      setError('Ingresa una cantidad mayor que cero, con máximo 3 decimales.');
      document.getElementById('harvest-quantity')?.focus();
      return;
    }

    if (!time) {
      setError('Selecciona la hora en que se recibió el café.');
      document.getElementById('harvest-time')?.focus();
      return;
    }

    setSaving(true);
    try {
      const record = await api.harvestRecords.create({
        workday_detail: selectedDetail.id,
        quantity_kg: kilograms.toFixed(3),
        time: `${time}:00`,
      });
      await onSave(record, selectedDetail);
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al registrar el pesaje:', saveError);
      setError(saveError.message || 'No se pudo registrar el pesaje.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl border-[#e4e9e1] p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[#e9ede8] bg-[#f7f9f6] px-5 py-5 pr-14 sm:px-7">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#173d30] text-white">
              <Scale aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-[#183d2b] sm:text-xl">
                Registrar Pesaje
              </DialogTitle>
              <DialogDescription className="mt-1 leading-5">
                Detalle de recolección vinculado a la jornada del día.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          {loading ? (
            <p
              aria-live="polite"
              className="flex items-center justify-center gap-2 py-12 text-sm text-[#68766b]"
              role="status"
            >
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Cargando jornadas de recolección…
            </p>
          ) : loadError ? (
            <div className="space-y-4 py-2">
              <p aria-live="polite" className="text-sm text-red-700" role="alert">
                {loadError}
              </p>
              <Button
                className="min-h-10 rounded-xl"
                onClick={() => {
                  setLoading(true);
                  setRetry((attempt) => attempt + 1);
                }}
                type="button"
                variant="outline"
              >
                Intentar de nuevo
              </Button>
            </div>
          ) : harvestDetails.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <h3 className="font-semibold text-[#263b2c]">
                No hay jornadas de recolección disponibles
              </h3>
              <p className="mx-auto max-w-md text-sm leading-6 text-[#748074]">
                Registra primero una jornada con una actividad marcada como
                recolección. El pesaje se asociará a su lote y fecha.
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <SelectField htmlFor="harvest-worker" label="Recolector en báscula">
                <Select
                  onValueChange={handleWorkerChange}
                  value={workerId}
                >
                  <SelectTrigger
                    aria-label="Recolector en báscula"
                    className="h-13 w-full rounded-xl border-[#d1ddd2] bg-white px-3 text-base font-semibold text-[#173d30]"
                    id="harvest-worker"
                    name="worker"
                  >
                    <UserRound
                      aria-hidden="true"
                      className="size-5 shrink-0 text-[#74877a]"
                    />
                    <SelectValue
                      className="min-w-0 flex-1 truncate text-left font-semibold text-[#173d30]"
                      placeholder="Selecciona un recolector…"
                    >
                      {(value) => {
                        const worker = workers.find(
                          (option) => option.workerId === value,
                        );
                        return worker
                          ? `${worker.workerName}${
                              worker.workerIdentification
                                ? ` · C.C. ${worker.workerIdentification}`
                                : ''
                            }`
                          : undefined;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem
                        className="rounded-lg py-2.5 text-base font-medium text-[#254334] data-highlighted:bg-[#e8f3e8] data-highlighted:text-[#173d30] data-selected:font-semibold"
                        key={worker.workerId}
                        value={worker.workerId}
                      >
                        {worker.workerName}
                        {worker.workerIdentification
                          ? ` · C.C. ${worker.workerIdentification}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectField>

              <SelectField htmlFor="harvest-detail" label="Lote de recolección">
                <Select
                  onValueChange={(value) => {
                    setDetailId(value);
                    setError('');
                  }}
                  value={detailId}
                  disabled={!workerId}
                >
                  <SelectTrigger
                    aria-label="Lote de recolección"
                    className="h-13 w-full rounded-xl border-[#d1ddd2] bg-white px-3 text-base font-semibold text-[#173d30]"
                    id="harvest-detail"
                    name="workday_detail"
                  >
                    <SelectValue
                      className="min-w-0 flex-1 truncate text-left font-semibold text-[#173d30]"
                      placeholder={
                        workerId
                          ? 'Selecciona el lote y la jornada…'
                          : 'Selecciona primero un recolector…'
                      }
                    >
                      {(value) => {
                        const detail = workerDetails.find(
                          (option) => option.id === value,
                        );
                        return detail
                          ? `${detail.lotName}${
                              detail.farmName ? ` · ${detail.farmName}` : ''
                            } · ${formatWorkdayDate(detail.date)}`
                          : undefined;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {workerDetails.map((detail) => (
                      <SelectItem
                        className="rounded-lg py-2.5 text-base font-medium text-[#254334] data-highlighted:bg-[#e8f3e8] data-highlighted:text-[#173d30] data-selected:font-semibold"
                        key={detail.id}
                        value={detail.id}
                      >
                        {detail.lotName}
                        {detail.farmName ? ` · ${detail.farmName}` : ''}
                        {' · '}
                        {formatWorkdayDate(detail.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {workerId && workerDetails.length === 0 && (
                  <p className="text-xs leading-5 text-[#748074]">
                    Este recolector no tiene jornadas de recolección disponibles.
                  </p>
                )}
              </SelectField>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-[#244b38]"
                    htmlFor="harvest-quantity"
                  >
                    Kilogramos (kg) <span aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Scale
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#74877a]"
                    />
                    <Input
                      autoComplete="off"
                      className="h-13 rounded-xl border-[#d1ddd2] bg-white pl-11 pr-12 text-base font-semibold text-[#173d30]"
                      id="harvest-quantity"
                      inputMode="decimal"
                      max={MAX_KILOGRAMS}
                      min="0.001"
                      name="quantity_kg"
                      onChange={(event) => setQuantityKg(event.target.value)}
                      placeholder="Ej. 35.5…"
                      required
                      step="0.001"
                      type="number"
                      value={quantityKg}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold uppercase text-[#74877a]"
                    >
                      kg
                    </span>
                  </div>
                </div>

                <div className="min-w-0 space-y-2">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide text-[#244b38]"
                    htmlFor="harvest-time"
                  >
                    Hora de entrega <span aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Clock3
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#74877a]"
                    />
                    <Input
                      autoComplete="off"
                      className="h-13 rounded-xl border-[#d1ddd2] bg-white pl-11 text-base font-medium text-[#173d30]"
                      id="harvest-time"
                      name="time"
                      onChange={(event) => setTime(event.target.value)}
                      required
                      type="time"
                      value={time}
                    />
                  </div>
                </div>
              </div>

              {selectedDetail && (
                <section
                  aria-label="Resumen de la jornada vinculada"
                  className="space-y-3 rounded-2xl border border-[#e1e9e1] bg-[#f5f8f5] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e8e0] pb-3">
                    <p className="flex min-w-0 items-center gap-2 text-sm text-[#244b38]">
                      <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[#28745b]"
                      />
                      <span className="truncate">
                        <span className="font-semibold">Jornada vinculada:</span>{' '}
                        {selectedDetail.activityName}
                      </span>
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c2ebdc] bg-[#effbf6] px-3 py-1 text-xs font-medium text-[#19805d]">
                      <CalendarDays aria-hidden="true" className="size-3.5" />
                      {formatWorkdayDate(selectedDetail.date)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="flex items-center gap-2 text-[#748074]">
                      <span className="font-medium">Modalidad:</span>
                      <span className="font-semibold text-[#244b38]">
                        {selectedDetail.paymentMode === 'kg'
                          ? 'Por kilogramo'
                          : 'Por jornal'}
                      </span>
                    </p>
                    <p className="rounded-lg border border-[#e1e9e1] bg-white px-3 py-1.5 text-xs text-[#748074]">
                      Tarifa:{' '}
                      <span className="font-semibold text-[#244b38]">
                        {currencyFormatter.format(selectedDetail.rate)}
                        {selectedDetail.paymentMode === 'kg' ? ' / kg' : ' / jornal'}
                      </span>
                    </p>
                  </div>
                  {selectedDetail.existingRecords.length > 0 && (
                    <p className="text-xs text-[#68766b]">
                      Esta jornada ya tiene {selectedDetail.existingRecords.length}{' '}
                      {selectedDetail.existingRecords.length === 1
                        ? 'pesaje registrado'
                        : 'pesajes registrados'}
                      . Puedes agregar otro.
                    </p>
                  )}
                </section>
              )}

              {error && (
                <p
                  aria-live="polite"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-800"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <DialogFooter className="flex-col-reverse gap-2 border-t border-[#e9ede8] pt-4 sm:flex-row">
                <Button
                  className="min-h-11 rounded-xl text-[#68766b]"
                  disabled={saving}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
                <Button
                  className="min-h-11 rounded-xl bg-[#1d5140] px-5 text-white hover:bg-[#173d30]"
                  disabled={saving || !selectedDetail}
                  type="submit"
                >
                  {saving ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <Scale aria-hidden="true" className="size-5" />
                  )}
                  {saving ? 'Guardando…' : 'Guardar pesaje'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
