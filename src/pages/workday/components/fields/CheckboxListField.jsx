// Lista con casillas para elegir varios (trabajadores, lotes) con el conteo en la
// etiqueta y el error debajo. `selectedIds` son ids en texto.
import { FieldError } from '#components/shared/FormFeedback';

export default function CheckboxListField({
  feedback,
  id,
  legend,
  ariaLabel,
  items,
  selectedIds,
  onToggle,
  getLabel,
  emptyMessage,
}) {
  const field = feedback.field(id);
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-semibold text-primary">
        {legend} <span aria-hidden="true" className="text-destructive">*</span>
        <span className="ml-1 font-normal normal-case text-muted-foreground">
          ({selectedIds.length} seleccionados)
        </span>
      </legend>
      {items.length || !emptyMessage ? (
        <div
          aria-describedby={`${id}-error`}
          aria-invalid={field.invalid || undefined}
          aria-label={ariaLabel}
          className="grid max-h-36 gap-2 overflow-y-auto rounded-xl border border-input bg-card p-3 sm:grid-cols-2"
          data-field-box
          id={id}
          tabIndex={-1}
        >
          {items.map((item) => (
            <label
              className="flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground hover:bg-muted"
              key={item.id}
            >
              <input
                checked={selectedIds.includes(String(item.id))}
                className="size-4 shrink-0 accent-primary"
                onChange={() => onToggle(item.id)}
                type="checkbox"
                value={String(item.id)}
              />
              <span className="truncate">{getLabel(item)}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-input bg-card px-3 py-3 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}
      <FieldError id={`${id}-error`} message={field.error} />
    </fieldset>
  );
}
