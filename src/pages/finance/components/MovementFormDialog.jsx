// Formulario para registrar o editar una venta de café o un gasto.
import { useState } from 'react';
import FormDialog from '#components/shared/FormDialog';
import { SelectField, TextField } from '#components/shared/FormFields';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { hoy } from '#lib/formatters';
import {
  LIMITS,
  MIN_RECORD_DATE,
  validateRange,
  validateSalePrice,
  validateSaleQuantity,
} from '#lib/validation';
import { useSaleUnit } from '../hooks/useSaleUnit.js';
import { ExpenseFields, SaleFields } from './MovementFields.jsx';

const titles = {
  sale: { new: 'Registrar venta', edit: 'Editar venta' },
  expense: { new: 'Registrar gasto', edit: 'Editar gasto' },
};

export default function MovementFormDialog({
  open,
  onOpenChange,
  type,
  movement,
  farms,
  selectedFarmId,
  onSave,
}) {
  const isSale = type === 'sale';
  const [farmId, setFarmId] = useState(String(movement?.farm || selectedFarmId || farms[0]?.id || ''));
  const [date, setDate] = useState(movement?.sale_date || movement?.date || hoy());
  const [concept, setConcept] = useState(
    isSale ? movement?.coffee_type || 'pergamino' : movement?.concept || '',
  );
  const sale = useSaleUnit(movement);
  const [amount, setAmount] = useState(movement?.amount || '');
  const [buyer, setBuyer] = useState(movement?.buyer || '');
  const [category, setCategory] = useState(movement?.category || 'inputs');
  const [notes, setNotes] = useState(movement?.notes || '');
  const feedback = useFormFeedback();

  const handleSubmit = () => {
    // Cantidades y precios son campos de texto: los rangos se revisan aquí.
    const errors = isSale
      ? [
          ['sale-quantity', validateSaleQuantity(sale.quantity, sale)],
          ['sale-unit-price', validateSalePrice(sale.unitPrice, sale)],
        ]
      : [['expense-amount', validateRange(amount, { ...LIMITS.expense, label: 'el valor del gasto', money: true })]];
    const failed = errors.filter(([, message]) => message);
    if (failed.length) {
      failed.forEach(([key, message]) => feedback.setFieldError(key, message));
      return false;
    }
    return onSave(
      isSale
        ? {
            farm: farmId,
            sale_date: date,
            coffee_type: concept,
            quantity_kg: sale.quantityKg,
            unit_price: sale.pricePerKg,
            buyer: buyer.trim(),
            notes: notes.trim(),
          }
        : {
            farm: farmId,
            date,
            concept: concept.trim(),
            amount: Number(amount),
            category,
          },
    );
  };

  return (
    <FormDialog
      description={isSale ? '¿Cuánto café vendiste y a qué precio?' : 'Los pagos a trabajadores se anotan solos.'}
      errorFallback="No se pudo guardar el movimiento. Revisa tu conexión e inténtalo de nuevo."
      feedback={feedback}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      open={open}
      submitLabel={movement ? 'Guardar cambios' : 'Registrar'}
      title={titles[type][movement ? 'edit' : 'new']}
    >
      <SelectField
        data-required-message="Elige la finca del movimiento."
        feedback={feedback}
        id="movement-farm"
        label="¿De qué finca?"
        onChange={(event) => setFarmId(event.target.value)}
        options={farms.map((farm) => ({ value: String(farm.id), label: farm.nombre }))}
        placeholder="Selecciona una finca"
        required
        value={farmId}
      />
      <TextField
        feedback={feedback}
        id="movement-date"
        label="¿Qué día?"
        max={hoy()}
        min={MIN_RECORD_DATE}
        onChange={(event) => setDate(event.target.value)}
        required
        type="date"
        value={date}
      />
      {isSale ? (
        <SaleFields
          buyer={buyer}
          coffeeType={concept}
          feedback={feedback}
          notes={notes}
          onBuyerChange={setBuyer}
          onCoffeeTypeChange={setConcept}
          onNotesChange={setNotes}
          sale={sale}
        />
      ) : (
        <ExpenseFields
          amount={amount}
          category={category}
          concept={concept}
          feedback={feedback}
          onAmountChange={setAmount}
          onCategoryChange={setCategory}
          onConceptChange={setConcept}
        />
      )}
    </FormDialog>
  );
}
