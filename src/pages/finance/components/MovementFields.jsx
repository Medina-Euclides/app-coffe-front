// Campos propios de una venta de café o de un gasto, dentro de MovementFormDialog.
import DecimalInput from '#components/shared/DecimalInput';
import MoneyInput from '#components/shared/MoneyInput';
import SegmentedControl from '#components/shared/SegmentedControl';
import { FormField } from '#components/shared/FormFeedback';
import { SelectField, TextareaField, TextField } from '#components/shared/FormFields';
import { EXPENSE_CATEGORIES } from '#lib/constants';
import { TEXT_LIMITS, sanitizeLabelText, validateLabelText } from '#lib/validation';

const validateBuyer = (value) => validateLabelText(value, { label: 'el nombre del comprador', min: 3 });
const validateConcept = (value) => validateLabelText(value, { label: 'el concepto', min: 3 });

const unitOptions = [
  { value: 'arroba', label: 'Arrobas' },
  { value: 'kg', label: 'Kilos' },
];

const coffeeTypes = [
  { value: 'pergamino', label: 'Café pergamino seco' },
  { value: 'pasilla', label: 'Pasilla' },
];

// La mano de obra se registra sola al pagar jornales; no se elige a mano.
const expenseCategories = EXPENSE_CATEGORIES.filter(({ value }) => value !== 'labor');

export function SaleFields({ feedback, sale, coffeeType, onCoffeeTypeChange, buyer, onBuyerChange, notes, onNotesChange }) {
  const { isArroba } = sale;
  return (
    <>
      <SelectField
        feedback={feedback}
        id="sale-coffee-type"
        label="¿Qué café vendiste?"
        onChange={(event) => onCoffeeTypeChange(event.target.value)}
        options={coffeeTypes}
        value={coffeeType}
      />
      <div className="space-y-2">
        <SegmentedControl label="Unidad de venta" onChange={sale.changeUnit} options={unitOptions} value={sale.unit} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            {...feedback.field('sale-quantity')}
            htmlFor="sale-quantity"
            label={isArroba ? '¿Cuántas arrobas?' : '¿Cuántos kilos?'}
          >
            <DecimalInput
              className="h-11 rounded-xl"
              data-required-message={
                isArroba ? 'Escribe cuántas arrobas vendiste.' : 'Escribe cuántos kilos vendiste.'
              }
              id="sale-quantity"
              maxInteger={6}
              onValueChange={sale.setQuantity}
              placeholder={isArroba ? 'Ej. 10' : 'Ej. 125'}
              required
              value={sale.quantity}
            />
          </FormField>
          <FormField
            {...feedback.field('sale-unit-price')}
            htmlFor="sale-unit-price"
            label={isArroba ? 'Precio por arroba' : 'Precio por kilo'}
          >
            <MoneyInput
              className="h-11 rounded-xl"
              data-required-message={isArroba ? 'Escribe el precio por arroba.' : 'Escribe el precio por kilo.'}
              id="sale-unit-price"
              onValueChange={sale.setUnitPrice}
              required
              value={sale.unitPrice}
            />
          </FormField>
        </div>
        {sale.summary && (
          <p aria-live="polite" className="text-sm font-medium text-ink-soft">
            {sale.summary}
          </p>
        )}
      </div>
      <TextField
        feedback={feedback}
        id="sale-buyer"
        label="¿A quién le vendiste? (opcional)"
        maxLength={TEXT_LIMITS.buyer}
        onChange={(event) => onBuyerChange(event.target.value)}
        sanitize={sanitizeLabelText}
        validate={validateBuyer}
        value={buyer}
      />
      <TextareaField
        className="min-h-20"
        feedback={feedback}
        id="movement-notes"
        label="Notas (opcional)"
        onChange={(event) => onNotesChange(event.target.value)}
        value={notes}
      />
    </>
  );
}

export function ExpenseFields({ feedback, category, onCategoryChange, concept, onConceptChange, amount, onAmountChange }) {
  return (
    <>
      <SelectField
        feedback={feedback}
        id="expense-category"
        label="¿En qué gastaste?"
        onChange={(event) => onCategoryChange(event.target.value)}
        options={expenseCategories}
        value={category}
      />
      <TextField
        data-required-message="Escribe en qué se gastó."
        feedback={feedback}
        id="expense-concept"
        label="¿Qué compraste o pagaste?"
        maxLength={TEXT_LIMITS.concept}
        onChange={(event) => onConceptChange(event.target.value)}
        required
        sanitize={sanitizeLabelText}
        validate={validateConcept}
        value={concept}
      />
      <FormField {...feedback.field('expense-amount')} htmlFor="expense-amount" label="¿Cuánto costó?">
        <MoneyInput
          className="h-11 rounded-xl"
          data-required-message="Escribe el valor del gasto."
          id="expense-amount"
          onValueChange={onAmountChange}
          required
          value={amount}
        />
      </FormField>
    </>
  );
}
