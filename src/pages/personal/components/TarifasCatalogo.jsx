import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { formatearMiles, desformatearNumero } from '#lib/formatters';
import {
  PersonalField,
  PersonalInput,
} from './PersonalField.jsx';

export default function TarifasCatalogo({
  tarifaKg,
  setTarifaKg,
  tarifaJornal,
  setTarifaJornal,
  actividades,
  nuevaActividadNombre,
  setNuevaActividadNombre,
  nuevaActividadDescripcion,
  setNuevaActividadDescripcion,
  nuevaActividadEsCosecha,
  setNuevaActividadEsCosecha,
  onAgregarActividad,
  onEliminarActividad,
}) {
  return (
    <section className="space-y-5" id="tarifas-actividades">
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle>Tarifas de mano de obra</CardTitle>
          <CardDescription>
            Los nuevos registros guardan la tarifa aplicada. Cambiar una tarifa
            no modifica los pagos ya cerrados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <PersonalField htmlFor="rate-per-kilogram" label="Tarifa por kilogramo (COP)">
            <PersonalInput
              id="rate-per-kilogram"
              inputMode="numeric"
              onChange={(event) =>
                setTarifaKg(desformatearNumero(event.target.value))
              }
              placeholder="Ej. 1.000"
              required
              type="text"
              value={formatearMiles(tarifaKg)}
            />
          </PersonalField>
          <PersonalField htmlFor="rate-per-workday" label="Tarifa por jornal/día (COP)">
            <PersonalInput
              id="rate-per-workday"
              inputMode="numeric"
              onChange={(event) =>
                setTarifaJornal(desformatearNumero(event.target.value))
              }
              placeholder="Ej. 50.000"
              required
              type="text"
              value={formatearMiles(tarifaJornal)}
            />
          </PersonalField>
          <Button
            className="h-11 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
            onClick={() => {
              if (Number(tarifaKg) <= 0 || Number(tarifaJornal) <= 0) {
                alert('Las tarifas deben ser mayores que cero.');
                return;
              }
              alert('Las tarifas quedaron guardadas.');
            }}
            type="button"
          >
            Confirmar tarifas
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle>Catálogo de actividades laborales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-5" onSubmit={onAgregarActividad}>
            <PersonalField htmlFor="activity-name" label="Nombre de la nueva actividad">
              <PersonalInput
                id="activity-name"
                maxLength={150}
                onChange={(event) => setNuevaActividadNombre(event.target.value)}
                placeholder="Ej. Preparación de almácigo"
                required
                type="text"
                value={nuevaActividadNombre}
              />
            </PersonalField>
            <PersonalField htmlFor="activity-description" label="Descripción (opcional)">
              <PersonalInput
                id="activity-description"
                maxLength={150}
                onChange={(event) =>
                  setNuevaActividadDescripcion(event.target.value)
                }
                placeholder="Detalles de la actividad"
                type="text"
                value={nuevaActividadDescripcion}
              />
            </PersonalField>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                checked={nuevaActividadEsCosecha}
                className="mt-1 accent-emerald-800"
                onChange={(event) =>
                  setNuevaActividadEsCosecha(event.target.checked)
                }
                type="checkbox"
              />
              Es una actividad de recolección (permite pago por kilogramo)
            </label>
            <Button
              className="h-11 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              type="submit"
            >
              Agregar actividad
            </Button>
          </form>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Actividades actuales</h3>
            {actividades.map((activity) => (
              <div
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                key={activity.id || activity.name}
              >
                <div>
                  <p className="font-semibold text-slate-800">{activity.name}</p>
                  <p className="text-sm text-slate-600">
                    {activity.description ||
                      (activity.is_harvest ? 'Recolección' : 'Pago por jornal')}
                  </p>
                </div>
                <Button
                  className="text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => onEliminarActividad(activity)}
                  type="button"
                  variant="outline"
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
