import { useEffect, useRef } from 'react';

// Limpia lo que se escribe (`sanitize`) y marca el campo como inválido con el
// mensaje de `validate`: el navegador bloquea el envío y useFormFeedback lo
// muestra bajo el campo. También valida valores precargados (al editar).
export function useValidatedInput({ value, onChange, sanitize, validate }) {
  const ref = useRef(null);
  const message = validate ? validate(value ?? '') : '';

  useEffect(() => {
    ref.current?.setCustomValidity(message);
  }, [message]);

  const handleChange = (event) => {
    if (sanitize) {
      const clean = sanitize(event.target.value);
      if (clean !== event.target.value) event.target.value = clean;
    }
    onChange?.(event);
  };

  return { ref, onChange: handleChange };
}
