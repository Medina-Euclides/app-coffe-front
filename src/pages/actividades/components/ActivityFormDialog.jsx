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

function CheckField({ checked, id, label, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm text-ink-soft" htmlFor={id}>
      <input
        checked={checked}
        className="mt-0.5 size-4 accent-primary"
        id={id}
        onChange={onChange}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

export default function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  onSave,
}) {
  const [name, setName] = useState(activity?.name || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [isHarvest, setIsHarvest] = useState(activity?.is_harvest || false);
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();
    setSaving(true);
    try {
      const result = await onSave({
        name: name.trim(),
        description: description.trim(),
        is_harvest: isHarvest,
      });
      if (result) {
        feedback.setFormError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el tipo de actividad:', saveError);
      feedback.setFormError(saveError.message || 'No se pudo guardar la actividad. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl text-foreground">
            {activity ? 'Editar actividad laboral' : 'Nueva actividad laboral'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Define el nombre, descripción y si esta labor corresponde a recolección.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          {...feedback.formProps}
          onSubmit={handleSubmit}
        >
          <FormField
            {...feedback.field('activity-name')}
            htmlFor="activity-name"
            label="¿Cómo se llama la labor?"
          >
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              data-required-message="Escribe el nombre de la actividad."
              id="activity-name"
              maxLength={150}
              minLength={2}
              name="actividad"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Preparación del almácigo…"
              required
              value={name}
            />
          </FormField>
          <FormField
            {...feedback.field('activity-description')}
            htmlFor="activity-description"
            label="Descripción (opcional)"
          >
            <Input
              className="h-11 rounded-xl"
              id="activity-description"
              maxLength={150}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Recolección de cerezas maduras…"
              value={description}
            />
          </FormField>
          <CheckField
            checked={isHarvest}
            id="activity-harvest"
            label="Es recolección (se paga por kilo)"
            onChange={(event) => setIsHarvest(event.target.checked)}
          />
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
              {saving ? 'Guardando…' : 'Guardar actividad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
