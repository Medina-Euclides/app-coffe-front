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

export default function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  onSave,
}) {
  const [name, setName] = useState(activity || '');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = onSave(name.trim());
    if (result) {
      setError(result);
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            {activity ? 'Editar actividad laboral' : 'Nueva actividad laboral'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Registra un tipo de labor que puedas asignar en una jornada.
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
              maxLength={100}
              minLength={2}
              name="actividad"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Preparación del almácigo…"
              required
              value={name}
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
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="min-h-11 rounded-xl bg-[#214b32] text-white hover:bg-[#173d2b]"
              type="submit"
            >
              Guardar actividad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
