// Detalle de un movimiento: monto, fecha, finca y los datos propios de venta o gasto.
import { Pencil } from 'lucide-react';
import DetailDialog, { AmountHighlight, InfoField, InfoGrid } from '#components/shared/DetailDialog';
import IconBadge from '#components/shared/IconBadge';
import { formatoDinero, formatoNumero } from '#lib/formatters';
import {
  getMovementIcon,
  kgToArrobas,
  movementLongDate,
  pricePerKgToArroba,
} from '#lib/domain/movements';

export default function MovementDetailDialog({ movement, onOpenChange, onEdit }) {
  if (!movement) return null;
  const isSale = movement.type === 'sale';

  return (
    <DetailDialog
      badge={<IconBadge icon={getMovementIcon(movement)} tone={isSale ? 'income' : 'expense'} />}
      description={movementLongDate(movement.date)}
      footer={
        movement.isAutomatic ? (
          <p className="text-sm text-muted-foreground">
            Este gasto se creó al registrar un pago en Pagos laborales y no se edita aquí.
          </p>
        ) : (
          <button
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-muted font-semibold text-primary transition-colors hover:bg-secondary active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => onEdit(movement)}
            type="button"
          >
            <Pencil aria-hidden="true" className="size-5" />
            Editar {isSale ? 'venta' : 'gasto'}
          </button>
        )
      }
      onOpenChange={onOpenChange}
      open
      title={movement.title || (isSale ? 'Venta de café' : 'Gasto')}
    >
      <AmountHighlight
        label={isSale ? 'Ingreso por venta' : 'Gasto'}
        tone={isSale ? 'income' : 'expense'}
        value={`${isSale ? '+' : '−'}${formatoDinero(movement.amount)}`}
      />

      <InfoGrid>
        {isSale ? (
          <>
            <InfoField label="Café vendido">
              {formatoNumero(Number(movement.quantity_kg) || 0)} kg (
              {formatoNumero(kgToArrobas(movement.quantity_kg || 0))} @)
            </InfoField>
            <InfoField label="Precio por arroba">
              {formatoDinero(pricePerKgToArroba(movement.unit_price || 0))}
            </InfoField>
            <InfoField label="Precio por kg">
              {formatoDinero(Number(movement.unit_price) || 0)}
            </InfoField>
            {movement.buyer && (
              <InfoField label="Comprador" wide>
                {movement.buyer}
              </InfoField>
            )}
          </>
        ) : (
          <InfoField label="Categoría" wide>
            {movement.categoryLabel}
          </InfoField>
        )}
        <InfoField label="Finca" wide>
          {movement.farmName || 'Sin finca'}
        </InfoField>
        {movement.notes && (
          <InfoField label="Notas" wide>
            <span className="whitespace-pre-wrap font-normal">{movement.notes}</span>
          </InfoField>
        )}
      </InfoGrid>
    </DetailDialog>
  );
}
