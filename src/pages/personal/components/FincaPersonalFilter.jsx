import { Card, CardContent } from '#components/ui/card';
import { PersonalField, PersonalSelect } from './PersonalField.jsx';

export default function FincaPersonalFilter({
  fincas,
  fincaId,
  fincaSeleccionada,
  onCambiarFinca,
}) {
  return (
    <Card className="mb-6 rounded-2xl border-slate-200 bg-slate-50">
      <CardContent className="space-y-3 p-4">
        <PersonalField htmlFor="personal-farm" label="Finca seleccionada">
          <PersonalSelect
            id="personal-farm"
            onChange={(event) => onCambiarFinca(event.target.value)}
            value={fincaId ?? ''}
          >
            <option value="">Selecciona una finca...</option>
            {fincas.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.nombre}
              </option>
            ))}
          </PersonalSelect>
        </PersonalField>
        {!fincaSeleccionada && (
          <p className="text-sm text-amber-800">
            Crea una finca en el módulo Fincas para registrar labores y
            liquidaciones.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
