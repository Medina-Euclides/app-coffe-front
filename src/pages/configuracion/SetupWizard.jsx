import { useState } from 'react';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '#components/ui/card';
import { Input } from '#components/ui/input';
import { obtenerFechaLocal } from '#lib/formatters';

const variedadesCafe = ['Castillo', 'Caturra', 'Colombia', 'Borbón', 'Geisha'];

function leerListaGuardada(clave) {
  const valorGuardado = localStorage.getItem(clave);
  if (valorGuardado === null) return [];

  const valor = JSON.parse(valorGuardado);
  if (!Array.isArray(valor)) {
    throw new Error(`El contenido guardado en "${clave}" no es válido.`);
  }
  return valor;
}

export function SetupWizard({ usuario, onComplete }) {
  const [paso, setPaso] = useState(1);
  const [nombreFinca, setNombreFinca] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [nombreLote, setNombreLote] = useState('');
  const [variedad, setVariedad] = useState(variedadesCafe[0]);
  const [hectareas, setHectareas] = useState('');
  const [error, setError] = useState('');

  const guardarConfiguracion = (event) => {
    event.preventDefault();
    setError('');

    if (!usuario?.id) {
      setError('No se encontró tu sesión. Inicia sesión para continuar.');
      return;
    }

    if (!nombreFinca.trim() || !nombreLote.trim()) {
      setError('Completa el nombre de la finca y del lote para continuar.');
      return;
    }

    const area = hectareas === '' ? null : Number(hectareas);
    if (area !== null && (!Number.isFinite(area) || area <= 0)) {
      setError('Ingresa un área mayor que cero o deja el campo vacío.');
      return;
    }

    try {
      const userId = usuario.id;
      const timestamp = Date.now();
      const finca = {
        id: timestamp,
        nombre: nombreFinca.trim(),
        ubicacion: ubicacion.trim() || 'Principal',
      };
      const lote = {
        id: timestamp + 1,
        fincaId: finca.id,
        nombre: nombreLote.trim(),
        variedad,
        hectareas: area,
        estado: 'activo',
        fechaCreacion: obtenerFechaLocal(),
        fechaDesactivacion: null,
        fechaReactivacion: null,
      };
      const fincasGuardadas = leerListaGuardada(
        `cafesmart_fincas_${userId}`,
      );
      const lotesGuardados = leerListaGuardada(`cafesmart_lotes_${userId}`);

      localStorage.setItem(
        `cafesmart_fincas_${userId}`,
        JSON.stringify([...fincasGuardadas, finca]),
      );
      localStorage.setItem(
        `cafesmart_lotes_${userId}`,
        JSON.stringify([...lotesGuardados, lote]),
      );
      localStorage.setItem(
        `cafesmart_finca_activa_${userId}`,
        String(finca.id),
      );
      onComplete();
    } catch (saveError) {
      console.error('Error al guardar la configuración inicial:', saveError);
      setError(
        'No se pudo guardar la configuración. Revisa el espacio disponible e inténtalo de nuevo.',
      );
    }
  };

  const nombreProductor = usuario?.nombreProductor || 'Productor';

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 px-4 py-10">
      <Card className="w-full max-w-xl gap-0 rounded-3xl border border-emerald-950/10 bg-white/95 py-0 shadow-xl shadow-emerald-950/10">
        <CardHeader className="gap-5 px-6 pt-8 sm:px-9 sm:pt-10">
          <div className="flex items-center gap-4">
            <img
              alt="Logo de CafeSmart"
              className="size-12 rounded-2xl"
              height={48}
              src="/icon.png"
              width={48}
            />
            <div className="min-w-0">
              <p
                className="text-sm font-semibold tracking-wide text-emerald-800"
                translate="no"
              >
                CafeSmart
              </p>
              <p className="text-xs text-slate-500">Configuración inicial</p>
            </div>
          </div>

          {paso > 1 && (
            <div
              aria-label="Progreso de configuración inicial"
              aria-valuemax={2}
              aria-valuemin={1}
              aria-valuenow={paso - 1}
              className="space-y-2"
              role="progressbar"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Tu finca y tu primer lote</span>
                <span>{paso - 1} de 2</span>
              </div>
              <div
                aria-hidden="true"
                className="h-2 overflow-hidden rounded-full bg-emerald-100"
              >
                <div
                  className={`h-full rounded-full bg-emerald-700 transition-[width] motion-reduce:transition-none ${
                    paso === 2 ? 'w-1/2' : 'w-full'
                  }`}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {paso === 1 && '¡Bienvenido a CafeSmart!'}
              {paso === 2 && 'Agrega tu finca'}
              {paso === 3 && 'Crea tu primer lote'}
            </h1>
            <CardDescription className="break-words text-pretty leading-relaxed text-slate-600">
              {paso === 1 &&
                `Te damos la bienvenida, ${nombreProductor}. Configuremos los datos básicos para empezar.`}
              {paso === 2 &&
                'Registra la finca principal donde administras tu producción.'}
              {paso === 3 &&
                'Los lotes te ayudan a organizar variedades y áreas de cultivo.'}
            </CardDescription>
          </div>
        </CardHeader>

        {paso === 1 && (
          <CardContent className="space-y-6 px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
            <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-5">
              <h2 className="font-semibold text-emerald-950">
                Lo que vas a configurar
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-slate-700">
                <li>El nombre y la ubicación de tu finca.</li>
                <li>El nombre, la variedad y el área de tu primer lote.</li>
              </ul>
            </div>
            <Button
              className="h-12 w-full rounded-xl bg-emerald-800 text-base font-semibold text-white hover:bg-emerald-900"
              onClick={() => setPaso(2)}
              type="button"
            >
              Configurar mi finca
            </Button>
          </CardContent>
        )}

        {paso === 2 && (
          <CardContent className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!nombreFinca.trim()) {
                  setError('Ingresa el nombre de tu finca para continuar.');
                  return;
                }
                setError('');
                setPaso(3);
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="nombre-finca"
                >
                  Nombre de la finca
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  id="nombre-finca"
                  name="farmName"
                  onChange={(event) => setNombreFinca(event.target.value)}
                  placeholder="Ej.: Finca El Roble…"
                  required
                  value={nombreFinca}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="ubicacion-finca"
                >
                  Ubicación <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  id="ubicacion-finca"
                  name="farmLocation"
                  onChange={(event) => setUbicacion(event.target.value)}
                  placeholder="Ej.: Vereda El Roble…"
                  value={ubicacion}
                />
              </div>
              {error && (
                <p
                  aria-live="polite"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  className="h-12 flex-1 rounded-xl"
                  onClick={() => setPaso(1)}
                  type="button"
                  variant="outline"
                >
                  Atrás
                </Button>
                <Button
                  className="h-12 flex-1 rounded-xl bg-emerald-800 font-semibold text-white hover:bg-emerald-900"
                  type="submit"
                >
                  Continuar al lote
                </Button>
              </div>
            </form>
          </CardContent>
        )}

        {paso === 3 && (
          <CardContent className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
            <form className="space-y-5" onSubmit={guardarConfiguracion}>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="nombre-lote"
                >
                  Nombre del lote
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  id="nombre-lote"
                  name="lotName"
                  onChange={(event) => setNombreLote(event.target.value)}
                  placeholder="Ej.: Lote El Mirador…"
                  required
                  value={nombreLote}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="variedad-lote"
                >
                  Variedad de café
                </label>
                <select
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  id="variedad-lote"
                  name="coffeeVariety"
                  onChange={(event) => setVariedad(event.target.value)}
                  value={variedad}
                >
                  {variedadesCafe.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="hectareas-lote"
                >
                  Área en hectáreas{' '}
                  <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  id="hectareas-lote"
                  min="0.1"
                  name="areaHectares"
                  onChange={(event) => setHectareas(event.target.value)}
                  placeholder="Ej.: 2.5…"
                  step="0.1"
                  type="number"
                  value={hectareas}
                />
              </div>

              {error && (
                <p
                  aria-live="polite"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  className="h-12 flex-1 rounded-xl"
                  onClick={() => {
                    setError('');
                    setPaso(2);
                  }}
                  type="button"
                  variant="outline"
                >
                  Atrás
                </Button>
                <Button
                  className="h-12 flex-1 rounded-xl bg-emerald-800 font-semibold text-white hover:bg-emerald-900"
                  type="submit"
                >
                  Guardar y entrar
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
