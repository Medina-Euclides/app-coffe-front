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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
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
        setError(result);
        return;
      }
      onOpenChange(false);
    } catch (saveError) {
      console.error('Error al guardar el movimiento financiero:', saveError);
      setError(saveError.message || 'No se pudo guardar el movimiento.');
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

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-ink-soft"
              htmlFor="movement-farm"
            >
              Finca
            </label>
            <select
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-ink-soft"
              htmlFor="movement-date"
            >
              Fecha
            </label>
            <Input
              className="h-11 rounded-xl"
              id="movement-date"
              max={localDateValue()}
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </div>

          {type === 'sale' ? (
            <>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-ink-soft"
                  htmlFor="sale-coffee-type"
                >
                  Tipo de café
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  id="sale-coffee-type"
                  onChange={(event) => setConcept(event.target.value)}
                  value={concept}
                >
                  <option value="pergamino">Café pergamino seco</option>
                  <option value="pasilla">Pasilla</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-ink-soft"
                    htmlFor="sale-quantity"
                  >
                    Cantidad (kg)
                  </label>
                  <Input
                    className="h-11 rounded-xl"
                    id="sale-quantity"
                    min="0.01"
                    onChange={(event) => setQuantity(event.target.value)}
                    required
                    step="0.01"
                    type="number"
                    value={quantity}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-ink-soft"
                    htmlFor="sale-unit-price"
                  >
                    Precio por kg (COP)
                  </label>
                  <MoneyInput
                    className="h-11 rounded-xl"
                    id="sale-unit-price"
                    onValueChange={setUnitPrice}
                    required
                    value={unitPrice}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-ink-soft"
                  htmlFor="sale-buyer"
                >
                  Comprador (opcional)
                </label>
                <Input
                  className="h-11 rounded-xl"
                  id="sale-buyer"
                  maxLength={150}
                  onChange={(event) => setBuyer(event.target.value)}
                  value={buyer}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-ink-soft"
                  htmlFor="expense-category"
                >
                  Categoría
                </label>
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
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-ink-soft"
                  htmlFor="expense-concept"
                >
                  Concepto
                </label>
                <Input
                  className="h-11 rounded-xl"
                  id="expense-concept"
                  maxLength={200}
                  onChange={(event) => setConcept(event.target.value)}
                  required
                  value={concept}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-ink-soft"
                  htmlFor="expense-amount"
                >
                  Valor (COP)
                </label>
                <MoneyInput
                  className="h-11 rounded-xl"
                  id="expense-amount"
                  onValueChange={setAmount}
                  required
                  value={amount}
                />
              </div>
            </>
          )}

          {type === 'sale' && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-ink-soft"
                htmlFor="movement-notes"
              >
                Notas (opcional)
              </label>
              <textarea
                className="min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                id="movement-notes"
                onChange={(event) => setNotes(event.target.value)}
                value={notes}
              />
            </div>
          )}

          {error && (
            <p aria-live="polite" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

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
