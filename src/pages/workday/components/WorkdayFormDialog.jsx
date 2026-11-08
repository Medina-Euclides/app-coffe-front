import { useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '#services/api';
import FormDialog from '#components/shared/FormDialog';
import { Input } from '#components/ui/input';
import { toggleId } from '#lib/utils';
import CheckboxListField from './fields/CheckboxListField.jsx';
import PaymentModeField from './fields/PaymentModeField.jsx';
import RateField from './fields/RateField.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { FormField } from '#components/shared/FormFeedback';
import { useApiResource } from '#hooks/useApiResource';
import ErrorBanner from '#components/shared/ErrorBanner';
import LoadingState from '#components/shared/LoadingState';
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

  const handleSubmit = async () => {

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
      return false;
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
      return false;
    }

    const agreedRate = Number(rate);

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
    return '';
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
    <FormDialog
      description="Anota el trabajo del día."
      disabled={formDisabled}
      errorFallback="No se pudo guardar la jornada. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      open={open}
      size="lg"
      status={
        optionsLoading ? (
          <LoadingState className="py-10" spinner>
            Cargando trabajadores, actividades y lotes…
          </LoadingState>
        ) : optionsError ? (
          <ErrorBanner message={optionsError} onRetry={reloadOptions} retryLabel="Intentar de nuevo" />
        ) : null
      }
      submitIcon={Save}
      submitLabel="Guardar jornada"
      title="Registrar Jornada Laboral"
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

      <CheckboxListField
        ariaLabel="Trabajadores de la jornada"
        feedback={feedback}
        getLabel={getWorkerLabel}
        id="workday-workers"
        items={activeWorkers}
        legend="¿Quiénes trabajan?"
        onToggle={(id) => setWorkerIds((current) => toggleId(current, id))}
        selectedIds={workerIds}
      />

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

      <CheckboxListField
        ariaLabel="Lotes de la jornada"
        emptyMessage="Selecciona una finca con lotes activos."
        feedback={feedback}
        getLabel={getLotLabel}
        id="workday-lots"
        items={activeLots}
        legend="¿En qué lotes?"
        onToggle={(id) => setLotIds((current) => toggleId(current, id))}
        selectedIds={lotIds}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PaymentModeField
          kilogramAvailable={kilogramPaymentAvailable}
          name="payment_mode"
          onChange={setPaymentMode}
          showKilogramHint={Boolean(selectedActivity)}
          value={paymentMode}
        />

        <RateField
          feedback={feedback}
          hint="Igual para todos."
          id="workday-rate"
          name="agreed_rate"
          onChange={setRate}
          paymentMode={paymentMode}
          value={rate}
        />
      </div>
    </FormDialog>
  );
}
