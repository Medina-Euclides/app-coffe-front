// Formulario para crear o editar un tipo de actividad laboral.
import { useState } from 'react';
import FormDialog from '#components/shared/FormDialog';
import { CheckField, EntityNameField, TextField } from '#components/shared/FormFields';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { TEXT_LIMITS, sanitizeLongText, validateLongText } from '#lib/validation';

export default function ActivityFormDialog({ open, onOpenChange, activity, onSave }) {
  const [name, setName] = useState(activity?.name || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [isHarvest, setIsHarvest] = useState(activity?.is_harvest || false);
  const feedback = useFormFeedback();

  return (
    <FormDialog
      description="Define el nombre, descripción y si esta labor corresponde a recolección."
      errorFallback="No se pudo guardar la actividad. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={() =>
        onSave({
          name: name.trim(),
          description: description.trim(),
          is_harvest: isHarvest,
        })
      }
      open={open}
      showDescription={false}
      submitLabel="Guardar actividad"
      title={activity ? 'Editar actividad laboral' : 'Nueva actividad laboral'}
    >
      <EntityNameField
        data-required-message="Escribe el nombre de la actividad."
        feedback={feedback}
        id="activity-name"
        kind="activity"
        label="¿Cómo se llama la labor?"
        name="actividad"
        onChange={(event) => setName(event.target.value)}
        placeholder="Ej. Preparación del almácigo…"
        required
        value={name}
      />
      <TextField
        feedback={feedback}
        id="activity-description"
        label="Descripción (opcional)"
        maxLength={TEXT_LIMITS.longText}
        name="description"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Ej. Recolección de cerezas maduras…"
        sanitize={sanitizeLongText}
        validate={validateLongText}
        value={description}
      />
      <CheckField
        checked={isHarvest}
        id="activity-harvest"
        label="Es recolección (se paga por kilo)"
        onChange={(event) => setIsHarvest(event.target.checked)}
      />
    </FormDialog>
  );
}
