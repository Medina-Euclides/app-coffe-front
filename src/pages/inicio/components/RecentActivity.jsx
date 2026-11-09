// «Lo más reciente»: los últimos registros de la semana y el modal con todos.
import { useState } from 'react';
import { Coffee } from 'lucide-react';
import DetailDialog from '#components/shared/DetailDialog';
import FilaReciente, { enlaceTarjeta } from './FilaReciente.jsx';

const MAX_RECIENTES = 5;

// `todos` es null mientras cargan las jornadas.
export default function RecentActivity({ todos, rango, fechaHoy, fechaAyer }) {
  const [verTodoAbierto, setVerTodoAbierto] = useState(false);
  const recientes = todos?.slice(0, MAX_RECIENTES) ?? [];
  const fila = (item) => (
    <FilaReciente fechaAyer={fechaAyer} fechaHoy={fechaHoy} item={item} key={item.id} />
  );

  return (
    <>
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <h3 className="text-lg text-foreground">Lo más reciente</h3>
          {todos && todos.length > MAX_RECIENTES && (
            <button
              className={`-mr-2 inline-flex min-h-11 cursor-pointer items-center rounded-xl px-2 text-sm font-medium text-primary hover:bg-tint ${enlaceTarjeta}`}
              onClick={() => setVerTodoAbierto(true)}
              type="button"
            >
              Ver todo ({todos.length})
            </button>
          )}
        </div>

        {todos && recientes.length === 0 ? (
          <div className="flex flex-col items-center px-5 pt-6 pb-8 text-center">
            <Coffee aria-hidden="true" className="size-8 text-primary" />
            <p className="mt-3 font-medium text-ink-soft">Aún no hay registros esta semana</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Usa los accesos rápidos para registrar el primero.
            </p>
          </div>
        ) : (
          <ul className="px-2 pt-1 pb-2">{recientes.map(fila)}</ul>
        )}
      </div>

      <DetailDialog
        description={`Esta semana · ${rango}`}
        onOpenChange={setVerTodoAbierto}
        open={verTodoAbierto}
        title="Lo más reciente"
      >
        <ul className="-mx-2">{(todos ?? []).map(fila)}</ul>
      </DetailDialog>
    </>
  );
}
