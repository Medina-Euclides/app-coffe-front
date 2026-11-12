// Formulario para agregar o editar un trabajador.
import { useState } from 'react';
import FormDialog from '#components/shared/FormDialog';
import { CedulaField, NameField, PhoneField } from '#components/shared/FormFields';
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
      <NameField
        autoComplete="off"
        data-required-message="Escribe el nombre del trabajador."
        feedback={feedback}
        id="worker-first-name"
        label="Nombre"
        name="first_name"
        onChange={(event) => setFirstName(event.target.value)}
        placeholder="Ej. María…"
        required
        value={firstName}
      />
      <NameField
        autoComplete="family-name"
        data-required-message="Escribe el apellido del trabajador."
        feedback={feedback}
        id="worker-last-name"
        kind="apellido"
        label="Apellido"
        name="last_name"
        onChange={(event) => setLastName(event.target.value)}
        placeholder="Ej. Gómez…"
        required
        value={lastName}
      />
      <CedulaField
        autoComplete="off"
        feedback={feedback}
        id="worker-id"
        label="Cédula (opcional)"
        name="identification"
        onChange={(event) => setIdentification(event.target.value)}
        placeholder="Ej. 1061234567…"
        value={identification}
      />
      <PhoneField
        autoComplete="tel"
        feedback={feedback}
        id="worker-phone"
        label="Teléfono (opcional)"
        name="phone"
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Ej. 3001234567…"
        value={phone}
      />
    </FormDialog>
  );
}
