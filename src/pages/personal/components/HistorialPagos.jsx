import { Card, CardContent } from '#components/ui/card';
import { dinero } from '#lib/formatters';
import { OPCIONES_JORNAL } from '#lib/constants';
import {
  PersonalField,
  PersonalInput,
  PersonalSelect,
} from './PersonalField.jsx';

export default function HistorialPagos({
  fincaSeleccionada,
  busquedaHistorial,
  setBusquedaHistorial,
  periodoHistorial,
  setPeriodoHistorial,
  historialAgrupado,
}) {
  return (
    <section className="mt-7 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">
        Historial de labores pagadas
      </h3>

      {fincaSeleccionada && (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
            <PersonalField
              htmlFor="payment-history-search"
              label="Buscar trabajador por nombre o cédula"
            >
              <PersonalInput
                id="payment-history-search"
                onChange={(event) =>
                  setBusquedaHistorial(event.target.value || '')
                }
                placeholder="Ej. Carlos o 1061..."
                type="text"
                value={busquedaHistorial}
              />
            </PersonalField>
            <PersonalField htmlFor="payment-history-period" label="Filtrar por período">
              <PersonalSelect
                id="payment-history-period"
                onChange={(event) => setPeriodoHistorial(event.target.value)}
                value={periodoHistorial}
              >
                <option value="todos">Histórico completo</option>
                <option value="este_mes">Este mes</option>
                <option value="mes_anterior">Mes anterior</option>
                <option value="este_ano">Año actual</option>
              </PersonalSelect>
            </PersonalField>
          </CardContent>
        </Card>
      )}

      {!fincaSeleccionada ? (
        <p>Selecciona una finca para consultar el historial.</p>
      ) : historialAgrupado.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {busquedaHistorial || periodoHistorial !== 'todos'
            ? 'No se encontraron pagos con los filtros aplicados.'
            : `No hay labores pagadas registradas para ${fincaSeleccionada.nombre}.`}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {historialAgrupado.map((group) => (
            <Card className="rounded-2xl border-slate-200" key={group.idUnico}>
              <CardContent className="p-5">
                <div className="flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <strong className="block font-semibold text-emerald-800">
                      {group.trabajador}{' '}
                      {group.cedula ? `(C.C. ${group.cedula})` : ''}
                    </strong>
                    <span className="text-sm text-slate-600">
                      Día laborado: {group.fecha}
                    </span>
                  </div>
                  <span className="text-sm text-slate-600">
                    Pagado el: {group.fechaPago}
                  </span>
                </div>

                <ul className="my-4 space-y-2">
                  {group.labores.map((labor) => {
                    let textoCantidad = `${labor.cantidad} días`;
                    if (labor.modalidad === 'jornal') {
                      const option = OPCIONES_JORNAL.find(
                        (item) => item.valor === String(labor.cantidad),
                      );
                      if (option) textoCantidad = option.etiqueta;
                    } else {
                      textoCantidad = `${labor.cantidad} kg`;
                    }

                    return (
                      <li
                        className="flex flex-wrap justify-between gap-2 text-sm"
                        key={labor.id}
                      >
                        <span className="text-slate-700">
                          {labor.actividad} ({textoCantidad})
                        </span>
                        <span className="text-slate-600">
                          {dinero(labor.subtotal)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-dashed border-slate-300 pt-3 text-right">
                  <span className="mr-2 text-sm text-slate-600">
                    Total del día:
                  </span>
                  <strong className="text-lg font-semibold text-emerald-800">
                    {dinero(group.totalPagado)}
                  </strong>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
