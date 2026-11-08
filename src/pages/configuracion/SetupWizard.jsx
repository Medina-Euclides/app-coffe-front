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
import { FormAlert, FormField } from '#components/shared/FormFeedback';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { api } from '#services/api';
import { guardarFincaActiva } from '#services/farmStorage';
import MaduracionStripe from '#components/shared/MaduracionStripe';
import { saveWorkerRequest, validateWorker } from '#pages/trabajadores/workerActions';

const variedadesCafe = ['Castillo', 'Caturra', 'Colombia', 'Borbón', 'Geisha'];
const etapas = ['Finca', 'Lote', 'Actividad', 'Trabajador'];

export function SetupWizard({ usuario, onComplete }) {
  const [paso, setPaso] = useState(1);
  const [nombreFinca, setNombreFinca] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [nombreLote, setNombreLote] = useState('');
  const [variedad, setVariedad] = useState(variedadesCafe[0]);
  const [hectareas, setHectareas] = useState('');
  const [plantas, setPlantas] = useState('');
  const [nombreActividad, setNombreActividad] = useState('');
  const feedback = useFormFeedback();
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
    feedback.clearFormError();
    const actividadOpcional = nombreActividad;

    // Los pasos anteriores ya validan sus campos; esto cubre casos raros
    // (sesión perdida, volver atrás y borrar) con un aviso que dice dónde ir.
    if (!usuario?.id) {
      feedback.setFormError('Tu sesión se cerró. Vuelve a iniciar sesión para continuar.');
      return;
    }

    if (!nombreFinca.trim() || !nombreLote.trim()) {
      feedback.setFormError(
        'Falta el nombre de la finca o del lote. Vuelve atrás y complétalo.',
      );
      return;
    }
    if (actividadOpcional.trim() && actividadOpcional.trim().length < 2) {
      feedback.setFormError(
        'El nombre de la actividad es muy corto. Vuelve atrás y usa al menos 2 caracteres.',
      );
      return;
    }

    const area = hectareas === '' ? null : Number(hectareas);
    if (area !== null && (!Number.isFinite(area) || area <= 0)) {
      feedback.setFormError(
        'El área del lote debe ser mayor que cero. Vuelve atrás para corregirla o déjala vacía.',
      );
      return;
    }
    const plantCount = plantas === '' ? null : Number(plantas);
    if (
      plantCount !== null &&
      (!Number.isInteger(plantCount) || plantCount < 0)
    ) {
      feedback.setFormError(
        'El número de plantas debe ser un número entero. Vuelve atrás para corregirlo.',
      );
      return;
    }

    if (conTrabajador) {
      const errorTrabajador = validateWorker(datosTrabajador(), [], null);
      if (errorTrabajador) {
        feedback.setFormError(errorTrabajador);
        return;
      }
    }

    setGuardando(true);
    try {
      const userId = usuario.id;
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
      }
      guardarFincaActiva(userId, finca.id);
      onComplete();
    } catch (saveError) {
      console.error('Error al guardar la configuración inicial:', saveError);
      feedback.setFormError(
        saveError.message ||
          'No se pudo guardar la configuración. Revisa tu conexión e inténtalo de nuevo.',
      );
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
              {...feedback.formProps}
              onSubmit={(event) => {
                event.preventDefault();
                if (!nombreFinca.trim()) {
                  feedback.setFieldError('nombre-finca', 'Escribe el nombre de tu finca.');
                  return;
                }
                feedback.clearFormError();
                setPaso(3);
              }}
            >
              <FormField
                {...feedback.field('nombre-finca')}
                htmlFor="nombre-finca"
                label="Nombre de la finca"
                labelClassName="font-medium text-foreground"
              >
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  data-required-message="Escribe el nombre de tu finca."
                  id="nombre-finca"
                  name="farmName"
                  onChange={(event) => setNombreFinca(event.target.value)}
                  placeholder="Ej.: Finca El Roble…"
                  required
                  value={nombreFinca}
                />
              </FormField>
              <FormField
                {...feedback.field('ubicacion-finca')}
                htmlFor="ubicacion-finca"
                label="¿Dónde queda? (opcional)"
                labelClassName="font-medium text-foreground"
              >
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  id="ubicacion-finca"
                  name="farmLocation"
                  onChange={(event) => setUbicacion(event.target.value)}
                  placeholder="Ej.: Vereda El Roble…"
                  value={ubicacion}
                />
              </FormField>
              <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />
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
              {...feedback.formProps}
              onSubmit={(event) => {
                event.preventDefault();
                const nombre = nombreActividad.trim();
                if (nombre && nombre.length < 2) {
                  feedback.setFieldError(
                    'nombre-actividad',
                    'Escribe al menos 2 caracteres o usa la predeterminada.',
                  );
                  return;
                }
                feedback.clearFormError();
                setPaso(5);
              }}
            >
              <FormField
                {...feedback.field('nombre-actividad')}
                htmlFor="nombre-actividad"
                label="¿Cómo se llama la labor?"
                labelClassName="font-medium text-foreground"
              >
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
              </FormField>

              <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />

              <WizardActions>
                <Button
                  className={btnAtras}
                  disabled={guardando || Boolean(loteCreado)}
                  onClick={() => {
                    feedback.reset();
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
                    feedback.reset();
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
              {...feedback.formProps}
              onSubmit={(event) => guardarConfiguracion(event)}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  {...feedback.field('nombre-trabajador')}
                  htmlFor="nombre-trabajador"
                  label="Nombre"
                  labelClassName="font-medium text-foreground"
                >
                  <Input
                    autoComplete="off"
                    className="h-12 rounded-xl px-4"
                    disabled={Boolean(trabajadorCreado)}
                    data-required-message="Escribe el nombre del trabajador, o toca Omitir por ahora."
                    id="nombre-trabajador"
                    maxLength={150}
                    minLength={2}
                    name="first_name"
                    onChange={(event) => setNombreTrabajador(event.target.value)}
                    placeholder="Ej.: María…"
                    required
                    value={nombreTrabajador}
                  />
                </FormField>
                <FormField
                  {...feedback.field('apellido-trabajador')}
                  htmlFor="apellido-trabajador"
                  label="Apellido"
                  labelClassName="font-medium text-foreground"
                >
                  <Input
                    autoComplete="off"
                    className="h-12 rounded-xl px-4"
                    disabled={Boolean(trabajadorCreado)}
                    data-required-message="Escribe el apellido del trabajador."
                    id="apellido-trabajador"
                    maxLength={150}
                    minLength={2}
                    name="last_name"
                    onChange={(event) => setApellidoTrabajador(event.target.value)}
                    placeholder="Ej.: Gómez…"
                    required
                    value={apellidoTrabajador}
                  />
                </FormField>
              </div>
              <FormField
                {...feedback.field('cedula-trabajador')}
                htmlFor="cedula-trabajador"
                label="Cédula (opcional)"
                labelClassName="font-medium text-foreground"
              >
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
              </FormField>

              <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />

              <WizardActions>
                <Button
                  className={btnAtras}
                  disabled={guardando || Boolean(actividadCreada)}
                  onClick={() => {
                    feedback.reset();
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
              {...feedback.formProps}
              onSubmit={(event) => {
                event.preventDefault();
                if (!nombreLote.trim()) {
                  feedback.setFieldError('nombre-lote', 'Escribe el nombre de tu lote.');
                  return;
                }
                feedback.clearFormError();
                setPaso(4);
              }}
            >
              <FormField
                {...feedback.field('nombre-lote')}
                htmlFor="nombre-lote"
                label="Nombre del lote"
                labelClassName="font-medium text-foreground"
              >
                <Input
                  autoComplete="off"
                  className="h-12 rounded-xl px-4"
                  data-required-message="Escribe el nombre de tu lote."
                  id="nombre-lote"
                  name="lotName"
                  onChange={(event) => setNombreLote(event.target.value)}
                  placeholder="Ej.: Lote El Mirador…"
                  required
                  value={nombreLote}
                />
              </FormField>
              <FormField
                {...feedback.field('variedad-lote')}
                htmlFor="variedad-lote"
                label="¿Qué variedad?"
                labelClassName="font-medium text-foreground"
              >
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
              </FormField>
              <FormField
                {...feedback.field('hectareas-lote')}
                htmlFor="hectareas-lote"
                label="Área (hectáreas, opcional)"
                labelClassName="font-medium text-foreground"
              >
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
              </FormField>
              <FormField
                {...feedback.field('plantas-lote')}
                htmlFor="plantas-lote"
                label="¿Cuántas plantas? (opcional)"
                labelClassName="font-medium text-foreground"
              >
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
              </FormField>

              <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />

              <WizardActions>
                <Button
                  className={btnAtras}
                  disabled={guardando || Boolean(fincaCreada)}
                  onClick={() => {
                    feedback.reset();
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
