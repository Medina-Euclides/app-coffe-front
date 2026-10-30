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

function CheckField({ checked, id, label, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-[#e2e8de] p-3 text-sm text-[#36483a]" htmlFor={id}>
      <input
        checked={checked}
        className="mt-0.5 size-4 accent-emerald-800"
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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = await onSave({
        name: name.trim(),
        description: description.trim(),
        is_harvest: isHarvest,
      });
      if (result) {
        setError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el tipo de actividad:', saveError);
      setError(saveError.message || 'No se pudo guardar el tipo de actividad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            {activity ? 'Editar actividad laboral' : 'Nueva actividad laboral'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Define el nombre, descripción y si esta labor corresponde a recolección.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="activity-name"
            >
              Nombre de la actividad
            </label>
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              id="activity-name"
              maxLength={150}
              minLength={2}
              name="actividad"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Preparación del almácigo…"
              required
              value={name}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="activity-description"
            >
              Descripción (opcional)
            </label>
            <Input
              className="h-11 rounded-xl"
              id="activity-description"
              maxLength={150}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej. Recolección de cerezas maduras…"
              value={description}
            />
          </div>
          <CheckField
            checked={isHarvest}
            id="activity-harvest"
            label="Es una actividad de recolección de café. Habilita su uso con pago por kilogramo."
            onChange={(event) => setIsHarvest(event.target.checked)}
          />
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
              {saving ? 'Guardando…' : 'Guardar actividad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
