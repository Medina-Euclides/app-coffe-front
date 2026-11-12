import { useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '#services/api';
import FormDialog from '#components/shared/FormDialog';
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
import { useApiList } from '#hooks/useApiList';
import ErrorBanner from '#components/shared/ErrorBanner';
import LoadingState from '#components/shared/LoadingState';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { validateRate } from '#lib/validation';
import { getParticipantDetails, getReferenceId } from '#lib/domain/entities';

export default function EditWorkdayLaborDialog({
  workday,
  open,
  onOpenChange,
  onSave,
}) {
  const [activityId, setActivityId] = useState('');
  const [paymentMode, setPaymentMode] = useState('jornal');
  const [rate, setRate] = useState('');
  const feedback = useFormFeedback();

  const currentParticipants = (workday?.participants || []).filter(
    (participant) => participant.settlementStatus !== 'anulado',
  );
  const currentParticipant =
    currentParticipants.find(
      (participant) => participant.settlementStatus === 'pendiente',
    ) || currentParticipants[0];
  const hasHarvestRecords = currentParticipants.some((participant) =>
    getParticipantDetails(participant).some(
      (detail) =>
        Array.isArray(detail.harvest_records) &&
        detail.harvest_records.length > 0,
    ),
  );

  // Al abrir, propone la actividad, modalidad y tarifa actuales de la jornada.
  const applyDefaults = (loadedActivities) => {
    const firstDetail = getParticipantDetails(currentParticipant)[0];
    setActivityId(
      String(getReferenceId(firstDetail?.activity_type) || loadedActivities[0]?.id || ''),
    );
    setPaymentMode(
      currentParticipant?.paymentMode || currentParticipant?.payment_mode || 'jornal',
    );
    setRate(String(currentParticipant?.rate ?? currentParticipant?.agreed_rate ?? ''));
  };
  const {
    data: activities,
    loading,
    error: loadError,
    refetch,
  } = useApiList(`edit-labor:${workday?.id}`, api.activities.list, {
    enabled: Boolean(open && workday),
    refreshOnSync: false,
    onSuccess: applyDefaults,
  });
  const activity = activities.find((item) => String(item.id) === activityId);

  const handleSubmit = async () => {

    if (workday?.status !== 'abierta') {
      feedback.setFormError('Esta jornada ya está cerrada y no se puede modificar.');
      return false;
    }
    if (!currentParticipants.length) {
      feedback.setFormError('La jornada no tiene trabajadores. Agrega al menos uno antes de editarla.');
      return false;
    }
    if (!activity) {
      feedback.setFieldError('edit-workday-activity', 'Elige qué actividad se hizo.');
      return false;
    }
    if (paymentMode === 'kg' && !activity.is_harvest) {
      feedback.setFormError(
        'El pago por kilo solo aplica a actividades de recolección. Elige pago por jornal.',
      );
      return false;
    }
    if (paymentMode === 'jornal' && hasHarvestRecords) {
      feedback.setFormError(
        'Esta jornada ya tiene pesajes registrados, así que debe seguir con pago por kilo.',
      );
      return false;
    }

    const agreedRate = Number(rate);
    const rateError = validateRate(rate, paymentMode);
    if (rateError) {
      feedback.setFieldError('edit-workday-rate', rateError);
      return false;
    }

    await onSave({
      activity_type: activity.id,
      payment_mode: paymentMode,
      agreed_rate: agreedRate,
    });
    return '';
  };


  const kilogramPaymentAvailable = Boolean(activity?.is_harvest);

  return (
    <FormDialog
      className="sm:max-w-xl"
      description="Aplica a todos los trabajadores. Fecha y finca no cambian."
      disabled={!currentParticipants.length || workday?.status !== 'abierta'}
      errorFallback="No se pudo actualizar la jornada. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      open={open}
      size="lg"
      status={
        loading ? (
          <LoadingState className="py-10" spinner>
            Cargando actividades…
          </LoadingState>
        ) : loadError ? (
          <ErrorBanner message={loadError} onRetry={refetch} retryLabel="Intentar de nuevo" />
        ) : null
      }
      submitIcon={Save}
      submitLabel="Guardar cambios"
      title="Editar jornada"
    >
      {currentParticipants.length > 1 && (
        <p className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-primary">
          Se actualizarán {currentParticipants.length} trabajadores.
        </p>
      )}

      <FormField
        {...feedback.field('edit-workday-activity')}
        htmlFor="edit-workday-activity"
        label="¿Qué se hizo?"
        labelClassName="font-semibold text-primary"
        required
      >
        <Select
          onValueChange={(value) => {
            feedback.clearField('edit-workday-activity');
            setActivityId(value);
            const selected = activities.find(
              (item) => String(item.id) === value,
            );
            if (!selected?.is_harvest) setPaymentMode('jornal');
          }}
          value={activityId}
        >
          <SelectTrigger
            aria-describedby="edit-workday-activity-error"
            aria-invalid={feedback.field('edit-workday-activity').invalid || undefined}
            className="h-11 w-full rounded-xl border-input bg-card px-3 text-sm text-foreground"
            id="edit-workday-activity"
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

      <PaymentModeField
        kilogramAvailable={kilogramPaymentAvailable}
        name="edit-workday-payment-mode"
        onChange={setPaymentMode}
        value={paymentMode}
      />

      <RateField
        feedback={feedback}
        id="edit-workday-rate"
        onChange={setRate}
        paymentMode={paymentMode}
        value={rate}
      />
    </FormDialog>
  );
}
