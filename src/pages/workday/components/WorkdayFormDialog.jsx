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
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

const PAYMENT_MODES = {
  JOURNAL: 'jornal',
  KILOGRAM: 'kg',
};

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDisplayName(person) {
  return (
    person.nombre ||
    person.name ||
    person.full_name ||
    [person.first_name, person.last_name].filter(Boolean).join(' ')
  );
}

function getWorkerLabel(worker) {
  const name = getDisplayName(worker);
  const identification = worker.identification || worker.cedula;
  return [
    name || 'Trabajador sin nombre',
    identification ? `C.C. ${identification}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function getLotLabel(lot) {
  const lotName = lot.nombre || lot.name || 'Lote sin nombre';
  const farmName =
    lot.farmName ||
    lot.farm?.name ||
    lot.farm_name ||
    lot.fincaNombre ||
    '';
  return farmName ? `${lotName} · Finca ${farmName}` : lotName;
}

function FormField({ children, htmlFor, label, required }) {
  return (
    <div className="min-w-0 space-y-2">
      <label
        className="text-xs font-semibold uppercase tracking-wide text-[#244b38]"
        htmlFor={htmlFor}
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function WorkdayFormDialog({
  existingWorkdays,
  open,
  onOpenChange,
  onSave,
}) {
  const [workers, setWorkers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lots, setLots] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [lotId, setLotId] = useState('');
  const [todayDate] = useState(getLocalDate);
  const [date, setDate] = useState(getLocalDate);
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES.JOURNAL);
  const [rate, setRate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadOptions, setReloadOptions] = useState(0);

  const activeWorkers = workers.filter((worker) => worker.is_active !== false);
  const activeLots = lots.filter(
    (lot) => lot.is_active !== false && lot.estado !== 'inactivo',
  );
  const selectedActivity = activities.find(
    (activity) => String(activity.id) === activityId,
  );
  const selectedWorker = activeWorkers.find(
    (worker) => String(worker.id) === workerId,
  );
  const selectedLot = activeLots.find(
    (lot) => String(lot.id) === lotId,
  );
  const kilogramPaymentAvailable = Boolean(selectedActivity?.is_harvest);
  const formDisabled =
    optionsLoading ||
    !activeWorkers.length ||
    !activities.length ||
    !activeLots.length;

  useEffect(() => {
    let active = true;

    Promise.all([
      api.workers.list(),
      api.activities.list(),
      api.lots.list(),
      api.farms.list(),
    ])
      .then(([loadedWorkers, loadedActivities, loadedLots, loadedFarms]) => {
        if (!active) return;
        const farmNames = new Map(
          loadedFarms.map((farm) => [String(farm.id), farm.nombre || farm.name]),
        );
        const lotsWithFarm = loadedLots.map((lot) => ({
          ...lot,
          farmName:
            lot.farm?.name ||
            lot.farm_name ||
            farmNames.get(String(lot.fincaId ?? lot.id_farm)) ||
            '',
        }));
        setWorkers(loadedWorkers);
        setActivities(loadedActivities);
        setLots(lotsWithFarm);
        setWorkerId((current) =>
          current || String(loadedWorkers.find((worker) => worker.is_active !== false)?.id || ''),
        );
        setActivityId((current) => current || String(loadedActivities[0]?.id || ''));
        setLotId((current) =>
          current ||
          String(
            lotsWithFarm.find(
              (lot) => lot.is_active !== false && lot.estado !== 'inactivo',
            )?.id || '',
          ),
        );
      })
      .catch((loadError) => {
        if (!active) return;
        console.error('Error al cargar opciones de jornada:', loadError);
        setOptionsError(
          loadError.message ||
            'No se pudieron cargar trabajadores, actividades y lotes.',
        );
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadOptions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!selectedWorker || !selectedActivity || !selectedLot) {
      setError('Selecciona un trabajador, una actividad y un lote activos.');
      document
        .getElementById(
          !selectedWorker
            ? 'workday-worker'
            : !selectedActivity
              ? 'workday-activity'
              : 'workday-lot',
        )
        ?.focus();
      return;
    }

    if (date > todayDate) {
      setError('La fecha de la jornada no puede ser futura.');
      document.getElementById('workday-date')?.focus();
      return;
    }

    const duplicateWorkday = existingWorkdays.some(
      (workday) =>
        String(workday.workerId) === String(selectedWorker.id) &&
        workday.dateKey === date,
    );
    if (duplicateWorkday) {
      setError(
        'Este trabajador ya tiene una jornada para esa fecha. El sistema permite una jornada por trabajador al día.',
      );
      document.getElementById('workday-worker')?.focus();
      return;
    }

    const agreedRate = Number(rate);
    if (!Number.isFinite(agreedRate) || agreedRate <= 0) {
      setError('Ingresa una tarifa mayor que cero.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        worker: selectedWorker.id,
        activity_type: selectedActivity.id,
        date,
        lot: selectedLot.id,
        payment_mode: paymentMode,
        agreed_rate: agreedRate,
      };
      await onSave(payload, {
        worker: selectedWorker,
        activity: selectedActivity,
        lot: selectedLot,
      });
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar la jornada laboral:', saveError);
      setError(saveError.message || 'No se pudo guardar la jornada laboral.');
    } finally {
      setSaving(false);
    }
  };

  const handleActivityChange = (nextActivityId) => {
    setActivityId(nextActivityId);
    const nextActivity = activities.find(
      (activity) => String(activity.id) === nextActivityId,
    );
    if (!nextActivity?.is_harvest) {
      setPaymentMode(PAYMENT_MODES.JOURNAL);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl border-[#e4e9e1] p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader className="border-b border-[#e9ede8] pb-4 pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b] sm:text-xl">
            Registrar Jornada Laboral
          </DialogTitle>
          <DialogDescription className="leading-5">
            Ingresa los detalles de la labor diaria en campo.
          </DialogDescription>
        </DialogHeader>

        {optionsLoading ? (
          <p
            aria-live="polite"
            className="flex items-center justify-center gap-2 py-10 text-sm text-[#68766b]"
            role="status"
          >
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Cargando trabajadores, actividades y lotes…
          </p>
        ) : optionsError ? (
          <div className="space-y-4 py-2">
            <p aria-live="polite" className="text-sm text-red-700" role="alert">
              {optionsError}
            </p>
            <Button
              className="min-h-10 rounded-xl"
              onClick={() => {
                setOptionsLoading(true);
                setOptionsError('');
                setReloadOptions((attempt) => attempt + 1);
              }}
              type="button"
              variant="outline"
            >
              Intentar de nuevo
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {(!activeWorkers.length || !activities.length || !activeLots.length) && (
              <p
                aria-live="polite"
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900"
                role="status"
              >
                {!activeWorkers.length && 'Agrega un trabajador activo. '}
                {!activities.length && 'Agrega una actividad laboral. '}
                {!activeLots.length && 'Agrega un lote activo. '}
                Luego podrás registrar la jornada.
              </p>
            )}

            <FormField htmlFor="workday-worker" label="Trabajador" required>
              <Select
                onValueChange={setWorkerId}
                value={workerId}
                disabled={!activeWorkers.length}
              >
                <SelectTrigger
                  aria-label="Trabajador"
                  className="h-12 w-full rounded-xl border-[#d1ddd2] bg-white px-3 text-base font-semibold text-[#173d30]"
                  id="workday-worker"
                  name="worker"
                >
                  <SelectValue
                    className="truncate font-semibold text-[#173d30]"
                    placeholder="Selecciona un trabajador"
                  >
                    {selectedWorker ? getWorkerLabel(selectedWorker) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeWorkers.map((worker) => (
                    <SelectItem
                      className="rounded-lg py-2.5 text-base font-medium text-[#254334] data-highlighted:bg-[#e8f3e8] data-highlighted:text-[#173d30] data-selected:font-semibold"
                      key={worker.id}
                      value={String(worker.id)}
                    >
                      {getWorkerLabel(worker)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                htmlFor="workday-activity"
                label="Tipo de actividad"
                required
              >
                <Select
                  onValueChange={handleActivityChange}
                  value={activityId}
                  disabled={!activities.length}
                >
                  <SelectTrigger
                    aria-label="Tipo de actividad"
                    className="h-12 w-full rounded-xl border-[#d1ddd2] bg-white px-3 text-base font-semibold text-[#173d30]"
                    id="workday-activity"
                    name="activity_type"
                  >
                    <SelectValue
                      className="truncate font-semibold text-[#173d30]"
                      placeholder="Selecciona una actividad"
                    >
                      {selectedActivity?.name || undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((activity) => (
                      <SelectItem
                        className="rounded-lg py-2.5 text-base font-medium text-[#254334] data-highlighted:bg-[#e8f3e8] data-highlighted:text-[#173d30] data-selected:font-semibold"
                        key={activity.id}
                        value={String(activity.id)}
                      >
                        {activity.name}
                        {activity.is_harvest ? ' · Recolección' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                htmlFor="workday-date"
                label="Fecha de ejecución"
                required
              >
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl border-[#d1ddd2] bg-white px-3 text-base font-semibold text-[#173d30]"
                  id="workday-date"
                  max={todayDate}
                  name="date"
                  onChange={(event) => setDate(event.target.value)}
                  required
                  type="date"
                  value={date}
                />
              </FormField>
            </div>

            <FormField htmlFor="workday-lot" label="Lote de destino" required>
              <Select
                onValueChange={setLotId}
                value={lotId}
                disabled={!activeLots.length}
              >
                <SelectTrigger
                  aria-label="Lote de destino"
                  className="h-12 w-full rounded-xl border-[#d1ddd2] bg-white px-3 text-base font-semibold text-[#173d30]"
                  id="workday-lot"
                  name="lot"
                >
                  <SelectValue
                    className="truncate font-semibold text-[#173d30]"
                    placeholder="Selecciona un lote"
                  >
                    {selectedLot ? getLotLabel(selectedLot) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeLots.map((lot) => (
                    <SelectItem
                      className="rounded-lg py-2.5 text-base font-medium text-[#254334] data-highlighted:bg-[#e8f3e8] data-highlighted:text-[#173d30] data-selected:font-semibold"
                      key={lot.id}
                      value={String(lot.id)}
                    >
                      {getLotLabel(lot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="min-w-0 space-y-2">
                <legend className="text-xs font-semibold uppercase tracking-wide text-[#244b38]">
                  Modalidad de pago <span aria-hidden="true">*</span>
                </legend>
                <div className="grid h-12 grid-cols-2 rounded-xl border border-[#e1e8e0] bg-[#f7f9f6] p-1">
                  <label className="flex cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium text-[#52655a] transition-colors has-[:checked]:bg-[#173d30] has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#426b48]">
                    <input
                      checked={paymentMode === PAYMENT_MODES.JOURNAL}
                      className="peer sr-only"
                      name="payment_mode"
                      onChange={() => setPaymentMode(PAYMENT_MODES.JOURNAL)}
                      type="radio"
                      value={PAYMENT_MODES.JOURNAL}
                    />
                    <span>Por jornal</span>
                  </label>
                  <label
                    className={`flex items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#426b48] ${
                      kilogramPaymentAvailable
                        ? 'cursor-pointer text-[#68766b]'
                        : 'cursor-not-allowed text-[#a0a9a0]'
                    } has-[:checked]:bg-[#173d30] has-[:checked]:text-white`}
                  >
                    <input
                      checked={paymentMode === PAYMENT_MODES.KILOGRAM}
                      className="peer sr-only"
                      disabled={!kilogramPaymentAvailable}
                      name="payment_mode"
                      onChange={() => setPaymentMode(PAYMENT_MODES.KILOGRAM)}
                      type="radio"
                      value={PAYMENT_MODES.KILOGRAM}
                    />
                    <span>Pago por kg</span>
                  </label>
                </div>
                {!kilogramPaymentAvailable && selectedActivity && (
                  <p className="text-xs leading-5 text-[#748074]">
                    El pago por kg está disponible para actividades de recolección.
                  </p>
                )}
              </fieldset>

              <FormField
                htmlFor="workday-rate"
                label={
                  paymentMode === PAYMENT_MODES.KILOGRAM
                    ? 'Tarifa por kg (COP)'
                    : 'Valor del jornal (COP)'
                }
                required
              >
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-[#748074]"
                  >
                    $
                  </span>
                  <Input
                    autoComplete="off"
                    className="h-12 rounded-xl border-[#d1ddd2] bg-white pl-9 text-base font-semibold text-[#173d30]"
                    id="workday-rate"
                    min="0.01"
                    name="agreed_rate"
                    onChange={(event) => setRate(event.target.value)}
                    placeholder="Ej. 50.000…"
                    required
                    step="0.01"
                    type="number"
                    value={rate}
                  />
                </div>
                <p className="text-xs leading-5 text-[#748074]">
                  {paymentMode === PAYMENT_MODES.KILOGRAM
                    ? 'Tarifa pactada por kilogramo recolectado.'
                    : 'Tarifa pactada por la jornada.'}
                </p>
              </FormField>
            </div>

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
                disabled={saving || formDisabled}
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
                {saving ? 'Guardando…' : 'Guardar jornada'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
