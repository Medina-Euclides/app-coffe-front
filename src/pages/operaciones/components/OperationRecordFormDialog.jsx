import { useState } from 'react';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import { hoy } from '#lib/formatters';
import {
  HarvestFields,
  OperationField,
  OperationSelect,
  operationInputClassName,
  WorkdayFields,
} from './OperationRecordFormFields.jsx';
import { currentOperationTime } from '../operationsData.js';

export default function OperationRecordFormDialog({
  activities = [],
  defaultAgreedRate,
  lots = [],
  onClose,
  onSave,
  onSaved,
  record,
  section,
  workers = [],
}) {
  const isHarvest = section === 'recoleccion';
  const [mode, setMode] = useState('individual');
  const [date, setDate] = useState(() => record?.fecha || hoy());
  const [lot, setLot] = useState(record?.loteId || record?.lote || '');
  const [workerRows, setWorkerRows] = useState([
    {
      worker: record?.trabajadorId || '',
      amount: record?.kilogramos || '',
      time: record?.hora || currentOperationTime(),
      agreedRate: record?.tarifaAcordada || defaultAgreedRate,
    },
  ]);
  const [activity, setActivity] = useState(
    record?.activityTypeId || record?.actividad || '',
  );
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(record);

  const updateWorkerRow = (index, key, value) => {
    setWorkerRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const addWorkerRow = () => {
    setWorkerRows((rows) => [
      ...rows,
      {
        worker: '',
        amount: '',
        time: currentOperationTime(),
        agreedRate: defaultAgreedRate,
      },
    ]);
  };

  const removeWorkerRow = (index) => {
    setWorkerRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'individual') {
      setWorkerRows((rows) => [rows[0] || { worker: '', amount: '' }]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    if (!workers.length || !lots.length || !activities.length) {
      setNotice(
        'Para registrar una operación necesitas trabajadores y lotes activos, además de actividades laborales configuradas.',
      );
      return;
    }

    if (
      workerRows.length > 1 &&
      new Set(workerRows.map((row) => row.worker)).size !== workerRows.length
    ) {
      setNotice('No puedes registrar al mismo trabajador dos veces en una fecha.');
      return;
    }

    setSaving(true);
    let savedCount = 0;
    try {
      for (const row of workerRows) {
        await onSave(record, { date, lot, activity, row });
        savedCount += 1;
      }
      await onSaved();
      onClose();
    } catch (saveError) {
      if (savedCount > 0) {
        setWorkerRows((rows) => rows.slice(savedCount));
        await onSaved();
        setNotice(
          `Se guardaron ${savedCount} registro(s). Los demás no se guardaron: ${saveError.message}`,
        );
      } else {
        setNotice(
          saveError.message ||
            `No se pudo guardar ${isHarvest ? 'la recolección' : 'la jornada laboral'}.`,
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent className="max-h-[min(92dvh,52rem)] overflow-y-auto overscroll-contain rounded-2xl p-5 sm:max-w-2xl sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            {isEditing
              ? `Editar ${isHarvest ? 'recolección' : 'jornada'}`
              : `Registrar ${isHarvest ? 'recolección' : 'jornada laboral'}`}
          </DialogTitle>
          <DialogDescription>
            {isHarvest
              ? 'Indica fecha, lote, actividad, pesaje, hora y tarifa acordada por trabajador.'
              : 'Registra trabajador, fecha, actividad, lote y tarifa diaria acordada.'}
          </DialogDescription>
        </DialogHeader>

        {(!workers.length || !lots.length || !activities.length) && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {isHarvest
              ? 'Para registrar recolección necesitas trabajadores y lotes activos, además de al menos una actividad marcada como recolección.'
              : 'Para registrar jornadas necesitas trabajadores y lotes activos, además de actividades laborales configuradas.'}
          </p>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <OperationField htmlFor="operation-date" label="Fecha">
              <Input
                className={operationInputClassName}
                disabled={isEditing}
                id="operation-date"
                onChange={(event) => setDate(event.target.value)}
                required
                type="date"
                value={date}
              />
            </OperationField>
            <OperationField htmlFor="operation-lot" label="Lote">
              <OperationSelect
                disabled={isHarvest && isEditing}
                id="operation-lot"
                onChange={setLot}
                value={lot}
              >
                <option disabled value="">
                  Selecciona un lote
                </option>
                {lots.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.nombre}
                  </option>
                ))}
              </OperationSelect>
            </OperationField>
          </div>

          {isHarvest ? (
            <HarvestFields
              activities={activities}
              activity={activity}
              isEditing={isEditing}
              mode={mode}
              onAddWorker={addWorkerRow}
              onRemoveWorker={removeWorkerRow}
              onSetActivity={setActivity}
              onSetMode={selectMode}
              onUpdateWorker={updateWorkerRow}
              workers={workers}
              workerRows={workerRows}
            />
          ) : (
            <WorkdayFields
              activities={activities}
              activity={activity}
              isEditing={isEditing}
              onSetActivity={setActivity}
              onUpdateWorker={updateWorkerRow}
              workerRows={workerRows}
              workers={workers}
            />
          )}

          {notice && (
            <p
              aria-live="polite"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {notice}
            </p>
          )}

          <DialogFooter className="flex-col-reverse gap-2 border-0 bg-transparent p-0 sm:flex-row">
            <Button
              className="h-11 rounded-xl border-[#dfe5dc] px-4 text-[#526254] hover:bg-[#f4f6f1]"
              disabled={saving}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="h-11 rounded-xl bg-[#214b32] px-5 text-white hover:bg-[#173d2b]"
              disabled={saving}
              type="submit"
            >
              {saving
                ? 'Guardando…'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Guardar registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
