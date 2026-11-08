// Campos de formulario con etiqueta y error bajo el campo (FormField + control).
// `feedback` es el objeto de useFormFeedback; el `id` es también la clave del error.
import { Input } from '#components/ui/input';
import { FormField } from '#components/shared/FormFeedback';
import { cn } from '#lib/utils';

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

export function TextField({ feedback, id, label, hint, labelClassName, fieldClassName, className, ...inputProps }) {
  return (
    <FormField {...fieldProps(feedback, id, { label, hint, labelClassName, className: fieldClassName })}>
      <Input className={cn('h-11 rounded-xl', className)} id={id} {...inputProps} />
    </FormField>
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

export function TextareaField({ feedback, id, label, hint, labelClassName, fieldClassName, className, ...textareaProps }) {
  return (
    <FormField {...fieldProps(feedback, id, { label, hint, labelClassName, className: fieldClassName })}>
      <textarea className={cn(boxClass, 'min-h-24 py-2 md:text-sm', className)} id={id} {...textareaProps} />
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
