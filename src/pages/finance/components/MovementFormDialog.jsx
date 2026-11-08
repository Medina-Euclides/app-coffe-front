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
import SegmentedControl from '#components/shared/SegmentedControl';
import {
  KG_PER_ARROBA,
  arrobasToKg,
  currencyFormatter,
  kgToArrobas,
  numberFormatter,
  pricePerArrobaToKg,
  pricePerKgToArroba,
} from '../movementFormat.js';

const UNIT_STORAGE_KEY = 'cafesmart:sale-unit';

const unitOptions = [
  { value: 'arroba', label: 'Arrobas' },
  { value: 'kg', label: 'Kilos' },
];

function readSavedUnit() {
  try {
    return localStorage.getItem(UNIT_STORAGE_KEY) === 'kg' ? 'kg' : 'arroba';
  } catch {
    return 'arroba';
  }
}

function saveUnit(unit) {
  try {
    localStorage.setItem(UNIT_STORAGE_KEY, unit);
  } catch {
    // Sin almacenamiento disponible: se usará Arrobas la próxima vez.
  }
}

// Unidad con la que se abre el formulario. Una venta existente se abre en arrobas
// solo si sus kilos dan arrobas enteras o medias (25 kg → 2 @); si no (37 kg), en kilos.
function initialUnit(movement) {
  if (!movement) return readSavedUnit();
  const kg = Number(movement.quantity_kg);
  if (!(kg > 0)) return readSavedUnit();
  return Number.isInteger((kg / KG_PER_ARROBA) * 2) ? 'arroba' : 'kg';
}

const toFieldValue = (number) => (Number.isFinite(number) && number > 0 ? String(number) : '');

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
  const [unit, setUnit] = useState(() => initialUnit(movement));
  // Cantidad y precio se guardan en la unidad que se muestra; al enviar se pasan a kg.
  const [quantity, setQuantity] = useState(() => {
    if (!movement?.quantity_kg) return '';
    return unit === 'arroba'
      ? toFieldValue(kgToArrobas(movement.quantity_kg))
      : String(movement.quantity_kg);
  });
  const [unitPrice, setUnitPrice] = useState(() => {
    if (!movement?.unit_price) return '';
    return unit === 'arroba'
      ? toFieldValue(pricePerKgToArroba(movement.unit_price))
      : String(movement.unit_price);
  });
  const [amount, setAmount] = useState(movement?.amount || '');
  const [buyer, setBuyer] = useState(movement?.buyer || '');
  const [category, setCategory] = useState(movement?.category || 'inputs');
  const [notes, setNotes] = useState(movement?.notes || '');
  const feedback = useFormFeedback();
  const [saving, setSaving] = useState(false);
  const isArroba = unit === 'arroba';

  // Cambia la unidad convirtiendo lo ya escrito, para que no se pierda ni quede mal.
  const handleUnitChange = (nextUnit) => {
    if (nextUnit === unit) return;
    const toArroba = nextUnit === 'arroba';
    if (Number(quantity) > 0) {
      setQuantity(toFieldValue(toArroba ? kgToArrobas(quantity) : arrobasToKg(quantity)));
    }
    if (Number(unitPrice) > 0) {
      setUnitPrice(
        toFieldValue(toArroba ? pricePerKgToArroba(unitPrice) : pricePerArrobaToKg(unitPrice)),
      );
    }
    setUnit(nextUnit);
    saveUnit(nextUnit);
  };

  const quantityNumber = Number(quantity);
  const priceNumber = Number(unitPrice);
  const quantityKg = isArroba ? arrobasToKg(quantityNumber) : quantityNumber;
  const saleTotal = quantityNumber > 0 && priceNumber > 0 ? quantityNumber * priceNumber : 0;
  const saleSummary =
    quantityNumber > 0
      ? [
          isArroba
            ? `${numberFormatter.format(quantityNumber)} @ = ${numberFormatter.format(quantityKg)} kg`
            : `${numberFormatter.format(quantityNumber)} kg = ${numberFormatter.format(kgToArrobas(quantityNumber))} @`,
          saleTotal > 0 ? `Total ${currencyFormatter.format(saleTotal)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

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
              quantity_kg: quantityKg,
              unit_price: isArroba ? pricePerArrobaToKg(priceNumber) : priceNumber,
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
              ? '¿Cuánto café vendiste y a qué precio?'
              : 'Los pagos a trabajadores se anotan solos.'}
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
            label="¿De qué finca?"
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
            label="¿Qué día?"
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
                label="¿Qué café vendiste?"
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
              <div className="space-y-2">
                <SegmentedControl
                  label="Unidad de venta"
                  onChange={handleUnitChange}
                  options={unitOptions}
                  value={unit}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    {...feedback.field('sale-quantity')}
                    htmlFor="sale-quantity"
                    label={isArroba ? '¿Cuántas arrobas?' : '¿Cuántos kilos?'}
                  >
                    <Input
                      className="h-11 rounded-xl"
                      data-required-message={
                        isArroba ? 'Escribe cuántas arrobas vendiste.' : 'Escribe cuántos kilos vendiste.'
                      }
                      id="sale-quantity"
                      inputMode="decimal"
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
                    label={isArroba ? 'Precio por arroba' : 'Precio por kilo'}
                  >
                    <MoneyInput
                      className="h-11 rounded-xl"
                      data-required-message={
                        isArroba ? 'Escribe el precio por arroba.' : 'Escribe el precio por kilo.'
                      }
                      id="sale-unit-price"
                      onValueChange={setUnitPrice}
                      required
                      value={unitPrice}
                    />
                  </FormField>
                </div>
                {saleSummary && (
                  <p aria-live="polite" className="text-sm font-medium text-ink-soft">
                    {saleSummary}
                  </p>
                )}
              </div>
              <FormField
                {...feedback.field('sale-buyer')}
                htmlFor="sale-buyer"
                label="¿A quién le vendiste? (opcional)"
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
                label="¿En qué gastaste?"
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
                label="¿Qué compraste o pagaste?"
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
                label="¿Cuánto costó?"
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
