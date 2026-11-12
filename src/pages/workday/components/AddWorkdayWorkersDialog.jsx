import { useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '#services/api';
import FormDialog from '#components/shared/FormDialog';
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
import { validateRate } from '#lib/validation';
import { getParticipantDetails, getReferenceId, getWorkerLabel } from '#lib/domain/entities';

const EMPTY_OPTIONS = { workers: [], activities: [], lots: [] };

const fetchWorkerOptions = async () => {
  const [workers, activities, lots] = await Promise.all([
    api.workers.list(),
    api.activities.list(),
    api.lots.list(),
  ]);
  return { workers, activities, lots };
};

export default function AddWorkdayWorkersDialog({
  workday,
  open,
  onOpenChange,
  onSave,
}) {
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [lotIds, setLotIds] = useState([]);
  const [paymentMode, setPaymentMode] = useState('jornal');
  const [rate, setRate] = useState('');
  const feedback = useFormFeedback();

  // Al abrir, propone la actividad, modalidad, tarifa y lotes del primer trabajador.
  const applyDefaults = ({ activities: loadedActivities }) => {
    const currentParticipants = (
      workday.allParticipants || workday.participants || []
    );
    const firstParticipant =
      currentParticipants.find(
        (participant) => participant.settlementStatus !== 'anulado',
      ) || currentParticipants[0];
    const firstDetail = getParticipantDetails(firstParticipant)[0];
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
        getParticipantDetails(firstParticipant)
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
  };
  const {
    data: { workers, activities, lots },
    loading,
    error: loadError,
    refetch,
  } = useApiResource(`add-workers:${workday?.id}`, fetchWorkerOptions, {
    initialData: EMPTY_OPTIONS,
    enabled: Boolean(open && workday),
    refreshOnSync: false,
    onSuccess: applyDefaults,
  });

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

  const kilogramPaymentAvailable = Boolean(activity?.is_harvest);
  const formDisabled =
    loading ||
    !availableWorkers.length ||
    !activity ||
    !selectedLots.length;


  const handleSubmit = async () => {

    if (workday?.status !== 'abierta') {
      feedback.setFormError('Esta jornada ya está cerrada; no se le pueden agregar trabajadores.');
      return false;
    }

    const agreedRate = Number(rate);
    // Se marcan todos los campos que faltan; el primero recibe el foco.
    const missing = [
      !selectedWorkers.length && ['add-workday-workers', 'Marca al menos un trabajador.'],
      !activity && ['add-workday-activity', 'Elige qué actividad hará.'],
      validateRate(rate, paymentMode) && ['add-workday-rate', validateRate(rate, paymentMode)],
      !selectedLots.length && ['add-workday-lots', 'Marca al menos un lote.'],
    ].filter(Boolean);
    if (missing.length) {
      missing.forEach(([key, message]) => feedback.setFieldError(key, message));
      return false;
    }
    if (paymentMode === 'kg' && !activity.is_harvest) {
      feedback.setFormError(
        'El pago por kilo solo aplica a actividades de recolección. Elige pago por jornal.',
      );
      return false;
    }

    await onSave({
      workers: selectedWorkers,
      activity,
      lots: selectedLots,
      paymentMode,
      agreedRate,
    });
    return '';
  };


  return (
    <FormDialog
      description={`Jornada del ${workday?.date}.`}
      disabled={formDisabled || workday?.status !== 'abierta'}
      errorFallback="No se pudieron agregar los trabajadores. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      open={open}
      size="lg"
      status={
        loading ? (
          <LoadingState className="py-10" spinner>
            Cargando opciones…
          </LoadingState>
        ) : loadError ? (
          <ErrorBanner message={loadError} onRetry={refetch} retryLabel="Intentar de nuevo" />
        ) : null
      }
      submitIcon={Save}
      submitLabel="Agregar trabajadores"
      title="Agregar trabajadores"
    >
      {!availableWorkers.length && (
        <p className="rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
          No hay trabajadores activos disponibles para agregar.
        </p>
      )}

      <CheckboxListField
        feedback={feedback}
        getLabel={getWorkerLabel}
        id="add-workday-workers"
        items={availableWorkers}
        legend="Trabajadores disponibles"
        onToggle={(id) => setSelectedWorkerIds((current) => toggleId(current, id))}
        selectedIds={selectedWorkerIds}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          {...feedback.field('add-workday-activity')}
          htmlFor="add-workday-activity"
          label="¿Qué harán?"
          labelClassName="font-semibold text-primary"
          required
        >
          <Select
            onValueChange={(value) => {
              feedback.clearField('add-workday-activity');
              setActivityId(value);
              const selected = activities.find(
                (item) => String(item.id) === value,
              );
              if (!selected?.is_harvest) setPaymentMode('jornal');
            }}
            value={activityId}
          >
            <SelectTrigger
              aria-describedby="add-workday-activity-error"
              aria-invalid={feedback.field('add-workday-activity').invalid || undefined}
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

        <RateField
          feedback={feedback}
          id="add-workday-rate"
          label="¿Cuánto se le paga?"
          onChange={setRate}
          paymentMode={paymentMode}
          value={rate}
        />
      </div>

      <PaymentModeField
        kilogramAvailable={kilogramPaymentAvailable}
        name="add-workday-payment-mode"
        onChange={setPaymentMode}
        value={paymentMode}
      />

      <CheckboxListField
        emptyMessage="No hay lotes activos en esta finca."
        feedback={feedback}
        getLabel={(lot) => lot.nombre || lot.name || 'Lote sin nombre'}
        id="add-workday-lots"
        items={activeLots}
        legend="Lotes"
        onToggle={(id) => setLotIds((current) => toggleId(current, id))}
        selectedIds={lotIds}
      />
    </FormDialog>
  );
}
