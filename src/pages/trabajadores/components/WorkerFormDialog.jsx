import { useState } from 'react';
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
import { FormAlert, FormField } from '#components/shared/FormFeedback';
import { useFormFeedback } from '#hooks/useFormFeedback';

function splitLegacyName(fullName = '') {
  const [firstName = '', ...lastNames] = fullName.trim().split(/\s+/);
  return { firstName, lastName: lastNames.join(' ') };
}

export default function WorkerFormDialog({
  open,
  onOpenChange,
  worker,
  onSave,
}) {
  const legacyName = splitLegacyName(worker?.nombre);
  const [firstName, setFirstName] = useState(
    worker?.first_name || legacyName.firstName,
  );
  const [lastName, setLastName] = useState(
    worker?.last_name || legacyName.lastName,
  );
  const [identification, setIdentification] = useState(
    worker?.identification || worker?.cedula || '',
  );
  const [phone, setPhone] = useState(worker?.phone || '');
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();
    setSaving(true);
    try {
      const result = await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        identification: identification.trim(),
        phone: phone.trim(),
      });
      if (result) {
        feedback.setFormError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el trabajador:', saveError);
      feedback.setFormError(saveError.message || 'No se pudo guardar el trabajador. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl text-foreground">
            {worker ? 'Editar trabajador' : 'Agregar trabajador'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Datos de quien trabaja en tu finca.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          {...feedback.formProps}
          onSubmit={handleSubmit}
        >
          <FormField
            {...feedback.field('worker-first-name')}
            htmlFor="worker-first-name"
            label="Nombre"
          >
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              data-required-message="Escribe el nombre del trabajador."
              id="worker-first-name"
              maxLength={150}
              minLength={2}
              name="first_name"
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Ej. María…"
              required
              value={firstName}
            />
          </FormField>
          <FormField
            {...feedback.field('worker-last-name')}
            htmlFor="worker-last-name"
            label="Apellido"
          >
            <Input
              autoComplete="family-name"
              className="h-11 rounded-xl"
              data-required-message="Escribe el apellido del trabajador."
              id="worker-last-name"
              maxLength={150}
              minLength={2}
              name="last_name"
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Ej. Gómez…"
              required
              value={lastName}
            />
          </FormField>
          <FormField
            {...feedback.field('worker-id')}
            htmlFor="worker-id"
            label="Cédula (opcional)"
          >
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              id="worker-id"
              maxLength={150}
              name="identification"
              onChange={(event) => setIdentification(event.target.value)}
              placeholder="Ej. 1061234567…"
              type="text"
              value={identification}
            />
          </FormField>
          <FormField
            {...feedback.field('worker-phone')}
            htmlFor="worker-phone"
            label="Teléfono (opcional)"
          >
            <Input
              autoComplete="tel"
              className="h-11 rounded-xl"
              id="worker-phone"
              maxLength={150}
              name="phone"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ej. 3001234567…"
              type="tel"
              value={phone}
            />
          </FormField>
          <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              className="min-h-11 rounded-xl"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="min-h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Guardando…' : 'Guardar trabajador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
