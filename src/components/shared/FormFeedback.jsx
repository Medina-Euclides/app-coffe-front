// Piezas visuales de la retroalimentación de formularios (ver useFormFeedback).
// - FormField: etiqueta + control + mensaje de error bajo el campo.
// - FieldError: mensaje corto en rojo con ícono; aparece y se pliega suave.
// - FormAlert: aviso general del formulario (error al guardar), junto a los botones.
import { Children, cloneElement, isValidElement, useEffect, useState } from 'react';
import { CircleAlert, OctagonAlert, X } from 'lucide-react';
import { cn } from 'cn';

const EXIT_MS = 200;

// Conserva el último mensaje mientras se pliega, para que no desaparezca de golpe.
function useLingering(message) {
  const [kept, setKept] = useState(message);
  if (message && message !== kept) setKept(message);

  useEffect(() => {
    if (message || !kept) return undefined;
    const timer = setTimeout(() => setKept(''), EXIT_MS);
    return () => clearTimeout(timer);
  }, [message, kept]);

  return kept;
}

function Reveal({ show, children, className }) {
  return (
    <div
      aria-hidden={show ? undefined : true}
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
        show
          ? 'grid-rows-[1fr] opacity-100 animate-in fade-in-0 slide-in-from-top-1'
          : 'grid-rows-[0fr] opacity-0',
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function FieldError({ id, message }) {
  const kept = useLingering(message);
  if (!kept) return null;

  return (
    <Reveal show={Boolean(message)}>
      <p
        className="flex items-start gap-1.5 pt-1.5 text-sm font-medium leading-5 text-destructive"
        id={id}
        role="alert"
      >
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{kept}</span>
      </p>
    </Reveal>
  );
}

export function FormField({
  children,
  className,
  error = '',
  hint,
  htmlFor,
  id,
  invalid = false,
  label,
  labelClassName,
  required,
}) {
  const controlId = htmlFor || id;
  const errorId = controlId ? `${controlId}-error` : undefined;
  const hintId = hint && controlId ? `${controlId}-hint` : undefined;
  const isInvalid = invalid || Boolean(error);

  // Si el hijo es el control mismo (su id coincide), se le pasan aria-invalid y
  // aria-describedby. Con envoltorios (Select de base-ui, un div con prefijo $)
  // quien llama los pone en el control interno.
  let isRequired = required;
  const renderedControl = Children.map(children, (child) => {
    if (!isValidElement(child) || !controlId || child.props.id !== controlId) {
      return child;
    }
    isRequired ??= Boolean(child.props.required);
    const describedBy = [child.props['aria-describedby'], hintId, error ? errorId : null]
      .filter(Boolean)
      .join(' ');
    return cloneElement(child, {
      'aria-describedby': describedBy || undefined,
      'aria-invalid': isInvalid || child.props['aria-invalid'] || undefined,
    });
  });

  return (
    <div className={cn('min-w-0', className)}>
      <div className="space-y-2">
        {label && (
          <label
            className={cn('block text-sm font-medium text-ink-soft', labelClassName)}
            htmlFor={controlId}
          >
            {label}
            {isRequired && (
              <>
                <span aria-hidden="true" className="text-destructive">
                  {' '}
                  *
                </span>
                <span className="sr-only"> (obligatorio)</span>
              </>
            )}
          </label>
        )}
        {renderedControl}
        {hint && (
          <p className="text-sm text-muted-foreground" id={hintId}>
            {hint}
          </p>
        )}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function FormAlert({ className, message, onDismiss }) {
  const kept = useLingering(message);
  if (!kept) return null;

  return (
    <Reveal className={className} show={Boolean(message)}>
      <div
        aria-live="assertive"
        className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive-soft py-2 pr-1 pl-3 text-destructive"
        role="alert"
      >
        <OctagonAlert aria-hidden="true" className="mt-2.5 size-5 shrink-0" />
        <p className="min-w-0 flex-1 py-2 text-sm font-medium leading-5">{kept}</p>
        {onDismiss && (
          <button
            aria-label="Cerrar aviso"
            className="grid size-11 shrink-0 place-items-center rounded-xl text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
            onClick={onDismiss}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    </Reveal>
  );
}
