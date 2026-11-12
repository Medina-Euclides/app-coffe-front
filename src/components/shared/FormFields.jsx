// Campos de formulario con etiqueta y error bajo el campo (FormField + control).
// `feedback` es el objeto de useFormFeedback; el `id` es también la clave del error.
import { Input } from '#components/ui/input';
import { FormField } from '#components/shared/FormFeedback';
import { cn } from '#lib/utils';
import { useValidatedInput } from '#hooks/useValidatedInput';
import {
  CEDULA_MAX_LENGTH,
  ENTITY_NAME_LIMITS,
  NAME_MAX_LENGTH,
  PHONE_LENGTH,
  TEXT_LIMITS,
  sanitizeDigits,
  sanitizeEntityName,
  sanitizeLongText,
  validateLongText,
  sanitizeName,
  validateCedula,
  validateEntityName,
  validatePersonName,
  validatePhone,
} from '#lib/validation';

const boxClass =
  'w-full rounded-xl border border-input bg-card px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:text-sm';

function fieldProps(feedback, id, { label, hint, required, labelClassName, className }) {
  return {
    ...(feedback ? feedback.field(id) : {}),
    className,
    hint,
    htmlFor: id,
    label,
    labelClassName,
    required,
  };
}

// `sanitize` limpia lo que se escribe; `validate(value)` devuelve el mensaje de
// error (o '') y bloquea el envío del formulario mientras no sea válido.
export function TextField({
  feedback,
  id,
  label,
  hint,
  labelClassName,
  fieldClassName,
  className,
  sanitize,
  validate,
  value,
  onChange,
  ...inputProps
}) {
  const { ref: inputRef, onChange: handleChange } = useValidatedInput({ value, onChange, sanitize, validate });
  return (
    <FormField {...fieldProps(feedback, id, { label, hint, labelClassName, className: fieldClassName })}>
      <Input
        className={cn('h-11 rounded-xl', className)}
        id={id}
        {...inputProps}
        onChange={handleChange}
        ref={inputRef}
        value={value}
      />
    </FormField>
  );
}

// Nombre o apellido: solo letras, de 3 a 25, sin letras repetidas al azar.
// `kind` ('nombre' | 'apellido') ajusta los mensajes.
export function NameField({ kind = 'nombre', ...props }) {
  return (
    <TextField
      autoCapitalize="words"
      maxLength={NAME_MAX_LENGTH}
      sanitize={sanitizeName}
      spellCheck={false}
      type="text"
      validate={(value) => validatePersonName(value, { label: kind })}
      {...props}
    />
  );
}

// Nombre de finca, lote o actividad (`kind`: 'farm' | 'lot' | 'activity'):
// solo letras, números y espacios, con mínimo y máximo de caracteres.
export function EntityNameField({ kind, ...props }) {
  return (
    <TextField
      autoComplete="off"
      maxLength={ENTITY_NAME_LIMITS[kind].max}
      sanitize={sanitizeEntityName}
      type="text"
      validate={(value) => validateEntityName(value, kind)}
      {...props}
    />
  );
}

// Cédula colombiana: solo números, de 6 a 10.
export function CedulaField(props) {
  return (
    <TextField
      inputMode="numeric"
      maxLength={CEDULA_MAX_LENGTH}
      sanitize={(value) => sanitizeDigits(value, CEDULA_MAX_LENGTH)}
      type="text"
      validate={validateCedula}
      {...props}
    />
  );
}

// Teléfono colombiano de 10 números.
export function PhoneField(props) {
  return (
    <TextField
      inputMode="numeric"
      maxLength={PHONE_LENGTH}
      sanitize={(value) => sanitizeDigits(value, PHONE_LENGTH)}
      type="tel"
      validate={validatePhone}
      {...props}
    />
  );
}

// <select> nativo: en el celular abre el selector del sistema, grande y conocido.
// `options`: [{ value, label }] o strings.
export function SelectField({
  feedback,
  id,
  label,
  hint,
  labelClassName,
  fieldClassName,
  className,
  options = [],
  placeholder,
  ...selectProps
}) {
  return (
    <FormField {...fieldProps(feedback, id, { label, hint, labelClassName, className: fieldClassName })}>
      <select className={cn(boxClass, 'h-11', className)} id={id} {...selectProps}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const { value, label: text } = typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </FormField>
  );
}

// Texto largo (descripciones, notas): por defecto máximo 300 caracteres, sin
// símbolos raros y, si se escribe, mínimo 5 y sin texto al azar.
export function TextareaField({
  feedback,
  id,
  label,
  hint,
  labelClassName,
  fieldClassName,
  className,
  sanitize = sanitizeLongText,
  validate = validateLongText,
  value,
  onChange,
  maxLength = TEXT_LIMITS.longText,
  ...textareaProps
}) {
  const { ref: textareaRef, onChange: handleChange } = useValidatedInput({ value, onChange, sanitize, validate });
  return (
    <FormField {...fieldProps(feedback, id, { label, hint, labelClassName, className: fieldClassName })}>
      <textarea
        className={cn(boxClass, 'min-h-24 py-2 md:text-sm', className)}
        id={id}
        maxLength={maxLength}
        {...textareaProps}
        onChange={handleChange}
        ref={textareaRef}
        value={value}
      />
    </FormField>
  );
}

// Casilla con el texto al lado, en una caja tocable completa.
export function CheckField({ checked, id, label, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm text-ink-soft" htmlFor={id}>
      <input checked={checked} className="mt-0.5 size-4 accent-primary" id={id} onChange={onChange} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}
