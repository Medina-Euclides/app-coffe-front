// Asistente de configuración inicial: crea finca, lote, actividad y primer trabajador.
import { useState } from 'react';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '#components/ui/card';
import { Input } from '#components/ui/input';
import NoticeBanner from '#components/shared/NoticeBanner';
import { api } from '#services/api';
import {
  guardarCacheFincasYLotes,
  guardarFincaActiva,
} from '#services/farmStorage';
import MaduracionStripe from '#components/shared/MaduracionStripe';
import { guardarCacheTrabajadores } from '#services/workerStorage';
import { saveWorkerRequest, validateWorker } from '#pages/trabajadores/workerActions';

const variedadesCafe = ['Castillo', 'Caturra', 'Colombia', 'Borbón', 'Geisha'];
const etapas = ['Finca', 'Lote', 'Actividad', 'Trabajador'];

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
  const [plantas, setPlantas] = useState('');
  const [nombreActividad, setNombreActividad] = useState('');
  const [error, setError] = useState('');
  const [fincaCreada, setFincaCreada] = useState(null);
  const [loteCreado, setLoteCreado] = useState(null);
  const [actividadCreada, setActividadCreada] = useState(null);
  const [nombreTrabajador, setNombreTrabajador] = useState('');
  const [apellidoTrabajador, setApellidoTrabajador] = useState('');
  const [cedulaTrabajador, setCedulaTrabajador] = useState('');
  const [trabajadorCreado, setTrabajadorCreado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const datosTrabajador = () => ({
    first_name: nombreTrabajador.trim(),
    last_name: apellidoTrabajador.trim(),
    identification: cedulaTrabajador.trim(),
    phone: '',
  });

  const guardarConfiguracion = async (event, { conTrabajador = true } = {}) => {
    event?.preventDefault();
    setError('');
    const actividadOpcional = nombreActividad;

    if (!usuario?.id) {
      setError('No se encontró tu sesión. Inicia sesión para continuar.');
      return;
    }

    if (!nombreFinca.trim() || !nombreLote.trim()) {
      setError('Completa el nombre de la finca y del lote para continuar.');
      return;
    }
    if (actividadOpcional.trim() && actividadOpcional.trim().length < 2) {
      setError('El nombre de la actividad debe tener al menos 2 caracteres.');
      return;
    }

    const area = hectareas === '' ? null : Number(hectareas);
    if (area !== null && (!Number.isFinite(area) || area <= 0)) {
      setError('Ingresa un área mayor que cero o deja el campo vacío.');
      return;
    }
    const plantCount = plantas === '' ? null : Number(plantas);
    if (
      plantCount !== null &&
      (!Number.isInteger(plantCount) || plantCount < 0)
    ) {
      setError('Ingresa un número entero de plantas igual o mayor que cero.');
      return;
    }

    if (conTrabajador) {
      const errorTrabajador = validateWorker(datosTrabajador(), [], null);
      if (errorTrabajador) {
        setError(errorTrabajador);
        return;
      }
    }

    setGuardando(true);
    try {
      const userId = usuario.id;
      const fincasGuardadas = leerListaGuardada(
        `cafesmart_fincas_${userId}`,
      );
      const lotesGuardados = leerListaGuardada(`cafesmart_lotes_${userId}`);
      const finca =
        fincaCreada ||
        (await api.farms.create({
          name: nombreFinca.trim(),
          location: ubicacion.trim(),
          description: '',
        }));
      setFincaCreada(finca);
      const lote =
        loteCreado ||
        (await api.lots.create({
          id_farm: finca.id,
          name: nombreLote.trim(),
          coffee_variety: variedad,
          area_hectares: area,
          plant_count: plantCount,
          description: '',
        }));
      setLoteCreado(lote);
      const actividad =
        actividadCreada ||
        (await api.activities.create({
          name: actividadOpcional.trim() || 'Recolección de café',
          description: '',
          is_harvest: true,
        }));
      setActividadCreada(actividad);
      if (conTrabajador) {
        const trabajador =
          trabajadorCreado ||
          (await saveWorkerRequest(datosTrabajador(), null));
        setTrabajadorCreado(trabajador);
        guardarCacheTrabajadores(userId, [
          ...leerListaGuardada(`cafesmart_trabajadores_${userId}`),
          trabajador,
        ]);
      }
      guardarCacheFincasYLotes(
        userId,
        [...fincasGuardadas, finca],
        [...lotesGuardados, lote],
      );
      guardarFincaActiva(userId, finca.id);
      onComplete();
    } catch (saveError) {
      console.error('Error al guardar la configuración inicial:', saveError);
      setError(saveError.message || 'No se pudo guardar la configuración inicial.');
    } finally {
      setGuardando(false);
    }
  };

  const nombreProductor =
    usuario?.full_name ||
    [usuario?.first_name, usuario?.last_name].filter(Boolean).join(' ') ||
    usuario?.nombreProductor ||
    'Productor';

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl gap-0 overflow-hidden rounded-2xl border border-border bg-card py-0 shadow-[0_24px_48px_-32px_rgb(21_40_30/0.35)]">
        <MaduracionStripe />
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
                className="text-sm font-semibold text-primary"
                translate="no"
              >
                CafeSmart
              </p>
              <p className="text-xs text-muted-foreground">Configuración inicial</p>
            </div>
          </div>

          {paso > 1 && (
            <div
              aria-label="Progreso de configuración inicial"
              aria-valuemax={etapas.length}
              aria-valuemin={1}
              aria-valuenow={paso - 1}
              aria-valuetext={`${etapas[paso - 2]}, paso ${paso - 1} de ${etapas.length}`}
              className="space-y-2"
              role="progressbar"
            >
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {etapas[paso - 2]}
                </span>
                <span className="tabular-nums">
                  {paso - 1} de {etapas.length}
                </span>
              </div>
              <ol aria-hidden="true" className="grid grid-cols-4 gap-1.5">
                {etapas.map((etapa, indice) => (
                  <li
                    className={`h-2 rounded-full transition-colors motion-reduce:transition-none ${
                      indice <= paso - 2 ? 'bg-primary' : 'bg-secondary'
                    }`}
                    key={etapa}
                  />
                ))}
              </ol>
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-4xl text-foreground sm:text-5xl">
              {paso === 1 && '¡Bienvenido a CafeSmart!'}
              {paso === 2 && 'Agrega tu finca'}
              {paso === 3 && 'Crea tu primer lote'}
              {paso === 4 && 'Agrega una actividad'}
              {paso === 5 && 'Registra tu primer trabajador'}
            </h1>
            <CardDescription className="break-words text-pretty leading-relaxed text-muted-foreground">
              {paso === 1 &&
                `Te damos la bienvenida, ${nombreProductor}. Configuremos los datos básicos para empezar.`}
              {paso === 2 &&
                'Registra la finca principal donde administras tu producción.'}
              {paso === 3 &&
                'Los lotes te ayudan a organizar variedades y áreas de cultivo.'}
              {paso === 4 &&
                'Crea una actividad de recolección para registrar los pesajes. Si omites este paso, agregaremos “Recolección de café” por ti.'}
              {paso === 5 &&
                'Con una persona registrada ya puedes abrir tu primera jornada del día. Podrás agregar más trabajadores cuando quieras.'}
            </CardDescription>
          </div>
        </CardHeader>

        {paso === 1 && (
          <CardContent className="space-y-6 px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
            <div className="rounded-2xl border border-border bg-tint p-5">
              <h2 className="font-semibold text-foreground">
                Lo que vas a configurar
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-ink-soft">
                <li>El nombre y la ubicación de tu finca.</li>
                <li>El nombre, la variedad y el área de tu primer lote.</li>
                <li>El número de plantas de café de tu lote (opcional).</li>
                <li>Una actividad para registrar la recolección de café.</li>
                <li>Tu primer trabajador, para empezar a registrar jornadas.</li>
              </ul>
            </div>
            <Button
              className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
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
              <NoticeBanner message={error} isError />
              <WizardActions>
                <Button
                  className={btnAtras}
                  onClick={() => setPaso(1)}
                  type="button"
                  variant="outline"
                >
                  Atrás
                </Button>
                <Button
                  className={btnPrimario}
                  type="submit"
                >
                  Continuar al lote
                </Button>
              </WizardActions>
            </form>
          </CardContent>
        )}
        {paso === 4 && (
          <CardContent className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                const nombre = nombreActividad.trim();
                if (nombre && nombre.length < 2) {
                  setError('El nombre de la actividad debe tener al menos 2 caracteres.');
                  return;
                }
                setError('');
                setPaso(5);
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="nombre-actividad"
                >
                  Nombre de la actividad
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  id="nombre-actividad"
                  maxLength={150}
                  minLength={2}
                  name="activityName"
                  onChange={(event) => setNombreActividad(event.target.value)}
                  placeholder="Ej.: Recolección de café…"
                  value={nombreActividad}
                />
                <p className="text-sm leading-5 text-muted-foreground">
                  La actividad quedará marcada como recolección y se usará de
                  forma predeterminada al registrar pesajes.
                </p>
              </div>

              <NoticeBanner message={error} isError />

              <WizardActions>
                <Button
                  className={btnAtras}
                  disabled={guardando || Boolean(loteCreado)}
                  onClick={() => {
                    setError('');
                    setPaso(3);
                  }}
                  type="button"
                  variant="outline"
                >
                  Atrás
                </Button>
                <Button
                  className={btnSecundario}
                  disabled={guardando}
                  onClick={() => {
                    setNombreActividad('');
                    setError('');
                    setPaso(5);
                  }}
                  type="button"
                  variant="outline"
                >
                  Usar la predeterminada
                </Button>
                <Button
                  className={btnPrimario}
                  disabled={guardando}
                  type="submit"
                >
                  Continuar al trabajador
                </Button>
              </WizardActions>
            </form>
          </CardContent>
        )}

        {paso === 5 && (
          <CardContent className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
            <form
              className="space-y-5"
              onSubmit={(event) => guardarConfiguracion(event)}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="nombre-trabajador"
                  >
                    Nombre
                  </label>
                  <Input
                    autoComplete="off"
                    className="h-12 rounded-xl px-4"
                    disabled={Boolean(trabajadorCreado)}
                    id="nombre-trabajador"
                    maxLength={150}
                    name="first_name"
                    onChange={(event) => setNombreTrabajador(event.target.value)}
                    placeholder="Ej.: María…"
                    value={nombreTrabajador}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="apellido-trabajador"
                  >
                    Apellido
                  </label>
                  <Input
                    autoComplete="off"
                    className="h-12 rounded-xl px-4"
                    disabled={Boolean(trabajadorCreado)}
                    id="apellido-trabajador"
                    maxLength={150}
                    name="last_name"
                    onChange={(event) => setApellidoTrabajador(event.target.value)}
                    placeholder="Ej.: Gómez…"
                    value={apellidoTrabajador}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="cedula-trabajador"
                >
                  Cédula <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  disabled={Boolean(trabajadorCreado)}
                  id="cedula-trabajador"
                  inputMode="numeric"
                  maxLength={150}
                  name="identification"
                  onChange={(event) => setCedulaTrabajador(event.target.value)}
                  placeholder="Ej.: 1061234567…"
                  value={cedulaTrabajador}
                />
                <p className="text-sm leading-5 text-muted-foreground">
                  El teléfono y los demás datos los puedes completar luego en
                  Trabajadores.
                </p>
              </div>

              <NoticeBanner message={error} isError />

              <WizardActions>
                <Button
                  className={btnAtras}
                  disabled={guardando || Boolean(actividadCreada)}
                  onClick={() => {
                    setError('');
                    setPaso(4);
                  }}
                  type="button"
                  variant="outline"
                >
                  Atrás
                </Button>
                <Button
                  className={btnSecundario}
                  disabled={guardando || Boolean(trabajadorCreado)}
                  onClick={() => guardarConfiguracion(undefined, { conTrabajador: false })}
                  type="button"
                  variant="outline"
                >
                  Omitir por ahora
                </Button>
                <Button
                  className={btnPrimario}
                  disabled={guardando}
                  type="submit"
                >
                  {guardando ? 'Guardando…' : 'Guardar y entrar'}
                </Button>
              </WizardActions>
            </form>
          </CardContent>
        )}

        {paso === 3 && (
          <CardContent className="px-6 pb-8 pt-7 sm:px-9 sm:pb-10">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!nombreLote.trim()) {
                  setError('Ingresa el nombre de tu lote para continuar.');
                  return;
                }
                setError('');
                setPaso(4);
              }}
            >
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
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="plantas-lote"
                >
                  Número de plantas de café{' '}
                  <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  id="plantas-lote"
                  min="0"
                  name="plantCount"
                  onChange={(event) => setPlantas(event.target.value)}
                  placeholder="Ej.: 1200…"
                  step="1"
                  type="number"
                  value={plantas}
                />
              </div>

              <NoticeBanner message={error} isError />

              <WizardActions>
                <Button
                  className={btnAtras}
                  disabled={guardando || Boolean(fincaCreada)}
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
                  className={btnPrimario}
                  disabled={guardando}
                  type="submit"
                >
                  Continuar a la actividad
                </Button>
              </WizardActions>
            </form>
          </CardContent>
        )}
      </Card>
    </main>
  );
}

const btnBase =
  'h-12 min-h-12 shrink-0 rounded-xl px-5 text-base sm:flex-1 sm:basis-0';
const btnPrimario = `${btnBase} bg-primary font-semibold text-primary-foreground hover:bg-primary-hover`;
const btnSecundario = `${btnBase} font-medium`;
const btnAtras = `${btnBase} border-transparent bg-transparent font-medium text-muted-foreground shadow-none hover:bg-secondary hover:text-foreground sm:max-w-32`;

/**
 * Barra de acciones del asistente. En el DOM va Atrás → secundarias → principal
 * (orden lógico de teclado). En móvil se apila invertida: la acción principal
 * queda arriba a ancho completo y «Atrás» al final como acción discreta.
 */
function WizardActions({ children }) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center">
      {children}
    </div>
  );
}
