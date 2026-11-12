import { KG_PER_ARROBA, isPerKilogram } from './constants.js';
import { formatoDinero, formatoNumero } from './formatters.js';

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

// «06:00» → «6:00 a. m.»; «18:00» → «6:00 p. m.».
function formatTimeValue(value) {
  const [hours, minutes = '00'] = String(value).split(':');
  const hour = Number(hours);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour < 12 ? 'a. m.' : 'p. m.';
  return `${hour % 12 || 12}:${minutes} ${suffix}`;
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

  if ((validity.rangeUnderflow || validity.rangeOverflow) && element.type === 'time') {
    return `La hora debe estar entre las ${formatTimeValue(element.min)} y las ${formatTimeValue(element.max)}.`;
  }

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

// ¿Otro elemento de la lista (distinto al que se edita) ya tiene ese valor?
// Compara sin mayúsculas ni espacios sobrantes.
export function isDuplicate(list, getValue, value, editingId) {
  const target = String(value || '').trim().toLocaleLowerCase();
  if (!target) return false;
  return (list || []).some(
    (item) =>
      String(item.id) !== String(editingId) &&
      String(getValue(item) || '').trim().toLocaleLowerCase() === target,
  );
}

// ── Datos de personas (nombres, cédula, teléfono) ──────────────────────────
// Cada `validate*` devuelve el mensaje de error, o '' si el valor es válido.
// Los `sanitize*` limpian lo que se escribe o pega para que solo entren
// caracteres permitidos.

export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 25;
const NAME_MAX_WORDS = 4;
const NAME_SHAPE = /^\p{L}+(?:[ '-]\p{L}+)*$/u;
const REPEATED_LETTER = /(\p{L})\1\1/iu;
// Palabras de una sola letra que sí aparecen en nombres ("María y José").
const SINGLE_LETTER_WORDS = new Set(['y', 'e']);

const stripAccents = (text) => text.normalize('NFD').replace(/\p{M}/gu, '');

// ── Texto al azar ──────────────────────────────────────────────────────────
// Filas del teclado: 4 letras seguidas de una fila («asdf», «qwer», «lkjh»)
// no aparecen en palabras del español.
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const KEYBOARD_RUNS = KEYBOARD_ROWS.flatMap((row) => {
  const runs = [];
  for (const line of [row, [...row].reverse().join('')]) {
    for (let i = 0; i + 4 <= line.length; i += 1) runs.push(line.slice(i, i + 4));
  }
  return runs;
});
const CONSONANT_RUN = /[^aeiouy\d\s]{5,}/;
const REPEATED_PAIR = /(\p{L}{2})\1\1/iu;
const LONGEST_WORD = 20;

// ¿Parece escrito al azar? («asdfgh», «xxxx», «bcdfgh», «jajajaja», «Holaaaa»).
// Pensado para nombres y textos cortos de una finca: deja pasar abreviaturas
// comunes («kg», «km», «ha») porque solo revisa palabras de 4+ letras sin vocal.
export function looksRandom(value) {
  const text = stripAccents(String(value ?? '').trim().toLowerCase());
  const letters = text.replace(/[^a-zñ]/g, '');
  if (!letters) return false;
  if (!/[aeiouy]/.test(letters)) return true;
  if (REPEATED_LETTER.test(text) || REPEATED_PAIR.test(text)) return true;
  return text.split(/[^a-zñ]+/).some(
    (word) =>
      word.length >= LONGEST_WORD ||
      (word.length >= 4 && !/[aeiouy]/.test(word)) ||
      CONSONANT_RUN.test(word) ||
      KEYBOARD_RUNS.some((run) => word.includes(run)),
  );
}

// Solo letras (con tildes y ñ), espacios, apóstrofos y guiones; sin espacios
// al inicio ni separadores repetidos. Se permite un espacio al final para
// poder seguir escribiendo la siguiente palabra.
export function sanitizeName(value) {
  return String(value ?? '')
    .replace(/[^\p{L}\p{M} '-]/gu, '')
    .replace(/^[ '-]+/, '')
    .replace(/([ '-])[ '-]+/g, '$1')
    .slice(0, NAME_MAX_LENGTH);
}

export function validatePersonName(value, { label = 'nombre' } = {}) {
  const name = String(value ?? '').trim().normalize('NFC');
  if (!name) return '';
  if (!NAME_SHAPE.test(name)) {
    return `El ${label} solo puede tener letras, sin números ni símbolos.`;
  }
  if (name.length < NAME_MIN_LENGTH) {
    return `Escribe un ${label} de al menos ${NAME_MIN_LENGTH} letras.`;
  }
  if (name.length > NAME_MAX_LENGTH) {
    return `El ${label} es muy largo; usa máximo ${NAME_MAX_LENGTH} caracteres.`;
  }
  const words = name.split(' ');
  if (words.length > NAME_MAX_WORDS) {
    return `Escribe máximo ${NAME_MAX_WORDS} palabras en el ${label}.`;
  }
  if (words.some((word) => word.length === 1 && !SINGLE_LETTER_WORDS.has(word.toLowerCase()))) {
    return `Escribe el ${label} completo, sin iniciales sueltas.`;
  }
  if (looksRandom(name)) {
    return `Escribe un ${label} real, sin letras repetidas ni al azar.`;
  }
  return '';
}

// Solo dígitos (pegar "1.061.234.567" deja "1061234567"), cortado a `max`.
export function sanitizeDigits(value, max) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return max ? digits.slice(0, max) : digits;
}

// ¿Son dígitos consecutivos, subiendo o bajando? (123456, 987654…)
function isDigitSequence(digits) {
  const steps = new Set();
  for (let i = 1; i < digits.length; i += 1) {
    steps.add((Number(digits[i]) - Number(digits[i - 1]) + 10) % 10);
  }
  return steps.size === 1 && (steps.has(1) || steps.has(9));
}

export const CEDULA_MIN_LENGTH = 6;
export const CEDULA_MAX_LENGTH = 10;

// Cédula de ciudadanía colombiana: de 6 a 10 dígitos. Vacía es válida
// (el campo es opcional).
export function validateCedula(value) {
  const cedula = String(value ?? '').trim();
  if (!cedula) return '';
  if (!/^\d+$/.test(cedula)) return 'La cédula solo puede tener números, sin puntos ni letras.';
  if (cedula.length < CEDULA_MIN_LENGTH || cedula.length > CEDULA_MAX_LENGTH) {
    return `La cédula debe tener entre ${CEDULA_MIN_LENGTH} y ${CEDULA_MAX_LENGTH} números.`;
  }
  if (cedula.startsWith('0')) return 'La cédula no puede empezar por 0.';
  if (/^(\d)\1+$/.test(cedula) || isDigitSequence(cedula)) {
    return 'Escribe un número de cédula real.';
  }
  return '';
}

export const PHONE_LENGTH = 10;

// Teléfono colombiano de 10 dígitos: celular (empieza por 3) o fijo (por 60).
// Vacío es válido (el campo es opcional).
export function validatePhone(value) {
  const phone = String(value ?? '').trim();
  if (!phone) return '';
  if (!/^\d+$/.test(phone)) return 'El teléfono solo puede tener números.';
  if (phone.length !== PHONE_LENGTH || !/^(3|60)/.test(phone)) {
    return 'Escribe un celular de 10 números, por ejemplo 3001234567.';
  }
  if (/^(\d)\1+$/.test(phone.slice(1))) return 'Escribe un número de teléfono real.';
  return '';
}

// ── Cantidades y valores en dinero ─────────────────────────────────────────
// Rangos razonables para una finca cafetera. Fuente única para los formularios.
export const LIMITS = {
  harvestKg: { min: 1, max: 150, decimals: 1 },
  ratePerKg: { min: 500, max: 2_000 },
  ratePerJournal: { min: 10_000, max: 100_000 },
  salePricePerKg: { min: 5_000, max: 40_000 },
  saleQuantityKg: { min: 1, max: 100_000 },
  expense: { min: 100, max: 100_000_000 },
  lotHectares: { min: 0.1, max: 1_000 },
  lotPlants: { min: 1, max: 1_000_000 },
};

export const MONEY_DECIMALS = 2;
export const MIN_RECORD_DATE = '2000-01-01';

// Texto escrito → número limpio con punto decimal («35,5» → «35.5»).
// Debe empezar por un dígito: «.5» o «,5» no entran. Solo un separador,
// sin ceros de relleno a la izquierda («007» → «7», «0.5» se conserva).
export function sanitizeDecimal(text, { decimals = 2, maxInteger = 9 } = {}) {
  const clean = String(text ?? '').replace(/[^\d.,]/g, '').replace(/^[.,]+/, '');
  const separatorAt = clean.search(/[.,]/);
  const integerPart = separatorAt === -1 ? clean : clean.slice(0, separatorAt);
  const integer = integerPart.replace(/^0+(?=\d)/, '').slice(0, maxInteger);
  if (!integer) return '';
  if (separatorAt === -1 || decimals === 0) return integer;
  const decimalPart = clean.slice(separatorAt + 1).replace(/\D/g, '').slice(0, decimals);
  return `${integer}.${decimalPart}`;
}

// «El jornal debe estar entre $ 10.000 y $ 100.000.» o '' si está en rango.
export function validateRange(value, { min, max, label, money = false, unit = '' }) {
  const number = Number(value);
  const format = (n) => (money ? formatoDinero(n) : `${formatoNumero(n)}${unit ? ` ${unit}` : ''}`);
  if (value === '' || value === null || value === undefined || !Number.isFinite(number)) {
    return `Escribe ${label}.`;
  }
  if (number < min || number > max) {
    return `${capitalize(label)} debe estar entre ${format(min)} y ${format(max)}.`;
  }
  return '';
}

// Tarifa de una jornada según cómo se paga (por kilo o por jornal).
export function validateRate(value, paymentMode) {
  return isPerKilogram(paymentMode)
    ? validateRange(value, { ...LIMITS.ratePerKg, label: 'la tarifa por kilo', money: true })
    : validateRange(value, { ...LIMITS.ratePerJournal, label: 'el valor del jornal', money: true });
}

// Precio de venta en la unidad elegida (kilo o arroba).
export function validateSalePrice(value, { isArroba }) {
  const factor = isArroba ? KG_PER_ARROBA : 1;
  return validateRange(value, {
    min: LIMITS.salePricePerKg.min * factor,
    max: LIMITS.salePricePerKg.max * factor,
    label: isArroba ? 'el precio por arroba' : 'el precio por kilo',
    money: true,
  });
}

// Cantidad vendida en la unidad elegida (kilos o arrobas).
export function validateSaleQuantity(value, { isArroba }) {
  const factor = isArroba ? KG_PER_ARROBA : 1;
  return validateRange(value, {
    min: LIMITS.saleQuantityKg.min,
    max: LIMITS.saleQuantityKg.max / factor,
    label: isArroba ? 'la cantidad de arrobas' : 'la cantidad de kilos',
    unit: isArroba ? '@' : 'kg',
  });
}

// ── Textos (nombres de finca/lote/actividad, concepto, comprador, notas) ──
// Mínimo y máximo de caracteres por campo. Fuente única para los formularios.
export const ENTITY_NAME_LIMITS = {
  farm: { min: 3, max: 50, label: 'el nombre de la finca' },
  lot: { min: 3, max: 40, label: 'el nombre del lote' },
  activity: { min: 3, max: 50, label: 'el nombre de la labor' },
};

export const TEXT_LIMITS = {
  location: 100,
  concept: 100,
  buyer: 60,
  longText: 300,
  email: 100,
  password: 64,
  search: 60,
  assistantPrompt: 500,
};

// Quita lo no permitido, los espacios y símbolos iniciales y los espacios
// dobles. El texto siempre empieza por letra o número.
function sanitizeWith(value, disallowed) {
  return String(value ?? '')
    .replace(disallowed, '')
    .replace(/^[^\p{L}\p{M}\d]+/u, '')
    .replace(/ {2,}/g, ' ');
}

// Nombres de finca, lote y actividad: solo letras, números y espacios.
export const sanitizeEntityName = (value) => sanitizeWith(value, /[^\p{L}\p{M}\d ]/gu);

// Ubicación, concepto, comprador: además . , - # /
export const sanitizeLabelText = (value) => sanitizeWith(value, /[^\p{L}\p{M}\d .,#/-]/gu);

// Descripciones y notas: además ( ) : ; ¿ ? ¡ ! y saltos de línea.
export const sanitizeLongText = (value) =>
  String(value ?? '')
    .replace(/[^\p{L}\p{M}\d .,#/()¿?¡!:;\n-]/gu, '')
    .replace(/^[\s.,#/()¿?¡!:;-]+/u, '')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');

// Nombre de finca, lote o actividad (`kind`: 'farm' | 'lot' | 'activity'):
// entre el mínimo y el máximo, solo letras, números y espacios, y con letras
// de verdad (rechaza "aaa", "xzq" o "123").
export function validateEntityName(value, kind) {
  const { min, max, label } = ENTITY_NAME_LIMITS[kind];
  const raw = String(value ?? '');
  const text = raw.trim();
  if (!text) return raw ? `Escribe ${label}.` : '';
  if (!/^[\p{L}\p{M}\d ]+$/u.test(text)) return `${capitalize(label)} solo puede tener letras y números.`;
  if (text.length < min) return `Escribe ${label} con al menos ${min} caracteres.`;
  if (text.length > max) return `${capitalize(label)} es muy largo; usa máximo ${max} caracteres.`;
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (letters.length < 2) return `${capitalize(label)} debe tener letras, no solo números.`;
  if (looksRandom(text)) {
    return `${capitalize(label)} no parece válido: evita letras repetidas o al azar.`;
  }
  return '';
}

export function validateLabelText(value, { label = 'este campo', min = 2 } = {}) {
  const raw = String(value ?? '');
  const text = raw.trim();
  if (!text) return raw ? `Escribe ${label}.` : '';
  if (!/^[\p{L}\d]/u.test(text)) return `${capitalize(label)} debe empezar por una letra o un número.`;
  if (!/\p{L}/u.test(text)) return `${capitalize(label)} debe tener letras, no solo números o símbolos.`;
  if (text.length < min) return `Escribe ${label} con al menos ${min} caracteres.`;
  if (looksRandom(text)) return `${capitalize(label)} no parece válido: evita letras al azar.`;
  return '';
}

// Descripciones y notas (opcionales): si se escriben, mínimo 5 caracteres,
// con letras y sin texto al azar.
export function validateLongText(value, { label = 'el texto', min = 5 } = {}) {
  const raw = String(value ?? '');
  const text = raw.trim();
  if (!text) return '';
  if (!/\p{L}/u.test(text)) return `${capitalize(label)} debe tener letras, no solo números o símbolos.`;
  if (text.length < min) return `Escribe ${label} con al menos ${min} caracteres, o déjalo vacío.`;
  if (looksRandom(text)) return `${capitalize(label)} no parece válido: evita letras al azar.`;
  return '';
}

// Correo con usuario, @ y dominio con punto (nombre@correo.com).
export const sanitizeEmail = (value) => String(value ?? '').replace(/\s/g, '');

export function validateEmail(value) {
  const email = String(value ?? '').trim();
  if (!email) return '';
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(email)) {
    return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }
  return '';
}

// Contraseña nueva: de 8 a 64 caracteres, con al menos una letra y un número.
export const PASSWORD_MIN_LENGTH = 8;

export function validateNewPassword(value) {
  const password = String(value ?? '');
  if (!password) return '';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe tener al menos una letra y un número.';
  }
  return '';
}

// Hora de entrega del café en una jornada: de 6:00 a. m. a 6:00 p. m.
export const HARVEST_TIME = { min: '06:00', max: '18:00' };

export function validateHarvestTime(time, { isToday = false, now = '' } = {}) {
  if (!time) return '';
  const key = String(time).slice(0, 5);
  if (key < HARVEST_TIME.min || key > HARVEST_TIME.max) {
    return 'La hora debe estar entre las 6:00 a. m. y las 6:00 p. m.';
  }
  if (isToday && now && key > String(now).slice(0, 5)) {
    return 'La hora no puede ser posterior a la hora actual.';
  }
  return '';
}

function capitalize(text) {
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : text;
}

// Área y número de plantas de un lote (ambos opcionales).
export const sanitizeHectares = (value) => sanitizeDecimal(value, { decimals: 2, maxInteger: 4 });
export const sanitizePlantCount = (value) => sanitizeDigits(value, 7);

export const validateHectares = (value) =>
  value === '' || value === null || value === undefined
    ? ''
    : validateRange(value, { ...LIMITS.lotHectares, label: 'el área', unit: 'ha' });

export const validatePlantCount = (value) =>
  value === '' || value === null || value === undefined
    ? ''
    : validateRange(value, { ...LIMITS.lotPlants, label: 'el número de plantas' });
