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

function getReferenceId(reference) {
  if (reference && typeof reference === 'object') return reference.id;
  return reference;
}

function getParticipantDetails(participant) {
  return Array.isArray(participant?.details) ? participant.details : [];
}

export default function EditWorkdayLaborDialog({
  workday,
  open,
  onOpenChange,
  onSave,
}) {
  const [activities, setActivities] = useState([]);
  const [activityId, setActivityId] = useState('');
  const [paymentMode, setPaymentMode] = useState('jornal');
  const [rate, setRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  const currentParticipants = (workday?.participants || []).filter(
    (participant) => participant.settlementStatus !== 'anulado',
  );
  const currentParticipant =
    currentParticipants.find(
      (participant) => participant.settlementStatus === 'pendiente',
    ) || currentParticipants[0];
  const activity = activities.find(
    (item) => String(item.id) === activityId,
  );
  const hasHarvestRecords = currentParticipants.some((participant) =>
    getParticipantDetails(participant).some(
      (detail) =>
        Array.isArray(detail.harvest_records) &&
        detail.harvest_records.length > 0,
    ),
  );

  useEffect(() => {
    if (!open || !workday) return undefined;
    let active = true;

    api.activities
      .list()
      .then((loadedActivities) => {
        if (!active) return;
        setActivities(loadedActivities);
        const firstDetail = getParticipantDetails(currentParticipant)[0];
        setActivityId(
          String(
            getReferenceId(firstDetail?.activity_type) ||
              loadedActivities[0]?.id ||
              '',
          ),
        );
        setPaymentMode(
          currentParticipant?.paymentMode ||
            currentParticipant?.payment_mode ||
            'jornal',
        );
        setRate(
          String(
            currentParticipant?.rate ??
              currentParticipant?.agreed_rate ??
              '',
          ),
        );
      })
      .catch((requestError) => {
        if (!active) return;
        console.error('Error al cargar actividades para editar jornada:', requestError);
        setLoadError(
          requestError.message || 'No se pudieron cargar las actividades.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentParticipant, open, retry, workday]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (workday?.status !== 'abierta') {
      setError('No se puede modificar una jornada cerrada.');
      return;
    }
    if (!activity || !currentParticipants.length) {
      setError('La jornada debe tener trabajadores y una actividad válida.');
      return;
    }
    if (paymentMode === 'kg' && !activity.is_harvest) {
      setError('El pago por kilogramo solo aplica a actividades de recolección.');
      return;
    }
    if (paymentMode === 'jornal' && hasHarvestRecords) {
      setError(
        'No se puede cambiar a pago por jornal porque la jornada tiene pesajes registrados.',
      );
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
        activity_type: activity.id,
        payment_mode: paymentMode,
        agreed_rate: agreedRate,
      });
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al actualizar los datos de la jornada:', saveError);
      setError(saveError.message || 'No se pudo actualizar la jornada.');
    } finally {
      setSaving(false);
    }
  };

  const kilogramPaymentAvailable = Boolean(activity?.is_harvest);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl border-border p-5 sm:max-w-xl sm:p-7">
        <DialogHeader className="border-b border-border/60 pb-4 pr-8">
          <DialogTitle className="text-2xl text-foreground sm:text-[1.75rem]">
            Editar jornada
          </DialogTitle>
          <DialogDescription className="leading-5">
            Los cambios se aplicarán a todos los trabajadores activos y a sus
            detalles. La fecha y la finca no se modificarán.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p
            aria-live="polite"
            className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
            role="status"
          >
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Cargando actividades…
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
            {currentParticipants.length > 1 && (
              <p className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-primary">
                Se actualizarán {currentParticipants.length} trabajadores.
              </p>
            )}

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-primary"
                htmlFor="edit-workday-activity"
              >
                Actividad <span aria-hidden="true">*</span>
              </label>
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
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-primary">
                Modalidad de pago <span aria-hidden="true">*</span>
              </legend>
              <div className="grid h-11 grid-cols-2 rounded-xl border border-border bg-muted p-1">
                {[
                  ['jornal', 'Por jornal'],
                  ['kg', 'Pago por kg'],
                ].map(([value, label]) => {
                  const disabled =
                    value === 'kg' && !kilogramPaymentAvailable;
                  return (
                    <label
                      className={`flex items-center justify-center rounded-lg px-2 text-sm font-medium ${
                        disabled
                          ? 'cursor-not-allowed text-subtle'
                          : 'cursor-pointer text-ink-soft has-[:checked]:bg-primary has-[:checked]:text-primary-foreground'
                      }`}
                      key={value}
                    >
                      <input
                        checked={paymentMode === value}
                        className="sr-only"
                        disabled={disabled}
                        name="edit-workday-payment-mode"
                        onChange={() => setPaymentMode(value)}
                        type="radio"
                        value={value}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-primary"
                htmlFor="edit-workday-rate"
              >
                {paymentMode === 'kg'
                  ? 'Tarifa por kg (COP)'
                  : 'Valor del jornal (COP)'}{' '}
                <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <MoneyInput
                  className="h-11 rounded-xl border-input bg-card pl-8 text-sm text-foreground"
                  id="edit-workday-rate"
                  onValueChange={setRate}
                  required
                  value={rate}
                />
              </div>
            </div>

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
                disabled={
                  saving ||
                  !currentParticipants.length ||
                  workday?.status !== 'abierta'
                }
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
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
