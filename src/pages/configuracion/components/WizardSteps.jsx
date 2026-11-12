// Pasos del asistente de configuración inicial. Cada paso valida sus campos antes de
// avanzar; el último guarda todo (ver useSetupWizard).
import { CardContent } from '#components/ui/card';
import { FormAlert } from '#components/shared/FormFeedback';
import { CedulaField, EntityNameField, NameField, SelectField, TextField } from '#components/shared/FormFields';
import { VARIEDADES_CAFE } from '#lib/constants';
import {
  TEXT_LIMITS,
  sanitizeHectares,
  sanitizeLabelText,
  sanitizePlantCount,
  validateEntityName,
  validateHectares,
  validateLabelText,
  validatePlantCount,
} from '#lib/validation';
import WizardActions, { WizardPrimaryButton } from './WizardActions.jsx';

const validateLocation = (value) => validateLabelText(value, { label: 'la ubicación', min: 3 });

const inputClass = 'h-12 rounded-xl px-4';
const labelClass = 'font-medium text-foreground';

function StepForm({ wizard, onSubmit, children }) {
  const { feedback } = wizard;
  return (
    <CardContent className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
      <form
        className="space-y-5"
        {...feedback.formProps}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />
      </form>
    </CardContent>
  );
}

// Avanza si el campo obligatorio tiene texto; si no, marca el error en el campo.
function requireThen(wizard, field, fieldId, message, nextPaso) {
  return () => {
    if (!wizard.values[field].trim()) {
      wizard.feedback.setFieldError(fieldId, message);
      return;
    }
    wizard.feedback.clearFormError();
    wizard.goTo(nextPaso);
  };
}

export function StepWelcome({ wizard }) {
  return (
    <CardContent className="space-y-6 px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
      <div className="rounded-2xl border border-border bg-tint p-5">
        <h2 className="font-semibold text-foreground">Lo que vas a configurar</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-ink-soft">
          <li>El nombre y la ubicación de tu finca.</li>
          <li>El nombre, la variedad y el área de tu primer lote.</li>
          <li>El número de plantas de café de tu lote (opcional).</li>
          <li>Una actividad para registrar la recolección de café.</li>
          <li>Tu primer trabajador, para empezar a registrar jornadas.</li>
        </ul>
      </div>
      <WizardPrimaryButton className="w-full" onClick={() => wizard.goTo(2)} type="button">
        Configurar mi finca
      </WizardPrimaryButton>
    </CardContent>
  );
}

export function StepFarm({ wizard }) {
  const { feedback, values, setValue } = wizard;
  return (
    <StepForm
      onSubmit={requireThen(wizard, 'nombreFinca', 'nombre-finca', 'Escribe el nombre de tu finca.', 3)}
      wizard={wizard}
    >
      <EntityNameField
        className={inputClass}
        data-required-message="Escribe el nombre de tu finca."
        feedback={feedback}
        id="nombre-finca"
        kind="farm"
        label="Nombre de la finca"
        labelClassName={labelClass}
        name="farmName"
        onChange={setValue('nombreFinca')}
        placeholder="Ej.: Finca El Roble…"
        required
        value={values.nombreFinca}
      />
      <TextField
        autoComplete="off"
        className={inputClass}
        feedback={feedback}
        id="ubicacion-finca"
        label="¿Dónde queda? (opcional)"
        labelClassName={labelClass}
        maxLength={TEXT_LIMITS.location}
        name="farmLocation"
        onChange={setValue('ubicacion')}
        placeholder="Ej.: Vereda El Roble…"
        sanitize={sanitizeLabelText}
        validate={validateLocation}
        value={values.ubicacion}
      />
      <WizardActions onBack={() => wizard.goTo(1)} primaryLabel="Continuar al lote" />
    </StepForm>
  );
}

export function StepLot({ wizard }) {
  const { feedback, values, setValue, guardando, creados } = wizard;
  return (
    <StepForm
      onSubmit={requireThen(wizard, 'nombreLote', 'nombre-lote', 'Escribe el nombre de tu lote.', 4)}
      wizard={wizard}
    >
      <EntityNameField
        className={inputClass}
        data-required-message="Escribe el nombre de tu lote."
        feedback={feedback}
        id="nombre-lote"
        kind="lot"
        label="Nombre del lote"
        labelClassName={labelClass}
        name="lotName"
        onChange={setValue('nombreLote')}
        placeholder="Ej.: Lote El Mirador…"
        required
        value={values.nombreLote}
      />
      <SelectField
        className="h-12 bg-background px-4"
        feedback={feedback}
        id="variedad-lote"
        label="¿Qué variedad?"
        labelClassName={labelClass}
        name="coffeeVariety"
        onChange={setValue('variedad')}
        options={VARIEDADES_CAFE}
        value={values.variedad}
      />
      <TextField
        autoComplete="off"
        className={inputClass}
        feedback={feedback}
        id="hectareas-lote"
        inputMode="decimal"
        label="Área (hectáreas, opcional)"
        labelClassName={labelClass}
        name="areaHectares"
        onChange={setValue('hectareas')}
        placeholder="Ej.: 2,5…"
        sanitize={sanitizeHectares}
        validate={validateHectares}
        value={values.hectareas}
      />
      <TextField
        autoComplete="off"
        className={inputClass}
        feedback={feedback}
        id="plantas-lote"
        inputMode="numeric"
        label="¿Cuántas plantas? (opcional)"
        labelClassName={labelClass}
        name="plantCount"
        onChange={setValue('plantas')}
        placeholder="Ej.: 1200…"
        sanitize={sanitizePlantCount}
        validate={validatePlantCount}
        value={values.plantas}
      />
      <WizardActions
        backDisabled={guardando || Boolean(creados.finca)}
        onBack={() => wizard.goTo(2)}
        primaryDisabled={guardando}
        primaryLabel="Continuar a la actividad"
      />
    </StepForm>
  );
}

export function StepActivity({ wizard }) {
  const { feedback, values, setValue, clearValue, guardando, creados } = wizard;
  const submit = () => {
    const error = validateEntityName(values.nombreActividad, 'activity');
    if (error) {
      feedback.setFieldError('nombre-actividad', `${error} O usa la predeterminada.`);
      return;
    }
    feedback.clearFormError();
    wizard.goTo(5);
  };
  return (
    <StepForm onSubmit={submit} wizard={wizard}>
      <EntityNameField
        className={inputClass}
        feedback={feedback}
        hint="La actividad quedará marcada como recolección y se usará de forma predeterminada al registrar pesajes."
        id="nombre-actividad"
        kind="activity"
        label="¿Cómo se llama la labor?"
        labelClassName={labelClass}
        name="activityName"
        onChange={setValue('nombreActividad')}
        placeholder="Ej.: Recolección de café…"
        value={values.nombreActividad}
      />
      <WizardActions
        backDisabled={guardando || Boolean(creados.lote)}
        onBack={() => wizard.goTo(3)}
        onSecondary={() => {
          clearValue('nombreActividad');
          wizard.goTo(5);
        }}
        primaryDisabled={guardando}
        primaryLabel="Continuar al trabajador"
        secondaryDisabled={guardando}
        secondaryLabel="Usar la predeterminada"
      />
    </StepForm>
  );
}

export function StepWorker({ wizard }) {
  const { feedback, values, setValue, guardando, creados, guardarConfiguracion } = wizard;
  const locked = Boolean(creados.trabajador);
  return (
    <StepForm onSubmit={() => guardarConfiguracion()} wizard={wizard}>
      <div className="grid gap-5 sm:grid-cols-2">
        <NameField
          autoComplete="off"
          className={inputClass}
          data-required-message="Escribe el nombre del trabajador, o toca Omitir por ahora."
          disabled={locked}
          feedback={feedback}
          id="nombre-trabajador"
          label="Nombre"
          labelClassName={labelClass}
          name="first_name"
          onChange={setValue('nombreTrabajador')}
          placeholder="Ej.: María…"
          required
          value={values.nombreTrabajador}
        />
        <NameField
          autoComplete="off"
          className={inputClass}
          data-required-message="Escribe el apellido del trabajador."
          disabled={locked}
          feedback={feedback}
          id="apellido-trabajador"
          kind="apellido"
          label="Apellido"
          labelClassName={labelClass}
          name="last_name"
          onChange={setValue('apellidoTrabajador')}
          placeholder="Ej.: Gómez…"
          required
          value={values.apellidoTrabajador}
        />
      </div>
      <CedulaField
        autoComplete="off"
        className={inputClass}
        disabled={locked}
        feedback={feedback}
        hint="El teléfono y los demás datos los puedes completar luego en Trabajadores."
        id="cedula-trabajador"
        label="Cédula (opcional)"
        labelClassName={labelClass}
        name="identification"
        onChange={setValue('cedulaTrabajador')}
        placeholder="Ej.: 1061234567…"
        value={values.cedulaTrabajador}
      />
      <WizardActions
        backDisabled={guardando || Boolean(creados.actividad)}
        onBack={() => wizard.goTo(4)}
        onSecondary={() => guardarConfiguracion({ conTrabajador: false })}
        primaryDisabled={guardando}
        primaryLabel={guardando ? 'Guardando…' : 'Guardar y entrar'}
        secondaryDisabled={guardando || locked}
        secondaryLabel="Omitir por ahora"
      />
    </StepForm>
  );
}
