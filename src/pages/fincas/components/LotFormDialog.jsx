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

const variedadesCafe = ['Castillo', 'Caturra', 'Colombia', 'Borbón', 'Geisha'];

export default function LotFormDialog({
  open,
  onOpenChange,
  lot,
  farmName,
  onSave,
}) {
  const [name, setName] = useState(lot?.nombre || '');
  const [variety, setVariety] = useState(lot?.variedad || 'Castillo');
  const [hectares, setHectares] = useState(
    lot?.hectareas === null || lot?.hectareas === undefined
      ? ''
      : String(lot.hectareas),
  );
  const [plantCount, setPlantCount] = useState(
    lot?.plant_count === null || lot?.plant_count === undefined
      ? ''
      : String(lot.plant_count),
  );
  const [description, setDescription] = useState(lot?.description || '');
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();
    setSaving(true);
    try {
      const result = await onSave({
        nombre: name.trim(),
        variedad: variety,
        hectareas: hectares ? Number(hectares) : null,
        plantCount: plantCount === '' ? null : Number(plantCount),
        description: description.trim(),
      });
      if (result) {
        feedback.setFormError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el lote:', saveError);
      feedback.setFormError(
        saveError.message ||
          'No se pudo guardar el lote. Revisa tu conexión e inténtalo de nuevo.',
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
            {lot ? 'Editar lote' : 'Agregar lote'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Este lote quedará asociado a {farmName}.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          {...feedback.formProps}
          onSubmit={handleSubmit}
        >
          <FormField
            {...feedback.field('lot-name')}
            htmlFor="lot-name"
            label="Nombre del lote"
          >
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              data-required-message="Escribe el nombre del lote."
              id="lot-name"
              maxLength={150}
              minLength={2}
              name="lote"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. El Mirador…"
              required
              value={name}
            />
          </FormField>
          <FormField
            {...feedback.field('lot-plant-count')}
            htmlFor="lot-plant-count"
            label="¿Cuántas plantas? (opcional)"
          >
            <Input
              className="h-11 rounded-xl"
              id="lot-plant-count"
              min="0"
              name="plant_count"
              onChange={(event) => setPlantCount(event.target.value)}
              placeholder="Ej. 1200"
              step="1"
              type="number"
              value={plantCount}
            />
          </FormField>
          <FormField
            {...feedback.field('lot-variety')}
            htmlFor="lot-variety"
            label="¿Qué variedad?"
          >
            <select
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm"
              id="lot-variety"
              name="variedad"
              onChange={(event) => setVariety(event.target.value)}
              value={variety}
            >
              {variedadesCafe.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            {...feedback.field('lot-hectares')}
            htmlFor="lot-hectares"
            label="Área (hectáreas, opcional)"
          >
            <Input
              className="h-11 rounded-xl"
              id="lot-hectares"
              min="0.1"
              name="hectareas"
              onChange={(event) => setHectares(event.target.value)}
              placeholder="Ej. 2.5…"
              step="0.1"
              type="number"
              value={hectares}
            />
          </FormField>
          <FormField
            {...feedback.field('lot-description')}
            htmlFor="lot-description"
            label="Descripción (opcional)"
          >
            <textarea
              className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              id="lot-description"
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalles adicionales del lote…"
              value={description}
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
              {saving ? 'Guardando…' : 'Guardar lote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
