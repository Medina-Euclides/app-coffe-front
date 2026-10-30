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
  const [description, setDescription] = useState(lot?.description || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = await onSave({
        nombre: name.trim(),
        variedad: variety,
        hectareas: hectares ? Number(hectares) : null,
        description: description.trim(),
      });
      if (result) {
        setError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el lote:', saveError);
      setError(saveError.message || 'No se pudo guardar el lote.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            {lot ? 'Editar lote' : 'Agregar lote'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Este lote quedará asociado a {farmName}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="lot-name"
            >
              Nombre del lote
            </label>
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              id="lot-name"
              maxLength={150}
              minLength={2}
              name="lote"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. El Mirador…"
              required
              value={name}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="lot-variety"
            >
              Variedad de café
            </label>
            <select
              className="h-11 w-full rounded-xl border border-input bg-white px-3 text-base text-[#263b2c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48] md:text-sm"
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
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="lot-hectares"
            >
              Área en hectáreas (opcional)
            </label>
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
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="lot-description"
            >
              Descripción (opcional)
            </label>
            <textarea
              className="min-h-24 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-[#263b2c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48]"
              id="lot-description"
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalles adicionales del lote…"
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
              {saving ? 'Guardando…' : 'Guardar lote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
