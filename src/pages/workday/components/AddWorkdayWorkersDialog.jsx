import { useEffect, useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
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
import MoneyInput from '#components/shared/MoneyInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

function getWorkerName(worker) {
  return (
    worker.nombre ||
    worker.name ||
    worker.full_name ||
    [worker.first_name, worker.last_name].filter(Boolean).join(' ')
  );
}

function getWorkerLabel(worker) {
  const identification = worker.identification || worker.cedula;
  return [
    getWorkerName(worker) || 'Trabajador sin nombre',
    identification ? `C.C. ${identification}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function getSelectedDetails(participant) {
  return Array.isArray(participant?.details) ? participant.details : [];
}

function getReferenceId(reference) {
  if (reference && typeof reference === 'object') return reference.id;
  return reference;
}

function FormField({ children, htmlFor, label }) {
  return (
    <div className="min-w-0 space-y-2">
      <label
        className="text-sm font-semibold text-primary"
        htmlFor={htmlFor}
      >
        {label} <span aria-hidden="true">*</span>
      </label>
      {children}
    </div>
  );
}

export default function AddWorkdayWorkersDialog({
  workday,
  open,
  onOpenChange,
  onSave,
}) {
  const [workers, setWorkers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lots, setLots] = useState([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [lotIds, setLotIds] = useState([]);
  const [paymentMode, setPaymentMode] = useState('jornal');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  const participants = workday?.allParticipants || workday?.participants || [];
  const canceledParticipationByWorker = new Map(
    participants
      .filter(
        (participant) => participant.settlementStatus === 'anulado',
      )
      .map((participant) => [
        String(participant.workerId),
        participant,
      ]),
  );
  const existingWorkerIds = new Set(
    participants
      .filter((participant) => participant.settlementStatus !== 'anulado')
      .map((participant) => String(participant.workerId)),
  );
  const availableWorkers = workers.filter(
    (worker) =>
      worker.is_active !== false &&
      (!existingWorkerIds.has(String(worker.id)) ||
        canceledParticipationByWorker.has(String(worker.id))),
  );
  const activity = activities.find(
    (item) => String(item.id) === activityId,
  );
  const activeLots = lots.filter(
    (lot) =>
      lot.is_active !== false &&
      lot.estado !== 'inactivo' &&
      String(lot.fincaId ?? lot.id_farm ?? lot.farm?.id) ===
        String(workday?.farmId),
  );
  const selectedWorkers = availableWorkers
    .filter((worker) => selectedWorkerIds.includes(String(worker.id)))
    .map((worker) => ({
      ...worker,
      canceledParticipationId:
        canceledParticipationByWorker.get(String(worker.id))?.id || null,
    }));
  const selectedLots = activeLots.filter((lot) =>
    lotIds.includes(String(lot.id)),
  );

  useEffect(() => {
    if (!open || !workday) return undefined;
    let active = true;

    Promise.all([api.workers.list(), api.activities.list(), api.lots.list()])
      .then(([loadedWorkers, loadedActivities, loadedLots]) => {
        if (!active) return;
        setWorkers(loadedWorkers);
        setActivities(loadedActivities);
        setLots(loadedLots);

        const currentParticipants = (
          workday.allParticipants || workday.participants || []
        );
        const firstParticipant =
          currentParticipants.find(
            (participant) => participant.settlementStatus !== 'anulado',
          ) || currentParticipants[0];
        const firstDetail = getSelectedDetails(firstParticipant)[0];
        const defaultActivityId = String(
          getReferenceId(firstDetail?.activity_type) ||
            loadedActivities[0]?.id ||
            '',
        );
        const defaultPaymentMode =
          firstParticipant?.paymentMode ||
          firstParticipant?.payment_mode ||
          'jornal';
        const defaultRate =
          firstParticipant?.rate ??
          firstParticipant?.agreed_rate ??
          '';
        const selectedLotIds = [
          ...new Set(
            getSelectedDetails(firstParticipant)
              .map((detail) => getReferenceId(detail.lot))
              .filter(Boolean)
              .map(String),
          ),
        ];

        setActivityId(defaultActivityId);
        setPaymentMode(defaultPaymentMode);
        setRate(String(defaultRate));
        setLotIds(selectedLotIds);
        setSelectedWorkerIds([]);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error('Error al cargar opciones para agregar trabajadores:', requestError);
        setLoadError(
          requestError.message ||
            'No se pudieron cargar trabajadores, actividades y lotes.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, retry, workday]);

  const kilogramPaymentAvailable = Boolean(activity?.is_harvest);
  const formDisabled =
    loading ||
    !availableWorkers.length ||
    !activity ||
    !selectedLots.length;

  const toggleWorker = (id) => {
    const value = String(id);
    setSelectedWorkerIds((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const toggleLot = (id) => {
    const value = String(id);
    setLotIds((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (workday?.status !== 'abierta') {
      setError('No se pueden agregar trabajadores a una jornada cerrada.');
      return;
    }
    if (!selectedWorkers.length || !activity || !selectedLots.length) {
      setError('Selecciona al menos un trabajador, una actividad y un lote.');
      return;
    }
    if (paymentMode === 'kg' && !activity.is_harvest) {
      setError('El pago por kilogramo solo aplica a actividades de recolección.');
      return;
    }

    const agreedRate = Number(rate);
    if (!Number.isFinite(agreedRate) || agreedRate <= 0) {
      setError('Ingresa una tarifa mayor que cero.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        workers: selectedWorkers,
        activity,
        lots: selectedLots,
        paymentMode,
        agreedRate,
      });
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al agregar trabajadores a la jornada:', saveError);
      setError(saveError.message || 'No se pudieron agregar los trabajadores.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl border-border p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader className="border-b border-border/60 pb-4 pr-8">
          <DialogTitle className="text-2xl text-foreground sm:text-[1.75rem]">
            Agregar trabajadores
          </DialogTitle>
          <DialogDescription className="leading-5">
            Jornada del {workday?.date}. Los datos actuales se cargan como
            valores iniciales y puedes ajustarlos para estas participaciones.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p
            aria-live="polite"
            className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
            role="status"
          >
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Cargando opciones…
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
                setLoadError('');
                setRetry((current) => current + 1);
              }}
              type="button"
              variant="outline"
            >
              Intentar de nuevo
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!availableWorkers.length && (
              <p className="rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
                No hay trabajadores activos disponibles para agregar.
              </p>
            )}

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-semibold text-primary">
                Trabajadores disponibles
                <span className="ml-1 font-normal normal-case text-muted-foreground">
                  ({selectedWorkers.length} seleccionados)
                </span>
              </legend>
              <div className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border border-input bg-card p-3 sm:grid-cols-2">
                {availableWorkers.map((worker) => (
                  <label
                    className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted"
                    key={worker.id}
                  >
                    <input
                      checked={selectedWorkerIds.includes(String(worker.id))}
                      className="size-4 shrink-0 accent-primary"
                      onChange={() => toggleWorker(worker.id)}
                      type="checkbox"
                    />
                    <span className="truncate">{getWorkerLabel(worker)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField htmlFor="add-workday-activity" label="Actividad">
                <Select
                  onValueChange={(value) => {
                    setActivityId(value);
                    const selected = activities.find(
                      (item) => String(item.id) === value,
                    );
                    if (!selected?.is_harvest) setPaymentMode('jornal');
                  }}
                  value={activityId}
                >
                  <SelectTrigger
                    className="h-11 w-full rounded-xl border-input bg-card px-3 text-sm text-foreground"
                    id="add-workday-activity"
                  >
                    <SelectValue placeholder="Selecciona una actividad">
                      {activity?.name || undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                        {item.is_harvest ? ' · Recolección' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField htmlFor="add-workday-rate" label="Tarifa acordada">
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <MoneyInput
                    className="h-11 rounded-xl border-input bg-card pl-8 text-sm text-foreground"
                    id="add-workday-rate"
                    onValueChange={setRate}
                    required
                    value={rate}
                  />
                </div>
              </FormField>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-primary">
                Modalidad de pago
              </legend>
              <div className="grid h-11 grid-cols-2 rounded-xl border border-border bg-muted p-1">
                {[
                  ['jornal', 'Por jornal'],
                  ['kg', 'Pago por kg'],
                ].map(([value, label]) => (
                  <label
                    className={`flex items-center justify-center rounded-lg px-2 text-sm font-medium ${
                      value === 'kg' && !kilogramPaymentAvailable
                        ? 'cursor-not-allowed text-subtle'
                        : 'cursor-pointer text-ink-soft has-[:checked]:bg-primary has-[:checked]:text-primary-foreground'
                    }`}
                    key={value}
                  >
                    <input
                      checked={paymentMode === value}
                      className="sr-only"
                      disabled={value === 'kg' && !kilogramPaymentAvailable}
                      name="add-workday-payment-mode"
                      onChange={() => setPaymentMode(value)}
                      type="radio"
                      value={value}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-primary">
                Lotes
                <span className="ml-1 font-normal normal-case text-muted-foreground">
                  ({selectedLots.length} seleccionados)
                </span>
              </legend>
              <div className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border border-input bg-card p-3 sm:grid-cols-2">
                {activeLots.map((lot) => (
                  <label
                    className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted"
                    key={lot.id}
                  >
                    <input
                      checked={lotIds.includes(String(lot.id))}
                      className="size-4 shrink-0 accent-primary"
                      onChange={() => toggleLot(lot.id)}
                      type="checkbox"
                    />
                    <span className="truncate">
                      {lot.nombre || lot.name || 'Lote sin nombre'}
                    </span>
                  </label>
                ))}
              </div>
              {!activeLots.length && (
                <p className="text-xs text-muted-foreground">
                  No hay lotes activos en esta finca.
                </p>
              )}
            </fieldset>

            {error && (
              <p
                aria-live="polite"
                className="rounded-xl border border-destructive/20 bg-destructive-soft px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

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
                disabled={saving || formDisabled || workday?.status !== 'abierta'}
                type="submit"
              >
                {saving ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                {saving ? 'Guardando…' : 'Agregar trabajadores'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
