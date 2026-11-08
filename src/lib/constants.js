export const OPCIONES_JORNAL = [
  { valor: '0.25', etiqueta: 'Un cuarto de día (1/4)' },
  { valor: '0.5', etiqueta: 'Medio día (1/2)' },
  { valor: '0.75', etiqueta: 'Tres cuartos de día (3/4)' },
  { valor: '1', etiqueta: '1 Día completo' },
  { valor: '1.5', etiqueta: '1 Día y medio' },
  { valor: '2', etiqueta: '2 Días' },
  { valor: '2.5', etiqueta: '2 Días y medio' },
  { valor: '3', etiqueta: '3 Días' },
  { valor: '3.5', etiqueta: '3 Días y medio' },
  { valor: '4', etiqueta: '4 Días' },
  { valor: '5', etiqueta: '5 Días' },
  { valor: '6', etiqueta: '6 Días (Semana)' },
];

export const VARIEDADES_CAFE = ['Castillo', 'Caturra', 'Colombia', 'Borbón', 'Geisha'];

// Mismo orden y etiquetas que OperatingExpense.Category en el backend.
export const EXPENSE_CATEGORIES = [
  { value: 'labor', label: 'Mano de obra' },
  { value: 'inputs', label: 'Insumos agrícolas' },
  { value: 'tools_materials', label: 'Herramientas y materiales' },
  { value: 'transport', label: 'Transporte' },
  { value: 'services', label: 'Servicios' },
  { value: 'other', label: 'Otros' },
];

// Modalidades de pago de una jornada (valores del backend).
export const PAYMENT_MODES = {
  JOURNAL: 'jornal',
  KILOGRAM: 'kg',
};

// Acepta 'kg', 'kilo', 'kilogram' y variantes que llegan de datos antiguos.
export const isPerKilogram = (mode) => /kg|kilo|kilogram/.test(String(mode || '').toLocaleLowerCase());

// Una arroba de café son 12,5 kg. El backend guarda siempre kilos y precio por kilo.
export const KG_PER_ARROBA = 12.5;
