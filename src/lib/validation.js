// Mensajes de validación en español a partir de las reglas nativas del campo
// (required, minLength, min, type…). Reemplazan los globos del navegador, que
// salen en el idioma del sistema y casi no se leen en el celular.

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDateValue(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return value;
  return dateFormatter.format(new Date(year, month - 1, day));
}

function formatNumberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('es-CO') : value;
}

function isDateLike(element) {
  return ['date', 'datetime-local', 'month', 'week'].includes(element.type);
}

function missingMessage(element) {
  if (element.dataset?.requiredMessage) return element.dataset.requiredMessage;
  if (element.tagName === 'SELECT') return 'Elige una opción para continuar.';
  if (element.type === 'checkbox') return 'Marca esta casilla para continuar.';
  if (element.type === 'radio') return 'Elige una de las opciones.';
  if (isDateLike(element)) return 'Elige una fecha.';
  if (element.type === 'time') return 'Elige una hora.';
  return 'Este campo es obligatorio.';
}

export function validityMessage(element) {
  const { validity } = element;
  if (!validity) return 'Revisa este campo.';

  if (validity.valueMissing) return missingMessage(element);

  if (validity.badInput) {
    if (element.type === 'number') return 'Escribe solo números.';
    if (isDateLike(element)) return 'Escribe una fecha válida.';
    return 'Revisa el valor de este campo.';
  }

  if (validity.typeMismatch) {
    if (element.type === 'email') {
      return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    }
    if (element.type === 'url') return 'Escribe una dirección web válida.';
    return 'Revisa el formato de este campo.';
  }

  if (validity.tooShort) {
    const missing = element.minLength - element.value.length;
    return `Escribe al menos ${element.minLength} caracteres (te ${
      missing === 1 ? 'falta 1' : `faltan ${missing}`
    }).`;
  }

  if (validity.tooLong) return `Usa máximo ${element.maxLength} caracteres.`;

  if (validity.rangeUnderflow) {
    if (isDateLike(element)) {
      return `La fecha no puede ser anterior al ${formatDateValue(element.min)}.`;
    }
    if (Number(element.min) === 0) return 'El valor no puede ser negativo.';
    return `El valor mínimo es ${formatNumberValue(element.min)}.`;
  }

  if (validity.rangeOverflow) {
    if (isDateLike(element)) {
      return `La fecha no puede ser posterior al ${formatDateValue(element.max)}.`;
    }
    return `El valor máximo es ${formatNumberValue(element.max)}.`;
  }

  if (validity.stepMismatch) {
    const step = Number(element.step);
    if (Number.isInteger(step)) return 'Escribe un número entero.';
    return 'Usa menos decimales en este valor.';
  }

  if (validity.patternMismatch) {
    return element.title || 'Revisa el formato de este campo.';
  }

  if (validity.customError) return element.validationMessage;

  return 'Revisa este campo.';
}
