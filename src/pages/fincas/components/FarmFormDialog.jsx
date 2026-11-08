// Formulario para agregar o editar una finca.
import { useState } from 'react';
import FormDialog from '#components/shared/FormDialog';
import { TextareaField, TextField } from '#components/shared/FormFields';
import { useFormFeedback } from '#hooks/useFormFeedback';

export default function FarmFormDialog({ open, onOpenChange, farm, onSave }) {
  const [name, setName] = useState(farm?.nombre || '');
  const [location, setLocation] = useState(farm?.location || '');
  const [description, setDescription] = useState(farm?.description || '');
  const feedback = useFormFeedback();

  return (
    <FormDialog
      description="Registra el nombre, ubicación y descripción de esta finca."
      errorFallback="No se pudo guardar la finca. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={() =>
        onSave({
          name: name.trim(),
          location: location.trim(),
          description: description.trim(),
        })
      }
      open={open}
      showDescription={false}
      submitLabel="Guardar finca"
      title={farm ? 'Editar finca' : 'Agregar finca'}
    >
      <TextField
        autoComplete="off"
        data-required-message="Escribe el nombre de la finca."
        feedback={feedback}
        id="farm-name"
        label="Nombre de la finca"
        maxLength={150}
        minLength={2}
        name="finca"
        onChange={(event) => setName(event.target.value)}
        placeholder="Ej. Finca San José…"
        required
        value={name}
      />
      <TextField
        feedback={feedback}
        id="farm-location"
        label="¿Dónde queda? (opcional)"
        maxLength={150}
        name="location"
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Ej. Vereda El Tablón…"
        value={location}
      />
      <TextareaField
        feedback={feedback}
        id="farm-description"
        label="Descripción (opcional)"
        name="description"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Detalles adicionales de la finca…"
        value={description}
      />
    </FormDialog>
  );
}
