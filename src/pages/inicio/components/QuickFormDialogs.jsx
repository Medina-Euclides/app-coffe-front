// Formularios que se abren sobre Inicio. Se cargan solo cuando se abren, para que
// Inicio cargue rápido; el de movimientos se precarga al pasar o enfocar su botón.
import { lazy, Suspense } from 'react';
import { cargarFormularioMovimiento, tipoMovimiento } from '../quickForms.js';

const MovementFormDialog = lazy(cargarFormularioMovimiento);
const HarvestRecordFormDialog = lazy(() =>
  import('#pages/workday/components/HarvestRecordFormDialog.jsx'),
);
const WorkdayFormDialog = lazy(() => import('#pages/workday/components/WorkdayFormDialog.jsx'));
const WorkerFormDialog = lazy(() => import('#pages/trabajadores/components/WorkerFormDialog.jsx'));

export default function QuickFormDialogs({ forms }) {
  const { formulario, cerrar, fincas, fincaActiva, jornadasExistentes } = forms;
  return (
    <Suspense fallback={null}>
      {formulario === 'pesaje' && (
        <HarvestRecordFormDialog onOpenChange={cerrar} onSave={forms.guardarPesaje} open />
      )}
      {formulario === 'jornada' && (
        <WorkdayFormDialog
          existingWorkdays={jornadasExistentes}
          onOpenChange={cerrar}
          onSave={forms.guardarJornada}
          open
        />
      )}
      {tipoMovimiento[formulario] && fincas !== null && (
        <MovementFormDialog
          farms={fincas}
          key={formulario}
          onOpenChange={cerrar}
          onSave={forms.guardarMovimiento}
          open
          selectedFarmId={fincaActiva}
          type={tipoMovimiento[formulario]}
        />
      )}
      {formulario === 'trabajador' && (
        <WorkerFormDialog onOpenChange={cerrar} onSave={forms.guardarTrabajador} open />
      )}
    </Suspense>
  );
}
