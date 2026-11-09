// Encabezado del asistente: marca, barra de progreso (desde el paso 2) y el título
// y la explicación del paso actual.
import { CardDescription, CardHeader } from '#components/ui/card';

const etapas = ['Finca', 'Lote', 'Actividad', 'Trabajador'];

const textos = {
  1: {
    titulo: '¡Bienvenido a CafeSmart!',
    descripcion: (nombre) =>
      `Te damos la bienvenida, ${nombre}. Configuremos los datos básicos para empezar.`,
  },
  2: {
    titulo: 'Agrega tu finca',
    descripcion: () => 'Registra la finca principal donde administras tu producción.',
  },
  3: {
    titulo: 'Crea tu primer lote',
    descripcion: () => 'Los lotes te ayudan a organizar variedades y áreas de cultivo.',
  },
  4: {
    titulo: 'Agrega una actividad',
    descripcion: () =>
      'Crea una actividad de recolección para registrar los pesajes. Si omites este paso, agregaremos “Recolección de café” por ti.',
  },
  5: {
    titulo: 'Registra tu primer trabajador',
    descripcion: () =>
      'Con una persona registrada ya puedes abrir tu primera jornada del día. Podrás agregar más trabajadores cuando quieras.',
  },
};

function WizardProgress({ paso }) {
  const actual = paso - 1;
  return (
    <div
      aria-label="Progreso de configuración inicial"
      aria-valuemax={etapas.length}
      aria-valuemin={1}
      aria-valuenow={actual}
      aria-valuetext={`${etapas[actual - 1]}, paso ${actual} de ${etapas.length}`}
      className="space-y-2"
      role="progressbar"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{etapas[actual - 1]}</span>
        <span className="tabular-nums">
          {actual} de {etapas.length}
        </span>
      </div>
      <ol aria-hidden="true" className="grid grid-cols-4 gap-1.5">
        {etapas.map((etapa, indice) => (
          <li
            className={`h-2 rounded-full transition-colors motion-reduce:transition-none ${
              indice < actual ? 'bg-primary' : 'bg-secondary'
            }`}
            key={etapa}
          />
        ))}
      </ol>
    </div>
  );
}

export default function WizardHeader({ paso, nombreProductor }) {
  const texto = textos[paso];
  return (
    <CardHeader className="gap-5 px-6 pt-8 sm:px-9 sm:pt-10">
      <div className="flex items-center gap-4">
        <img alt="Logo de CafeSmart" className="size-12 rounded-2xl" height={48} src="/icon.png" width={48} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary" translate="no">
            CafeSmart
          </p>
          <p className="text-xs text-muted-foreground">Configuración inicial</p>
        </div>
      </div>

      {paso > 1 && <WizardProgress paso={paso} />}

      <div className="space-y-2">
        <h1 className="text-4xl text-foreground sm:text-5xl">{texto.titulo}</h1>
        <CardDescription className="break-words text-pretty leading-relaxed text-muted-foreground">
          {texto.descripcion(nombreProductor)}
        </CardDescription>
      </div>
    </CardHeader>
  );
}
