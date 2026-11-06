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

export default function FarmFormDialog({
  open,
  onOpenChange,
  farm,
  onSave,
}) {
  const [name, setName] = useState(farm?.nombre || '');
  const [location, setLocation] = useState(farm?.location || '');
  const [description, setDescription] = useState(farm?.description || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = await onSave({
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
      });
      if (result) {
        setError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar la finca:', saveError);
      setError(saveError.message || 'No se pudo guardar la finca.');
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
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-ink-soft"
              htmlFor="farm-name"
            >
              Nombre de la finca
            </label>
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              id="farm-name"
              maxLength={150}
              minLength={2}
              name="finca"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Finca San José…"
              required
              value={name}
            />
          </div>
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
          {error && (
            <p aria-live="polite" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
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
