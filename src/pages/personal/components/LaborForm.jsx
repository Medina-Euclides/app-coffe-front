import { Button } from '#components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { dinero, hoy } from '#lib/formatters';
import {
  PersonalField,
  PersonalInput,
  PersonalSelect,
} from './PersonalField.jsx';

export default function LaborForm({
  fincaSeleccionada,
  trabajadores,
  trabajadorId,
  setTrabajadorId,
  actividades,
  actividadSeleccionada,
  setActividadSeleccionada,
  lotesDeFinca,
  loteId,
  setLoteId,
  modalidad,
  setModalidad,
  tarifaKg,
  tarifaJornal,
  fecha,
  setFecha,
  onGuardarJornada,
}) {
  const actividadActual = actividades.find(
    (activity) => activity.name === actividadSeleccionada,
  );

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardHeader>
        <CardTitle>Asignar labor a un trabajador</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" id="registrar-labor" onSubmit={onGuardarJornada}>
          {!fincaSeleccionada && (
            <p className="text-sm text-amber-800">
              Selecciona primero una finca en el selector de arriba.
            </p>
          )}

          <PersonalField htmlFor="labor-worker" label="Trabajador">
            <PersonalSelect
              id="labor-worker"
              onChange={(event) => setTrabajadorId(event.target.value)}
              required
              value={trabajadorId}
            >
              <option value="">Selecciona un trabajador...</option>
              {trabajadores.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.nombre} {worker.cedula ? `(C.C. ${worker.cedula})` : ''}
                </option>
              ))}
            </PersonalSelect>
          </PersonalField>

          <PersonalField htmlFor="labor-activity" label="Actividad">
            <PersonalSelect
              id="labor-activity"
              onChange={(event) => setActividadSeleccionada(event.target.value)}
              required
              value={actividadSeleccionada}
            >
              <option value="">Selecciona un tipo de actividad...</option>
              {actividades.map((activity) => (
                <option
                  key={activity.id || activity.name}
                  value={activity.name}
                >
                  {activity.name}
                  {activity.is_harvest ? ' (recolección)' : ''}
                </option>
              ))}
            </PersonalSelect>
          </PersonalField>

          <PersonalField htmlFor="labor-lot" label="Lote">
            <PersonalSelect
              disabled={!fincaSeleccionada || lotesDeFinca.length === 0}
              id="labor-lot"
              onChange={(event) => setLoteId(event.target.value)}
              required
              value={loteId}
            >
              <option value="">
                {!fincaSeleccionada
                  ? 'Selecciona primero una finca arriba...'
                  : lotesDeFinca.length === 0
                    ? 'Esta finca no tiene lotes registrados'
                    : 'Selecciona un lote...'}
              </option>
              {lotesDeFinca.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.nombre}
                  {lot.variedad ? ` (${lot.variedad})` : ''}
                </option>
              ))}
            </PersonalSelect>
          </PersonalField>

          <PersonalField htmlFor="labor-payment-mode" label="Modalidad de pago">
            <PersonalSelect
              id="labor-payment-mode"
              onChange={(event) => setModalidad(event.target.value)}
              value={modalidad}
            >
              {actividadActual?.is_harvest && (
                <option value="recoleccion">
                  Por kilogramo — {dinero(Number(tarifaKg))}
                </option>
              )}
              <option value="jornal">
                Por jornal/día — {dinero(Number(tarifaJornal))}
              </option>
            </PersonalSelect>
          </PersonalField>

          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {modalidad === 'recoleccion'
              ? 'Los kilos recolectados se ingresarán cuando vayas a liquidar el pago.'
              : 'El tiempo trabajado (medio día, día completo, etc.) se seleccionará cuando vayas a liquidar el pago.'}
          </p>

          <PersonalField htmlFor="labor-date" label="Fecha de la labor">
            <PersonalInput
              id="labor-date"
              max={hoy()}
              onChange={(event) => setFecha(event.target.value)}
              required
              type="date"
              value={fecha}
            />
          </PersonalField>

          <Button
            className="h-11 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
            disabled={!fincaSeleccionada}
            type="submit"
          >
            Asignar labor
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
