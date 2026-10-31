import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { dinero } from '#lib/formatters';
import { OPCIONES_JORNAL } from '#lib/constants';
import { PersonalInput, PersonalSelect } from './PersonalField.jsx';

export default function LiquidacionesList({
  fincaSeleccionada,
  trabajadores,
  trabajadoresConPendientes,
  jornadasPendientes,
  calcularPendiente,
  cantidadesLiquidacion,
  setCantidadesLiquidacion,
  tarifaKg,
  tarifaJornal,
  lotesPorId,
  onRealizarPago,
}) {
  return (
    <section className="space-y-4" id="liquidaciones">
      <h3 className="text-lg font-semibold text-slate-900">
        Liquidaciones pendientes
      </h3>

      {!fincaSeleccionada ? (
        <p>Selecciona una finca para consultar sus liquidaciones.</p>
      ) : trabajadores.length === 0 ? (
        <p>No tienes trabajadores registrados. Agrega uno desde el menú lateral.</p>
      ) : trabajadoresConPendientes.length === 0 ? (
        <p>No hay liquidaciones pendientes para {fincaSeleccionada.nombre}.</p>
      ) : (
        trabajadoresConPendientes.map((trabajador) => {
          const records = jornadasPendientes(trabajador.id, fincaSeleccionada.id);
          const pendiente = calcularPendiente(trabajador.id, fincaSeleccionada.id);

          return (
            <Card className="rounded-2xl border-slate-200" key={trabajador.id}>
              <CardHeader>
                <CardTitle>{trabajador.nombre}</CardTitle>
                <p className="text-sm text-slate-600">
                  {records.length} labor(es) pendiente(s) en {fincaSeleccionada.nombre}
                </p>
                <p className="text-lg font-semibold text-red-700">
                  Valor calculado: {dinero(pendiente)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <th className="p-2 font-medium">Fecha</th>
                        <th className="p-2 font-medium">Actividad</th>
                        <th className="p-2 font-medium">Lote</th>
                        <th className="p-2 text-right font-medium">
                          Tiempo / Cantidad
                        </th>
                        <th className="p-2 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((workday) => {
                        const amount =
                          cantidadesLiquidacion[workday.id] ??
                          workday.cantidad ??
                          '';
                        const numericAmount = Number(amount);
                        const rate = Number(
                          workday.tarifaAplicada ||
                            (workday.modalidad === 'recoleccion'
                              ? tarifaKg
                              : tarifaJornal),
                        );
                        const value =
                          amount !== '' && numericAmount > 0
                            ? numericAmount * rate
                            : 0;

                        return (
                          <tr
                            className="border-b border-slate-100"
                            key={workday.id}
                          >
                            <td className="p-2">{workday.fecha}</td>
                            <td className="p-2">{workday.actividad}</td>
                            <td className="p-2">
                              {lotesPorId.get(String(workday.loteId))?.nombre ||
                                workday.lote ||
                                'Lote anterior'}
                            </td>
                            <td className="p-2 text-right">
                              {workday.modalidad === 'recoleccion' ? (
                                <>
                                  <PersonalInput
                                    className="min-w-24"
                                    min="0.1"
                                    onChange={(event) =>
                                      setCantidadesLiquidacion((previous) => ({
                                        ...previous,
                                        [workday.id]: event.target.value,
                                      }))
                                    }
                                    placeholder="Kilos"
                                    step="0.1"
                                    type="number"
                                    value={amount}
                                  />
                                  <small className="mt-1 block text-slate-500">
                                    Kilogramos
                                  </small>
                                </>
                              ) : (
                                <>
                                  <PersonalSelect
                                    className="min-w-36"
                                    onChange={(event) =>
                                      setCantidadesLiquidacion((previous) => ({
                                        ...previous,
                                        [workday.id]: event.target.value,
                                      }))
                                    }
                                    value={amount}
                                  >
                                    <option value="">Selecciona tiempo...</option>
                                    {OPCIONES_JORNAL.map((option) => (
                                      <option
                                        key={option.valor}
                                        value={option.valor}
                                      >
                                        {option.etiqueta}
                                      </option>
                                    ))}
                                  </PersonalSelect>
                                  <small className="mt-1 block text-slate-500">
                                    Tiempo trabajado
                                  </small>
                                </>
                              )}
                            </td>
                            <td className="p-2 text-right">{dinero(value)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Button
                  className="h-11 w-full rounded-xl bg-emerald-800 text-white hover:bg-emerald-900"
                  onClick={() => onRealizarPago(trabajador)}
                  type="button"
                >
                  Liquidar labores y registrar pago
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </section>
  );
}
