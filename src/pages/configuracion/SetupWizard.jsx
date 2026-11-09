// Asistente de configuración inicial: crea finca, lote, actividad y primer trabajador.
import { Card } from '#components/ui/card';
import MaduracionStripe from '#components/shared/MaduracionStripe';
import { getFullName } from '#lib/formatters';
import WizardHeader from './components/WizardHeader.jsx';
import {
  StepActivity,
  StepFarm,
  StepLot,
  StepWelcome,
  StepWorker,
} from './components/WizardSteps.jsx';
import { useSetupWizard } from './hooks/useSetupWizard.js';

const pasos = {
  1: StepWelcome,
  2: StepFarm,
  3: StepLot,
  4: StepActivity,
  5: StepWorker,
};

export function SetupWizard({ usuario, onComplete }) {
  const wizard = useSetupWizard({ usuario, onComplete });
  const Paso = pasos[wizard.paso];

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl gap-0 overflow-hidden rounded-2xl border border-border bg-card py-0 shadow-[0_24px_48px_-32px_rgb(21_40_30/0.35)]">
        <MaduracionStripe />
        <WizardHeader nombreProductor={getFullName(usuario, 'Productor')} paso={wizard.paso} />
        <Paso wizard={wizard} />
      </Card>
    </main>
  );
}
