// Formulario para agregar o editar un trabajador.
import { useState } from 'react';
import FormDialog from '#components/shared/FormDialog';
import { TextField } from '#components/shared/FormFields';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { splitFullName } from '#lib/domain/workers';

export default function WorkerFormDialog({ open, onOpenChange, worker, onSave }) {
  const legacyName = splitFullName(worker?.nombre);
  const [firstName, setFirstName] = useState(worker?.first_name || legacyName.firstName);
  const [lastName, setLastName] = useState(worker?.last_name || legacyName.lastName);
  const [identification, setIdentification] = useState(
    worker?.identification || worker?.cedula || '',
  );
  const [phone, setPhone] = useState(worker?.phone || '');
  const feedback = useFormFeedback();

  return (
    <FormDialog
      description="Datos de quien trabaja en tu finca."
      errorFallback="No se pudo guardar el trabajador. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={() =>
        onSave({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          identification: identification.trim(),
          phone: phone.trim(),
        })
      }
      open={open}
      submitLabel="Guardar trabajador"
      title={worker ? 'Editar trabajador' : 'Agregar trabajador'}
    >
      <TextField
        autoComplete="off"
        data-required-message="Escribe el nombre del trabajador."
        feedback={feedback}
        id="worker-first-name"
        label="Nombre"
        maxLength={150}
        minLength={2}
        name="first_name"
        onChange={(event) => setFirstName(event.target.value)}
        placeholder="Ej. María…"
        required
        value={firstName}
      />
      <TextField
        autoComplete="family-name"
        data-required-message="Escribe el apellido del trabajador."
        feedback={feedback}
        id="worker-last-name"
        label="Apellido"
        maxLength={150}
        minLength={2}
        name="last_name"
        onChange={(event) => setLastName(event.target.value)}
        placeholder="Ej. Gómez…"
        required
        value={lastName}
      />
      <TextField
        autoComplete="off"
        feedback={feedback}
        id="worker-id"
        label="Cédula (opcional)"
        maxLength={150}
        name="identification"
        onChange={(event) => setIdentification(event.target.value)}
        placeholder="Ej. 1061234567…"
        type="text"
        value={identification}
      />
      <TextField
        autoComplete="tel"
        feedback={feedback}
        id="worker-phone"
        label="Teléfono (opcional)"
        maxLength={150}
        name="phone"
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Ej. 3001234567…"
        type="tel"
        value={phone}
      />
    </FormDialog>
  );
}
