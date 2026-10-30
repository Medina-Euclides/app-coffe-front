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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        identification: identification.trim(),
        phone: phone.trim(),
      });
      if (result) {
        setError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el trabajador:', saveError);
      setError(saveError.message || 'No se pudo guardar el trabajador.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            {worker ? 'Editar trabajador' : 'Agregar trabajador'}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Registra los datos básicos de la persona que trabaja en tus fincas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="worker-first-name"
            >
              Nombre
            </label>
            <Input
              autoComplete="off"
              className="h-11 rounded-xl"
              id="worker-first-name"
              maxLength={150}
              name="first_name"
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Ej. María…"
              required
              value={firstName}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="worker-last-name"
            >
              Apellido
            </label>
            <Input
              autoComplete="family-name"
              className="h-11 rounded-xl"
              id="worker-last-name"
              maxLength={150}
              name="last_name"
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Ej. Gómez…"
              required
              value={lastName}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="worker-id"
            >
              Identificación (opcional)
            </label>
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
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-[#36483a]"
              htmlFor="worker-phone"
            >
              Teléfono (opcional)
            </label>
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
              {saving ? 'Guardando…' : 'Guardar trabajador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
