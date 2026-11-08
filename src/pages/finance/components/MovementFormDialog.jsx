import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import MoneyInput from '#components/shared/MoneyInput';
import { Button } from '#components/ui/button';
import { FormAlert, FormField } from '#components/shared/FormFeedback';
import { useFormFeedback } from '#hooks/useFormFeedback';

const expenseCategories = [
  { value: 'inputs', label: 'Insumos agrícolas' },
  { value: 'tools_materials', label: 'Herramientas y materiales' },
  { value: 'transport', label: 'Transporte' },
  { value: 'services', label: 'Servicios' },
  { value: 'other', label: 'Otros' },
];

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function MovementFormDialog({
  open,
  onOpenChange,
  type,
  movement,
  farms,
  selectedFarmId,
  onSave,
}) {
  const [farmId, setFarmId] = useState(
    String(movement?.farm || selectedFarmId || farms[0]?.id || ''),
  );
  const [date, setDate] = useState(movement?.sale_date || movement?.date || localDateValue());
  const [concept, setConcept] = useState(
    type === 'sale' ? movement?.coffee_type || 'pergamino' : movement?.concept || '',
  );
  const [quantity, setQuantity] = useState(movement?.quantity_kg || '');
  const [unitPrice, setUnitPrice] = useState(movement?.unit_price || '');
  const [amount, setAmount] = useState(movement?.amount || '');
  const [buyer, setBuyer] = useState(movement?.buyer || '');
  const [category, setCategory] = useState(movement?.category || 'inputs');
  const [notes, setNotes] = useState(movement?.notes || '');
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    feedback.clearFormError();
    // MoneyInput es un campo de texto: el mínimo se revisa aquí.
    if (type === 'sale' && !(Number(unitPrice) > 0)) {
      feedback.setFieldError('sale-unit-price', 'Escribe un precio mayor que cero.');
      return;
    }
    if (type !== 'sale' && !(Number(amount) > 0)) {
      feedback.setFieldError('expense-amount', 'Escribe un valor mayor que cero.');
      return;
    }
    setSaving(true);
    try {
      const payload =
        type === 'sale'
          ? {
              farm: farmId,
              sale_date: date,
              coffee_type: concept,
              quantity_kg: Number(quantity),
              unit_price: Number(unitPrice),
              buyer: buyer.trim(),
              notes: notes.trim(),
            }
          : {
              farm: farmId,
              date,
              concept: concept.trim(),
              amount: Number(amount),
              category,
            };
      const result = await onSave(payload);
      if (result) {
        feedback.setFormError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el movimiento financiero:', saveError);
      feedback.setFormError(saveError.message || 'No se pudo guardar el movimiento. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90dvh,48rem)] overflow-y-auto rounded-2xl p-5 sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl text-foreground">
            {movement
              ? type === 'sale'
                ? 'Editar venta'
                : 'Editar gasto'
              : type === 'sale'
                ? 'Registrar venta'
                : 'Registrar gasto'}
          </DialogTitle>
          <DialogDescription>
            {type === 'sale'
              ? 'Registra la cantidad y el precio de venta del café.'
              : 'Los gastos de mano de obra se registran automáticamente desde Pagos laborales.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          {...feedback.formProps}
          onSubmit={handleSubmit}
        >
          <FormField
            {...feedback.field('movement-farm')}
            htmlFor="movement-farm"
            label="Finca"
          >
            <select
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-required-message="Elige la finca del movimiento."
              id="movement-farm"
              onChange={(event) => setFarmId(event.target.value)}
              required
              value={farmId}
            >
              <option disabled value="">
                Selecciona una finca
              </option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            {...feedback.field('movement-date')}
            htmlFor="movement-date"
            label="Fecha"
          >
            <Input
              className="h-11 rounded-xl"
              id="movement-date"
              max={localDateValue()}
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </FormField>

          {type === 'sale' ? (
            <>
              <FormField
                {...feedback.field('sale-coffee-type')}
                htmlFor="sale-coffee-type"
                label="Tipo de café"
              >
                <select
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  id="sale-coffee-type"
                  onChange={(event) => setConcept(event.target.value)}
                  value={concept}
                >
                  <option value="pergamino">Café pergamino seco</option>
                  <option value="pasilla">Pasilla</option>
                </select>
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  {...feedback.field('sale-quantity')}
                  htmlFor="sale-quantity"
                  label="Cantidad (kg)"
                >
                  <Input
                    className="h-11 rounded-xl"
                    data-required-message="Escribe cuántos kilos vendiste."
                    id="sale-quantity"
                    min="0.01"
                    onChange={(event) => setQuantity(event.target.value)}
                    required
                    step="0.01"
                    type="number"
                    value={quantity}
                  />
                </FormField>
                <FormField
                  {...feedback.field('sale-unit-price')}
                  htmlFor="sale-unit-price"
                  label="Precio por kg (COP)"
                >
                  <MoneyInput
                    className="h-11 rounded-xl"
                    data-required-message="Escribe el precio por kilo."
                    id="sale-unit-price"
                    onValueChange={setUnitPrice}
                    required
                    value={unitPrice}
                  />
                </FormField>
              </div>
              <FormField
                {...feedback.field('sale-buyer')}
                htmlFor="sale-buyer"
                label="Comprador (opcional)"
              >
                <Input
                  className="h-11 rounded-xl"
                  id="sale-buyer"
                  maxLength={150}
                  onChange={(event) => setBuyer(event.target.value)}
                  value={buyer}
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField
                {...feedback.field('expense-category')}
                htmlFor="expense-category"
                label="Categoría"
              >
                <select
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  id="expense-category"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  {expenseCategories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                {...feedback.field('expense-concept')}
                htmlFor="expense-concept"
                label="Concepto"
              >
                <Input
                  className="h-11 rounded-xl"
                  data-required-message="Escribe en qué se gastó."
                  id="expense-concept"
                  maxLength={200}
                  onChange={(event) => setConcept(event.target.value)}
                  required
                  value={concept}
                />
              </FormField>
              <FormField
                {...feedback.field('expense-amount')}
                htmlFor="expense-amount"
                label="Valor (COP)"
              >
                <MoneyInput
                  className="h-11 rounded-xl"
                  data-required-message="Escribe el valor del gasto."
                  id="expense-amount"
                  onValueChange={setAmount}
                  required
                  value={amount}
                />
              </FormField>
            </>
          )}

          {type === 'sale' && (
            <FormField
              {...feedback.field('movement-notes')}
              htmlFor="movement-notes"
              label="Notas (opcional)"
            >
              <textarea
                className="min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                id="movement-notes"
                onChange={(event) => setNotes(event.target.value)}
                value={notes}
              />
            </FormField>
          )}

          <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              className="min-h-11 rounded-xl"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="min-h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Guardando…' : movement ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
