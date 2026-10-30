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
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            {farm ? 'Editar finca' : 'Agregar finca'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Registra el nombre, ubicación y descripción de esta finca.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
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
              className="text-sm font-medium text-[#36483a]"
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
              className="text-sm font-medium text-[#36483a]"
              htmlFor="farm-description"
            >
              Descripción (opcional)
            </label>
            <textarea
              className="min-h-24 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-[#263b2c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48]"
              id="farm-description"
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalles adicionales de la finca…"
              value={description}
            />
          </div>
          {error && (
            <p aria-live="polite" className="text-sm text-red-700" role="alert">
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
              className="min-h-11 rounded-xl bg-[#214b32] text-white hover:bg-[#173d2b]"
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
