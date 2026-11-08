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

export default function FarmFormDialog({
  open,
  onOpenChange,
  farm,
  onSave,
}) {
  const [name, setName] = useState(farm?.nombre || '');
  const [location, setLocation] = useState(farm?.location || '');
  const [description, setDescription] = useState(farm?.description || '');
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();
    setSaving(true);
    try {
      const result = await onSave({
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
      });
      if (result) {
        feedback.setFormError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar la finca:', saveError);
      feedback.setFormError(
        saveError.message ||
          'No se pudo guardar la finca. Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl text-foreground">
            {farm ? 'Editar finca' : 'Agregar finca'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Registra el nombre, ubicación y descripción de esta finca.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          {...feedback.formProps}
          onSubmit={handleSubmit}
        >
          <FormField
            {...feedback.field('farm-name')}
            htmlFor="farm-name"
            label="Nombre de la finca"
          >
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              data-required-message="Escribe el nombre de la finca."
              id="farm-name"
              maxLength={150}
              minLength={2}
              name="finca"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Finca San José…"
              required
              value={name}
            />
          </FormField>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-ink-soft"
              htmlFor="farm-location"
            >
              Ubicación (opcional)
            </label>
            <Input
              className="h-11 rounded-xl"
              id="farm-location"
              maxLength={150}
              name="location"
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ej. Vereda El Tablón…"
              value={location}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-ink-soft"
              htmlFor="farm-description"
            >
              Descripción (opcional)
            </label>
            <textarea
              className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              id="farm-description"
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalles adicionales de la finca…"
              value={description}
            />
          </div>
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
              {saving ? 'Guardando…' : 'Guardar finca'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
