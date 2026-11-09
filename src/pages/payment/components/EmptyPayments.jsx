// Estado vacío de Pagos: sin resultados, sin pagos en la pestaña o error al cargar.
import { Search, UserRound } from 'lucide-react';
import { Button } from '#components/ui/button';
import EmptyState from '#components/shared/EmptyState';

export default function EmptyPayments({ hasSettlements, errorMessage, onRetry }) {
  const hasError = Boolean(errorMessage);
  return (
    <EmptyState
      action={
        hasError && (
          <Button
            className="h-11 rounded-xl border-border text-primary"
            onClick={() => onRetry()}
            type="button"
            variant="outline"
          >
            Intentar de nuevo
          </Button>
        )
      }
      description={
        hasError
          ? errorMessage
          : hasSettlements
            ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
            : 'Para que una jornada aparezca como pendiente de pago, debe estar cerrada. Los pesajes y participaciones de pago por jornal de jornadas cerradas aparecerán aquí si aún no fueron incluidos en una liquidación.'
      }
      icon={hasError ? Search : UserRound}
      title={
        hasError
          ? 'No se pudieron cargar los pagos'
          : hasSettlements
            ? 'No hay resultados para estos filtros'
            : 'No hay pagos en esta pestaña'
      }
    />
  );
}
