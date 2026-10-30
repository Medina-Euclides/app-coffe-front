import { useState } from 'react';
import { Button } from '../ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.jsx';
import { Input } from '../ui/input.jsx';

export default function FarmFormDialog({
  open,
  onOpenChange,
  farm,
  onSave,
}) {
  const [name, setName] = useState(farm?.nombre || '');
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
            {farm ? 'Editar finca' : 'Agregar finca'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Registra el nombre con el que identificas esta finca.
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
              maxLength={100}
              minLength={2}
              name="finca"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Finca San José…"
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
              Guardar finca
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
