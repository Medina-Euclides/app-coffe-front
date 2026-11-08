// Retroalimentación de formularios: reemplaza los globos nativos del navegador
// por mensajes propios en español bajo cada campo, y maneja el aviso general
// (p. ej. un error al guardar). Ambos se ocultan solos tras unos segundos.
//
// Uso:
//   const feedback = useFormFeedback();
//   <form {...feedback.formProps} onSubmit={…}>
//     <FormField {...feedback.field('farm-name')} label="Nombre">…</FormField>
//     <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { validityMessage } from '#lib/validation';
import { prefersReducedMotion } from '#lib/utils';

export const FIELD_ERROR_MS = 4000;
export const FORM_ERROR_MS = 6000;
const FORM_KEY = '__form__';

// Clave del campo: su id o name. Las casillas dentro de una caja de opciones
// (data-field-box) usan el id de la caja, que es donde se muestra el error.
const fieldKey = (element) =>
  element?.id ||
  element?.name ||
  element?.closest?.('[data-field-box]')?.id ||
  '';

export function useFormFeedback() {
  // key → { message, visible }. `visible` se apaga a los pocos segundos, pero el
  // campo sigue marcado (borde rojo) hasta que la persona lo corrige.
  const [fields, setFields] = useState({});
  const [formError, setFormErrorState] = useState('');
  const timers = useRef(new Map());
  const focusLock = useRef(false);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const schedule = useCallback((key, callback, ms) => {
    clearTimeout(timers.current.get(key));
    timers.current.set(key, setTimeout(callback, ms));
  }, []);

  const cancel = useCallback((key) => {
    clearTimeout(timers.current.get(key));
    timers.current.delete(key);
  }, []);

  // En un mismo intento de envío llegan varios eventos `invalid`: solo se
  // enfoca el primero, que es el que la persona debe ver en el celular.
  const focusFirst = useCallback((element) => {
    if (!element || focusLock.current) return;
    focusLock.current = true;
    setTimeout(() => {
      focusLock.current = false;
    }, 0);
    element.focus?.({ preventScroll: true });
    element.scrollIntoView?.({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });
  }, []);

  const setFieldError = useCallback(
    (key, message, { focus = true } = {}) => {
      if (!key || !message) return;
      setFields((previous) => ({ ...previous, [key]: { message, visible: true } }));
      schedule(
        key,
        () =>
          setFields((previous) =>
            previous[key]
              ? { ...previous, [key]: { ...previous[key], visible: false } }
              : previous,
          ),
        FIELD_ERROR_MS,
      );
      if (focus) focusFirst(document.getElementById(key));
    },
    [focusFirst, schedule],
  );

  const clearField = useCallback(
    (key) => {
      cancel(key);
      setFields((previous) => {
        if (!(key in previous)) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    },
    [cancel],
  );

  const clearFormError = useCallback(() => {
    cancel(FORM_KEY);
    setFormErrorState('');
  }, [cancel]);

  const setFormError = useCallback(
    (message) => {
      if (!message) {
        clearFormError();
        return;
      }
      setFormErrorState(message);
      schedule(FORM_KEY, () => setFormErrorState(''), FORM_ERROR_MS);
    },
    [clearFormError, schedule],
  );

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    setFields({});
    setFormErrorState('');
  }, []);

  const handleInvalid = useCallback(
    (event) => {
      // Cancelar el evento quita el globo nativo; el envío sigue bloqueado.
      event.preventDefault();
      const element = event.target;
      const key = fieldKey(element);
      if (!key) return;
      clearFormError();
      setFieldError(key, validityMessage(element), { focus: false });
      focusFirst(element);
    },
    [clearFormError, focusFirst, setFieldError],
  );

  // `invalid` no burbujea: se escucha en fase de captura sobre el formulario.
  const attachForm = useCallback(
    (form) => {
      if (!form) return undefined;
      form.addEventListener('invalid', handleInvalid, true);
      return () => form.removeEventListener('invalid', handleInvalid, true);
    },
    [handleInvalid],
  );

  // Al escribir o elegir algo, el error de ese campo desaparece.
  const onChange = useCallback(
    (event) => {
      const key = fieldKey(event.target);
      if (key) clearField(key);
    },
    [clearField],
  );

  const formProps = useMemo(() => ({ onChange, ref: attachForm }), [attachForm, onChange]);

  const field = useCallback(
    (key) => {
      const entry = fields[key];
      return {
        error: entry?.visible ? entry.message : '',
        invalid: Boolean(entry),
      };
    },
    [fields],
  );

  return {
    clearField,
    clearFormError,
    field,
    formError,
    formProps,
    reset,
    setFieldError,
    setFormError,
  };
}
