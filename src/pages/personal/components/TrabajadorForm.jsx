import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import {
  PersonalField,
  PersonalInput,
} from './PersonalField.jsx';

export default function TrabajadorForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  identification,
  setIdentification,
  phone,
  setPhone,
  trabajadores,
  onGuardarTrabajador,
}) {
  return (
    <section className="space-y-5" id="nuevo-trabajador">
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle>Crear nuevo trabajador</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onGuardarTrabajador}>
            <PersonalField htmlFor="worker-first-name" label="Nombre">
              <PersonalInput
                id="worker-first-name"
                maxLength={150}
                minLength={2}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Ej. Carlos"
                required
                type="text"
                value={firstName}
              />
            </PersonalField>

            <PersonalField htmlFor="worker-last-name" label="Apellido">
              <PersonalInput
                id="worker-last-name"
                maxLength={150}
                minLength={2}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Ej. Ramírez"
                required
                type="text"
                value={lastName}
              />
            </PersonalField>

            <PersonalField
              htmlFor="worker-identification"
              label="Identificación (opcional)"
            >
              <PersonalInput
                id="worker-identification"
                maxLength={150}
                onChange={(event) => setIdentification(event.target.value)}
                placeholder="Ej. 1061234567"
                type="text"
                value={identification}
              />
            </PersonalField>

            <PersonalField htmlFor="worker-phone" label="Teléfono (opcional)">
              <PersonalInput
                id="worker-phone"
                maxLength={150}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ej. 3001234567"
                type="tel"
                value={phone}
              />
            </PersonalField>

            <Button
              className="h-11 rounded-xl bg-emerald-800 px-5 text-white hover:bg-emerald-900"
              type="submit"
            >
              Guardar trabajador
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle>Lista de trabajadores registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {trabajadores.length === 0 ? (
            <p className="text-sm text-slate-600">
              No hay trabajadores registrados en la base de datos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="p-2 font-medium">Cédula</th>
                    <th className="p-2 font-medium">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajadores.map((worker) => (
                    <tr className="border-b border-slate-100" key={worker.id}>
                      <td className="p-2 font-semibold text-emerald-800">
                        {worker.cedula || 'Sin cédula'}
                      </td>
                      <td className="p-2 font-semibold">{worker.nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
