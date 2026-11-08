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
import { FormAlert, FormField } from '#components/shared/FormFeedback';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { formatoDinero, formatoFechaAnio, hoy } from '#lib/formatters';
import { getHarvestDetails } from '#lib/domain/workdays';

const MAX_KILOGRAMS = 9_999_999.999;

function getLocalTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
}

function SelectField({ feedback, htmlFor, ...props }) {
  return (
    <FormField
      {...feedback.field(htmlFor)}
      htmlFor={htmlFor}
      labelClassName="font-semibold text-primary"
      required
      {...props}
    />
  );
}

export default function HarvestRecordFormDialog({
  open,
  onOpenChange,
  onSave,
}) {
  const [workdays, setWorkdays] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [workdayId, setWorkdayId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [lotId, setLotId] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [time, setTime] = useState(getLocalTime);
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [today] = useState(hoy);

  useEffect(() => {
    let active = true;
    Promise.all([api.workdays.list(), api.activities.list(), api.lots.list()])
      .then(([loadedWorkdays, loadedActivities, loadedLots]) => {
        if (!active) return;
        setWorkdays(loadedWorkdays);
        setActivities(loadedActivities);
        setLots(loadedLots);
        setLoadError('');
      })
      .catch((loadError) => {
        if (!active) return;
        console.error('Error al cargar jornadas de recolección:', loadError);
        setLoadError(
          loadError.message ||
            'No se pudieron cargar las jornadas, actividades o lotes de recolección.',
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

  const harvestWorkdays = useMemo(() => {
    const uniqueWorkdays = new Map();
    for (const detail of harvestDetails) {
      if (!uniqueWorkdays.has(detail.workdayId)) {
        uniqueWorkdays.set(detail.workdayId, detail);
      }
    }
    return [...uniqueWorkdays.values()].sort((first, second) =>
      second.dateKey.localeCompare(first.dateKey),
    );
  }, [harvestDetails]);

  const workers = useMemo(() => {
    const uniqueWorkers = new Map();
    for (const detail of harvestDetails) {
      if (detail.workdayId !== workdayId) continue;
      if (!uniqueWorkers.has(detail.workerId)) {
        uniqueWorkers.set(detail.workerId, detail);
      }
    }
    return [...uniqueWorkers.values()].sort((first, second) =>
      first.workerName.localeCompare(second.workerName, 'es'),
    );
  }, [harvestDetails, workdayId]);

  const selectedWorkday = harvestWorkdays.find(
    (workday) => workday.workdayId === workdayId,
  );
  const selectedWorker = workers.find((worker) => worker.workerId === workerId);
  const availableLots = lots
    .filter(
      (lot) =>
        lot.is_active !== false &&
        String(lot.fincaId ?? lot.id_farm) === selectedWorkday?.farmId,
    )
    .sort((first, second) =>
      (first.nombre || first.name || '').localeCompare(
        second.nombre || second.name || '',
        'es',
      ),
    );
  const workerDetails = harvestDetails.filter(
    (detail) =>
      detail.workdayId === workdayId && detail.workerId === workerId,
  );
  const selectedLot = availableLots.find(
    (lot) => String(lot.id) === lotId,
  );
  const selectedDetail = workerDetails.find(
    (detail) => detail.lotId === lotId,
  );

  const handleWorkdayChange = (nextWorkdayId) => {
    setWorkdayId(nextWorkdayId);
    setWorkerId('');
    setLotId('');
    ['harvest-workday', 'harvest-worker', 'harvest-lot'].forEach(feedback.clearField);
    feedback.clearFormError();
  };

  const handleWorkerChange = (nextWorkerId) => {
    setWorkerId(nextWorkerId);
    setLotId('');
    feedback.clearField('harvest-worker');
    feedback.clearField('harvest-lot');
    feedback.clearFormError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();

    const kilograms = Number(quantityKg);
    // Se marcan todos los campos que faltan; el primero recibe el foco.
    const missing = [
      !selectedWorkday && ['harvest-workday', 'Elige la jornada de recolección.'],
      selectedWorkday &&
        !selectedWorker && ['harvest-worker', 'Elige quién recogió el café.'],
      selectedWorker &&
        !selectedLot && ['harvest-lot', 'Elige el lote donde se recogió.'],
      (!Number.isFinite(kilograms) || kilograms <= 0 || kilograms > MAX_KILOGRAMS) && [
        'harvest-quantity',
        'Escribe los kilos recogidos, mayor que cero.',
      ],
      !time && ['harvest-time', 'Elige la hora en que se entregó el café.'],
    ].filter(Boolean);
    if (missing.length) {
      missing.forEach(([key, message]) => feedback.setFieldError(key, message));
      return;
    }

    setSaving(true);
    try {
      let detailForRecord = selectedDetail;
      if (!detailForRecord) {
        const createdDetail = await api.workdayDetails.create({
          workday_worker: selectedWorker.participantId,
          activity_type: selectedWorker.activityTypeId,
          lot: selectedLot.id,
        });
        const apiDetail = {
          ...createdDetail,
          activity_type:
            createdDetail.activity_type ?? selectedWorker.activityTypeId,
          activity_name:
            createdDetail.activity_name || selectedWorker.activityName,
          activity_is_harvest: true,
          lot: selectedLot.id,
          lot_name: selectedLot.nombre || selectedLot.name || 'Lote',
          harvest_records: [],
        };
        setWorkdays((currentWorkdays) =>
          currentWorkdays.map((workday) =>
            String(workday.id) !== selectedWorkday.workdayId
              ? workday
              : {
                  ...workday,
                  participants: workday.participants.map((participation) =>
                    String(participation.id) !== selectedWorker.participantId
                      ? participation
                      : {
                          ...participation,
                          details: [
                            ...(participation.details || []),
                            apiDetail,
                          ],
                        },
                  ),
                },
          ),
        );
        detailForRecord = {
          ...selectedWorker,
          ...apiDetail,
          id: String(apiDetail.id),
          lotId: String(selectedLot.id),
          lotName: selectedLot.nombre || selectedLot.name || 'Lote',
          activityName: apiDetail.activity_name,
          activityTypeId: String(
            apiDetail.activity_type,
          ),
          existingRecords: [],
        };
      }
      const record = await api.harvestRecords.create({
        workday_detail: detailForRecord.id,
        quantity_kg: kilograms.toFixed(3),
        time: `${time}:00`,
      });
      await onSave(record, detailForRecord);
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al registrar el pesaje:', saveError);
      feedback.setFormError(
        saveError.message ||
          'No se pudo registrar el pesaje. Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl border-border p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 bg-muted px-5 py-5 pr-14 sm:px-7">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Scale aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-2xl text-foreground sm:text-[1.75rem]">
                Registrar Pesaje
              </DialogTitle>
              <DialogDescription className="mt-1 leading-5">
                Anota los kilos que entregó cada recolector.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          {loading ? (
            <p
              aria-live="polite"
              className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
              role="status"
            >
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Cargando jornadas de recolección…
            </p>
          ) : loadError ? (
            <div className="space-y-4 py-2">
              <p aria-live="polite" className="text-sm text-destructive" role="alert">
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
              <h3 className="font-semibold text-foreground">
                No hay jornadas de recolección disponibles
              </h3>
              <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
                Registra primero una jornada con una actividad marcada como
                recolección. El pesaje se asociará a su lote y fecha.
              </p>
            </div>
          ) : (
            <form
              className="space-y-5"
              {...feedback.formProps}
              onSubmit={handleSubmit}
            >
              <SelectField feedback={feedback} htmlFor="harvest-workday" label="¿De qué jornada?">
                <Select
                  onValueChange={handleWorkdayChange}
                  value={workdayId}
                >
                  <SelectTrigger
                    aria-label="¿De qué jornada?"
                    aria-describedby="harvest-workday-error"
                    aria-invalid={feedback.field('harvest-workday').invalid || undefined}
                    className="h-13 w-full rounded-xl border-input bg-card px-3 text-base font-semibold text-foreground"
                    id="harvest-workday"
                    name="workday"
                  >
                    <CalendarDays
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground"
                    />
                    <SelectValue
                      className="min-w-0 flex-1 truncate text-left font-semibold text-foreground"
                      placeholder="Selecciona una jornada…"
                    >
                      {(value) => {
                        const workday = harvestWorkdays.find(
                          (option) => option.workdayId === value,
                        );
                        return workday
                          ? workday.workdayLabel
                          : undefined;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {harvestWorkdays.map((workday) => (
                      <SelectItem
                        className="rounded-lg py-2.5 text-base font-medium text-foreground data-highlighted:bg-tint data-highlighted:text-foreground data-selected:font-semibold"
                        key={workday.workdayId}
                        value={workday.workdayId}
                      >
                        {workday.workdayLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectField>

              <SelectField feedback={feedback} htmlFor="harvest-worker" label="¿Quién entregó?">
                <Select
                  onValueChange={handleWorkerChange}
                  value={workerId}
                  disabled={!workdayId}
                >
                  <SelectTrigger
                    aria-label="¿Quién entregó?"
                    aria-describedby="harvest-worker-error"
                    aria-invalid={feedback.field('harvest-worker').invalid || undefined}
                    className="h-13 w-full rounded-xl border-input bg-card px-3 text-base font-semibold text-foreground"
                    id="harvest-worker"
                    name="worker"
                  >
                    <UserRound
                      aria-hidden="true"
                      className="size-5 shrink-0 text-muted-foreground"
                    />
                    <SelectValue
                      className="min-w-0 flex-1 truncate text-left font-semibold text-foreground"
                      placeholder={
                        workdayId
                          ? 'Selecciona un trabajador…'
                          : 'Selecciona primero una jornada…'
                      }
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
                        className="rounded-lg py-2.5 text-base font-medium text-foreground data-highlighted:bg-tint data-highlighted:text-foreground data-selected:font-semibold"
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
                {workdayId && workers.length === 0 && (
                  <p className="text-xs leading-5 text-muted-foreground">
                    Esta jornada no tiene trabajadores con detalles de recolección disponibles.
                  </p>
                )}
              </SelectField>

              <SelectField feedback={feedback} htmlFor="harvest-lot" label="¿De qué lote?">
                <Select
                  onValueChange={(value) => {
                    setLotId(value);
                    feedback.clearField('harvest-lot');
                    feedback.clearFormError();
                  }}
                  value={lotId}
                  disabled={!workerId || availableLots.length === 0}
                >
                  <SelectTrigger
                    aria-label="¿De qué lote?"
                    aria-describedby="harvest-lot-error"
                    aria-invalid={feedback.field('harvest-lot').invalid || undefined}
                    className="h-13 w-full rounded-xl border-input bg-card px-3 text-base font-semibold text-foreground"
                    id="harvest-lot"
                    name="lot"
                  >
                    <SelectValue
                      className="min-w-0 flex-1 truncate text-left font-semibold text-foreground"
                      placeholder={
                        workerId
                          ? 'Selecciona el lote…'
                          : 'Selecciona primero un trabajador…'
                      }
                    >
                      {(value) => {
                        const lot = availableLots.find(
                          (option) => String(option.id) === value,
                        );
                        return lot
                          ? lot.nombre || lot.name || 'Lote'
                          : undefined;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableLots.map((lot) => (
                      <SelectItem
                        className="rounded-lg py-2.5 text-base font-medium text-foreground data-highlighted:bg-tint data-highlighted:text-foreground data-selected:font-semibold"
                        key={lot.id}
                        value={String(lot.id)}
                      >
                        {lot.nombre || lot.name || 'Lote'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {workdayId && selectedWorkday && availableLots.length === 0 && (
                  <p className="text-xs leading-5 text-muted-foreground">
                    No hay lotes activos disponibles en la finca de esta jornada.
                  </p>
                )}
              </SelectField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  {...feedback.field('harvest-quantity')}
                  htmlFor="harvest-quantity"
                  label="¿Cuántos kilos? (kg)"
                  labelClassName="font-semibold text-primary"
                  required
                >
                  <div className="relative">
                    <Scale
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      autoComplete="off"
                      className="h-13 rounded-xl border-input bg-card pl-11 pr-12 text-base font-semibold text-foreground"
                      aria-describedby="harvest-quantity-error"
                      aria-invalid={feedback.field('harvest-quantity').invalid || undefined}
                      data-required-message="Escribe los kilos recogidos."
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
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground"
                    >
                      kg
                    </span>
                  </div>
                </FormField>

                <FormField
                  {...feedback.field('harvest-time')}
                  htmlFor="harvest-time"
                  label="¿A qué hora?"
                  labelClassName="font-semibold text-primary"
                  required
                >
                  <div className="relative">
                    <Clock3
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      autoComplete="off"
                      className="h-13 rounded-xl border-input bg-card pl-11 text-base font-medium text-foreground"
                      aria-describedby="harvest-time-error"
                      aria-invalid={feedback.field('harvest-time').invalid || undefined}
                      data-required-message="Elige la hora en que se entregó el café."
                      id="harvest-time"
                      name="time"
                      onChange={(event) => setTime(event.target.value)}
                      required
                      type="time"
                      value={time}
                    />
                  </div>
                </FormField>
              </div>

              {selectedWorker && selectedLot && (
                <section
                  aria-label="Resumen de la jornada vinculada"
                  className="space-y-3 rounded-2xl border border-border bg-muted p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <p className="flex min-w-0 items-center gap-2 text-sm text-primary">
                      <CalendarDays
                        aria-hidden="true"
                        className="size-4 shrink-0 text-leaf"
                      />
                      <span className="truncate">
                        <span className="font-semibold">Jornada vinculada:</span>{' '}
                        {selectedDetail?.activityName ||
                          selectedWorker.activityName}
                      </span>
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf-soft px-3 py-1 text-xs font-medium text-leaf">
                      <CalendarDays aria-hidden="true" className="size-3.5" />
                      {formatoFechaAnio(selectedWorker.date)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Modalidad:</span>
                      <span className="font-semibold text-primary">
                        {selectedWorker.paymentMode === 'kg'
                          ? 'Por kilogramo'
                          : 'Por jornal'}
                      </span>
                    </p>
                    <p className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                      Tarifa:{' '}
                      <span className="font-semibold text-primary">
                        {formatoDinero(selectedWorker.rate)}
                        {selectedWorker.paymentMode === 'kg'
                          ? ' / kg'
                          : ' / jornal'}
                      </span>
                    </p>
                  </div>
                  {(selectedDetail?.existingRecords.length || 0) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Este lote ya tiene {selectedDetail.existingRecords.length}{' '}
                      {selectedDetail.existingRecords.length === 1
                        ? 'pesaje registrado'
                        : 'pesajes registrados'}
                      . Puedes agregar otro.
                    </p>
                  )}
                </section>
              )}

              <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />

              <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row">
                <Button
                  className="min-h-11 rounded-xl text-muted-foreground"
                  disabled={saving}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancelar
                </Button>
                <Button
                  className="min-h-11 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary-hover"
                  disabled={saving || !selectedLot}
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
