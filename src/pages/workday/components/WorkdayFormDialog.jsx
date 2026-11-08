import { useState } from 'react';
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
import MoneyInput from '#components/shared/MoneyInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { FieldError, FormAlert, FormField } from '#components/shared/FormFeedback';
import { useApiResource } from '#hooks/useApiResource';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { PAYMENT_MODES } from '#lib/constants';
import { hoy } from '#lib/formatters';
import { getLotLabel, getWorkerLabel } from '#lib/domain/entities';


const EMPTY_OPTIONS = { workers: [], activities: [], lots: [], farms: [] };

// Opciones del formulario; cada lote lleva el nombre de su finca para la lista.
const fetchWorkdayOptions = async () => {
  const [workers, activities, lots, farms] = await Promise.all([
    api.workers.list(),
    api.activities.list(),
    api.lots.list(),
    api.farms.list(),
  ]);
  const farmNames = new Map(farms.map((farm) => [String(farm.id), farm.nombre || farm.name]));
  return {
    workers,
    activities,
    farms,
    lots: lots.map((lot) => ({
      ...lot,
      farmName:
        lot.farm?.name || lot.farm_name || farmNames.get(String(lot.fincaId ?? lot.id_farm)) || '',
    })),
  };
};

export default function WorkdayFormDialog({
  existingWorkdays,
  open,
  onOpenChange,
  onSave,
}) {
  const [workerIds, setWorkerIds] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [lotIds, setLotIds] = useState([]);
  const [todayDate] = useState(hoy);
  const [date, setDate] = useState(hoy);
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES.JOURNAL);
  const [rate, setRate] = useState('');
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);

  // Propone el primer trabajador, actividad, finca y lote activos.
  const applyDefaults = ({
    workers: loadedWorkers,
    activities: loadedActivities,
    farms: loadedFarms,
    lots: lotsWithFarm,
  }) => {
    setWorkerIds((current) =>
      current.length
        ? current
        : loadedWorkers
            .filter((worker) => worker.is_active !== false)
            .slice(0, 1)
            .map((worker) => String(worker.id)),
    );
    setActivityId((current) => current || String(loadedActivities[0]?.id || ''));
    const firstFarm =
      loadedFarms.find((farm) => farm.is_active !== false) || loadedFarms[0];
    const defaultFarmId = String(firstFarm?.id || '');
    setFarmId(defaultFarmId);
    const lotsForInitialFarm = lotsWithFarm.filter(
      (lot) =>
        String(lot.fincaId ?? lot.id_farm ?? lot.farm?.id) ===
          defaultFarmId &&
        lot.is_active !== false &&
        lot.estado !== 'inactivo',
    );
    setLotIds((current) =>
      current.some((id) =>
        lotsForInitialFarm.some((lot) => String(lot.id) === id),
      )
        ? current.filter((id) =>
            lotsForInitialFarm.some((lot) => String(lot.id) === id),
          )
        : lotsForInitialFarm.slice(0, 1).map((lot) => String(lot.id)),
    );
  };
  const {
    data: { workers, activities, lots, farms },
    loading: optionsLoading,
    error: optionsError,
    refetch: reloadOptions,
  } = useApiResource('workday-form', fetchWorkdayOptions, {
    initialData: EMPTY_OPTIONS,
    refreshOnSync: false,
    onSuccess: applyDefaults,
  });

  const activeWorkers = workers.filter((worker) => worker.is_active !== false);
  const activeFarms = farms.filter((farm) => farm.is_active !== false);
  const activeLots = lots.filter(
    (lot) =>
      lot.is_active !== false &&
      lot.estado !== 'inactivo' &&
      String(lot.fincaId ?? lot.id_farm ?? lot.farm?.id) === farmId,
  );
  const selectedWorkers = activeWorkers.filter((worker) =>
    workerIds.includes(String(worker.id)),
  );
  const selectedLots = activeLots.filter((lot) =>
    lotIds.includes(String(lot.id)),
  );
  const selectedFarm = activeFarms.find(
    (farm) => String(farm.id) === farmId,
  );
  const selectedActivity = activities.find(
    (activity) => String(activity.id) === activityId,
  );
  const kilogramPaymentAvailable = Boolean(selectedActivity?.is_harvest);
  const formDisabled =
    optionsLoading ||
    !activeWorkers.length ||
    !activeFarms.length ||
    !activities.length ||
    !activeLots.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();

    // Se marcan todos los campos que faltan; el primero recibe el foco.
    const missing = [
      !selectedFarm && ['workday-farm', 'Elige la finca donde se trabajó.'],
      !selectedWorkers.length && ['workday-workers', 'Marca al menos un trabajador.'],
      !selectedActivity && ['workday-activity', 'Elige qué actividad se hizo.'],
      !selectedLots.length && ['workday-lots', 'Marca al menos un lote donde se trabajó.'],
      !(Number(rate) > 0) && [
        'workday-rate',
        paymentMode === PAYMENT_MODES.KILOGRAM
          ? 'Escribe la tarifa por kilo, mayor que cero.'
          : 'Escribe el valor del jornal, mayor que cero.',
      ],
      date > todayDate && ['workday-date', 'La fecha no puede ser posterior a hoy.'],
    ].filter(Boolean);
    if (missing.length) {
      missing.forEach(([key, message]) => feedback.setFieldError(key, message));
      return;
    }

    const duplicateWorkday = existingWorkdays.some(
      (workday) =>
        String(workday.farmId) === farmId && workday.dateKey === date,
    );
    if (duplicateWorkday) {
      feedback.setFormError(
        'Ya registraste una jornada en esta finca para esa fecha. Cambia la fecha o edita la jornada que ya existe.',
      );
      feedback.setFieldError('workday-date', 'Ya hay una jornada en esta fecha.');
      return;
    }

    const agreedRate = Number(rate);

    setSaving(true);
    try {
      const payload = {
        farm: selectedFarm.id,
        date,
      };
      await onSave(payload, {
        workers: selectedWorkers,
        activity: selectedActivity,
        farm: selectedFarm,
        lots: selectedLots,
        paymentMode,
        agreedRate,
      });
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar la jornada laboral:', saveError);
      feedback.setFormError(
        saveError.message ||
          'No se pudo guardar la jornada. Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleActivityChange = (nextActivityId) => {
    feedback.clearField('workday-activity');
    setActivityId(nextActivityId);
    const nextActivity = activities.find(
      (activity) => String(activity.id) === nextActivityId,
    );
    if (!nextActivity?.is_harvest) {
      setPaymentMode(PAYMENT_MODES.JOURNAL);
    }
  };

  const toggleSelection = (selectedIds, setSelectedIds, id) => {
    const value = String(id);
    setSelectedIds((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleFarmChange = (nextFarmId) => {
    feedback.clearField('workday-farm');
    feedback.clearField('workday-lots');
    setFarmId(nextFarmId);
    setLotIds(
      lots
        .filter(
          (lot) =>
            String(lot.fincaId ?? lot.id_farm ?? lot.farm?.id) === nextFarmId &&
            lot.is_active !== false &&
            lot.estado !== 'inactivo',
        )
        .slice(0, 1)
        .map((lot) => String(lot.id)),
    );
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl border-border p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader className="border-b border-border/60 pb-4 pr-8">
          <DialogTitle className="text-2xl text-foreground sm:text-[1.75rem]">
            Registrar Jornada Laboral
          </DialogTitle>
          <DialogDescription className="leading-5">
            Anota el trabajo del día.
          </DialogDescription>
        </DialogHeader>

        {optionsLoading ? (
          <p
            aria-live="polite"
            className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
            role="status"
          >
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Cargando trabajadores, actividades y lotes…
          </p>
        ) : optionsError ? (
          <div className="space-y-4 py-2">
            <p aria-live="polite" className="text-sm text-destructive" role="alert">
              {optionsError}
            </p>
            <Button
              className="min-h-10 rounded-xl"
              onClick={reloadOptions}
              type="button"
              variant="outline"
            >
              Intentar de nuevo
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            {...feedback.formProps}
            onSubmit={handleSubmit}
          >
            {(!activeWorkers.length ||
              !activeFarms.length ||
              !activities.length ||
              !activeLots.length) && (
              <p
                aria-live="polite"
                className="rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-sm leading-5 text-warning"
                role="status"
              >
                {!activeWorkers.length && 'Agrega un trabajador activo. '}
                {!activeFarms.length && 'Agrega una finca. '}
                {!activities.length && 'Agrega una actividad laboral. '}
                {!activeLots.length && 'Agrega un lote activo en la finca seleccionada. '}
                Luego podrás registrar la jornada.
              </p>
            )}

            <FormField
              {...feedback.field('workday-farm')}
              htmlFor="workday-farm"
              label="¿En qué finca?"
              labelClassName="font-semibold text-primary"
              required
            >
              <Select
                onValueChange={handleFarmChange}
                value={farmId}
                disabled={!activeFarms.length}
              >
                <SelectTrigger
                  aria-describedby="workday-farm-error"
                  aria-invalid={feedback.field('workday-farm').invalid || undefined}
                  aria-label="¿En qué finca?"
                  className="h-12 w-full rounded-xl border-input bg-card px-3 text-base font-semibold text-foreground"
                  id="workday-farm"
                  name="farm"
                >
                  <SelectValue
                    className="truncate font-semibold text-foreground"
                    placeholder="Selecciona una finca"
                  >
                    {selectedFarm?.nombre || selectedFarm?.name || undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeFarms.map((farm) => (
                    <SelectItem
                      className="rounded-lg py-2.5 text-base font-medium text-foreground data-highlighted:bg-tint data-highlighted:text-foreground data-selected:font-semibold"
                      key={farm.id}
                      value={String(farm.id)}
                    >
                      {farm.nombre || farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-semibold text-primary">
                ¿Quiénes trabajan? <span aria-hidden="true" className="text-destructive">*</span>
                <span className="ml-1 font-normal normal-case text-muted-foreground">
                  ({selectedWorkers.length} seleccionados)
                </span>
              </legend>
              <div
                aria-describedby="workday-workers-error"
                aria-invalid={feedback.field('workday-workers').invalid || undefined}
                aria-label="Trabajadores de la jornada"
                className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border border-input bg-card p-3 sm:grid-cols-2"
                data-field-box
                id="workday-workers"
                tabIndex={-1}
              >
                {activeWorkers.map((worker) => {
                  const checked = workerIds.includes(String(worker.id));
                  return (
                    <label
                      className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted"
                      key={worker.id}
                    >
                      <input
                        checked={checked}
                        className="size-4 shrink-0 accent-primary"
                        onChange={() =>
                          toggleSelection(workerIds, setWorkerIds, worker.id)
                        }
                        type="checkbox"
                        value={String(worker.id)}
                      />
                      <span className="truncate">{getWorkerLabel(worker)}</span>
                    </label>
                  );
                })}
              </div>
              <FieldError
                id="workday-workers-error"
                message={feedback.field('workday-workers').error}
              />
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                {...feedback.field('workday-activity')}
                htmlFor="workday-activity"
                label="¿Qué harán hoy?"
                labelClassName="font-semibold text-primary"
                required
              >
                <Select
                  onValueChange={handleActivityChange}
                  value={activityId}
                  disabled={!activities.length}
                >
                  <SelectTrigger
                    aria-describedby="workday-activity-error"
                    aria-invalid={feedback.field('workday-activity').invalid || undefined}
                    aria-label="¿Qué harán hoy?"
                    className="h-12 w-full rounded-xl border-input bg-card px-3 text-base font-semibold text-foreground"
                    id="workday-activity"
                    name="activity_type"
                  >
                    <SelectValue
                      className="truncate font-semibold text-foreground"
                      placeholder="Elige la labor"
                    >
                      {selectedActivity?.name || undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((activity) => (
                      <SelectItem
                        className="rounded-lg py-2.5 text-base font-medium text-foreground data-highlighted:bg-tint data-highlighted:text-foreground data-selected:font-semibold"
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
                {...feedback.field('workday-date')}
                htmlFor="workday-date"
                label="¿Qué día?"
                labelClassName="font-semibold text-primary"
              >
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl border-input bg-card px-3 text-base font-semibold text-foreground"
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

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-semibold text-primary">
                ¿En qué lotes? <span aria-hidden="true" className="text-destructive">*</span>
                <span className="ml-1 font-normal normal-case text-muted-foreground">
                  ({selectedLots.length} seleccionados)
                </span>
              </legend>
              {activeLots.length ? (
                <div
                  aria-describedby="workday-lots-error"
                  aria-invalid={feedback.field('workday-lots').invalid || undefined}
                  aria-label="Lotes de la jornada"
                  className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border border-input bg-card p-3 sm:grid-cols-2"
                  data-field-box
                  id="workday-lots"
                  tabIndex={-1}
                >
                  {activeLots.map((lot) => {
                    const checked = lotIds.includes(String(lot.id));
                    return (
                      <label
                        className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted"
                        key={lot.id}
                      >
                        <input
                          checked={checked}
                          className="size-4 shrink-0 accent-primary"
                          onChange={() =>
                            toggleSelection(lotIds, setLotIds, lot.id)
                          }
                          type="checkbox"
                          value={String(lot.id)}
                        />
                        <span className="truncate">{getLotLabel(lot)}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-input bg-card px-3 py-3 text-sm text-muted-foreground">
                  Selecciona una finca con lotes activos.
                </p>
              )}
              <FieldError
                id="workday-lots-error"
                message={feedback.field('workday-lots').error}
              />
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="min-w-0 space-y-2">
                <legend className="text-sm font-semibold text-primary">
                  Modalidad de pago <span aria-hidden="true">*</span>
                </legend>
                <div className="grid h-12 grid-cols-2 rounded-xl border border-border bg-muted p-1">
                  <label className="flex cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium text-ink-soft transition-colors has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
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
                    className={`flex items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                      kilogramPaymentAvailable
                        ? 'cursor-pointer text-muted-foreground'
                        : 'cursor-not-allowed text-subtle'
                    } has-[:checked]:bg-primary has-[:checked]:text-primary-foreground`}
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
                  <p className="text-xs leading-5 text-muted-foreground">
                    El pago por kg está disponible para actividades de recolección.
                  </p>
                )}
              </fieldset>

              <FormField
                {...feedback.field('workday-rate')}
                htmlFor="workday-rate"
                label={
                  paymentMode === PAYMENT_MODES.KILOGRAM
                    ? '¿Cuánto se paga por kilo?'
                    : '¿Cuánto vale el jornal?'
                }
                hint="Igual para todos."
                labelClassName="font-semibold text-primary"
                required
              >
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground"
                  >
                    $
                  </span>
                  <MoneyInput
                    aria-describedby="workday-rate-error"
                    aria-invalid={feedback.field('workday-rate').invalid || undefined}
                    className="h-12 rounded-xl border-input bg-card pl-9 text-base font-semibold text-foreground"
                    id="workday-rate"
                    name="agreed_rate"
                    onValueChange={setRate}
                    placeholder="Ej. 50.000…"
                    required
                    value={rate}
                  />
                </div>
              </FormField>
            </div>

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
