// Formulario para agregar o editar un lote de una finca.
import { useState } from 'react';
import FormDialog from '#components/shared/FormDialog';
import { SelectField, TextareaField, TextField } from '#components/shared/FormFields';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { VARIEDADES_CAFE } from '#lib/constants';

const toFieldValue = (value) => (value === null || value === undefined ? '' : String(value));

export default function LotFormDialog({ open, onOpenChange, lot, farmName, onSave }) {
  const [name, setName] = useState(lot?.nombre || '');
  const [variety, setVariety] = useState(lot?.variedad || 'Castillo');
  const [hectares, setHectares] = useState(toFieldValue(lot?.hectareas));
  const [plantCount, setPlantCount] = useState(toFieldValue(lot?.plant_count));
  const [description, setDescription] = useState(lot?.description || '');
  const feedback = useFormFeedback();

  return (
    <FormDialog
      description={`Este lote quedará asociado a ${farmName}.`}
      errorFallback="No se pudo guardar el lote. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={() =>
        onSave({
          nombre: name.trim(),
          variedad: variety,
          hectareas: hectares ? Number(hectares) : null,
          plantCount: plantCount === '' ? null : Number(plantCount),
          description: description.trim(),
        })
      }
      open={open}
      submitLabel="Guardar lote"
      title={lot ? 'Editar lote' : 'Agregar lote'}
    >
      <TextField
        autoComplete="off"
        data-required-message="Escribe el nombre del lote."
        feedback={feedback}
        id="lot-name"
        label="Nombre del lote"
        maxLength={150}
        minLength={2}
        name="lote"
        onChange={(event) => setName(event.target.value)}
        placeholder="Ej. El Mirador…"
        required
        value={name}
      />
      <TextField
        feedback={feedback}
        id="lot-plant-count"
        label="¿Cuántas plantas? (opcional)"
        min="0"
        name="plant_count"
        onChange={(event) => setPlantCount(event.target.value)}
        placeholder="Ej. 1200"
        step="1"
        type="number"
        value={plantCount}
      />
      <SelectField
        feedback={feedback}
        id="lot-variety"
        label="¿Qué variedad?"
        name="variedad"
        onChange={(event) => setVariety(event.target.value)}
        options={VARIEDADES_CAFE}
        value={variety}
      />
      <TextField
        feedback={feedback}
        id="lot-hectares"
        label="Área (hectáreas, opcional)"
        min="0.1"
        name="hectareas"
        onChange={(event) => setHectares(event.target.value)}
        placeholder="Ej. 2.5…"
        step="0.1"
        type="number"
        value={hectares}
      />
      <TextareaField
        feedback={feedback}
        id="lot-description"
        label="Descripción (opcional)"
        name="description"
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Detalles adicionales del lote…"
        value={description}
      />
    </FormDialog>
  );
}
