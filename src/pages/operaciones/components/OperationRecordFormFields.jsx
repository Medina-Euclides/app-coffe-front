import { Plus, X } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';

export const operationInputClassName =
  'h-11 rounded-xl border-[#dfe5dc] bg-white px-3 text-sm text-[#294533] focus-visible:border-[#5b805e] focus-visible:ring-[#5b805e]/20';

export function OperationField({ children, label, htmlFor }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#354b3a]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function OperationSelect({ children, id, onChange, value, disabled }) {
  return (
    <select
      className={`${operationInputClassName} w-full`}
      disabled={disabled}
      id={id}
      onChange={(event) => onChange(event.target.value)}
      required
      value={value}
    >
      {children}
    </select>
  );
}

export function HarvestFields({
  activities,
  activity,
  isEditing,
  mode,
  onAddWorker,
  onRemoveWorker,
  onSetActivity,
  onSetMode,
  onUpdateWorker,
  workers,
  workerRows,
}) {
  return (
    <>
      <OperationField htmlFor="harvest-activity" label="Actividad de recolección">
        <OperationSelect
          disabled={isEditing}
          id="harvest-activity"
          onChange={onSetActivity}
          value={activity}
        >
          <option disabled value="">
            Selecciona una actividad
          </option>
          {activities.map((harvestActivity) => (
            <option key={harvestActivity.id} value={harvestActivity.id}>
              {harvestActivity.name}
            </option>
          ))}
        </OperationSelect>
      </OperationField>

      <section aria-labelledby="participantes-heading" className="space-y-3">
        {!isEditing && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[#354b3a]">
              Modalidad de registro
            </legend>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f3f5ef] p-1">
              {[
                { label: 'Individual', value: 'individual' },
                { label: 'Consecutivo', value: 'consecutivo' },
              ].map((option) => (
                <button
                  aria-pressed={mode === option.value}
                  className={`min-h-10 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48] ${
                    mode === option.value
                      ? 'bg-white text-[#214b32] shadow-sm'
                      : 'text-[#68766b] hover:text-[#214b32]'
                  }`}
                  key={option.value}
                  onClick={() => onSetMode(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {mode === 'consecutivo' && (
              <p className="text-xs leading-5 text-[#748074]">
                Agrega a todos los participantes de esta fecha y este lote sin
                cerrar el formulario.
              </p>
            )}
          </fieldset>
        )}

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3
              className="text-sm font-semibold text-[#354b3a]"
              id="participantes-heading"
            >
              {mode === 'consecutivo'
                ? 'Trabajadores participantes'
                : 'Trabajador'}
            </h3>
            <p className="mt-1 text-xs text-[#748074]">
              Registra la cantidad individual en kilogramos.
            </p>
          </div>
          {mode === 'consecutivo' && !isEditing && (
            <Button
              className="h-9 rounded-lg border-[#cddbc9] px-3 text-[#315d3b] hover:bg-[#f0f5ed]"
              onClick={onAddWorker}
              type="button"
              variant="outline"
            >
              <Plus aria-hidden="true" />
              Agregar trabajador
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {workerRows.map((row, index) => (
            <div
              className="grid gap-3 rounded-xl border border-[#e5e9e1] bg-[#fbfcf9] p-3 sm:grid-cols-2 sm:items-end"
              key={`worker-row-${index}`}
            >
              <OperationField
                htmlFor={`harvest-worker-${index}`}
                label={`Trabajador${workerRows.length > 1 ? ` ${index + 1}` : ''}`}
              >
                <OperationSelect
                  disabled={isEditing}
                  id={`harvest-worker-${index}`}
                  onChange={(value) => onUpdateWorker(index, 'worker', value)}
                  value={row.worker}
                >
                  <option disabled value="">
                    Selecciona un trabajador
                  </option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.nombre}
                    </option>
                  ))}
                </OperationSelect>
              </OperationField>
              <OperationField
                htmlFor={`harvest-amount-${index}`}
                label="Cantidad (kg)"
              >
                <Input
                  className={operationInputClassName}
                  id={`harvest-amount-${index}`}
                  min="0.001"
                  onChange={(event) =>
                    onUpdateWorker(index, 'amount', event.target.value)
                  }
                  placeholder="Ej. 25"
                  required
                  step="0.001"
                  type="number"
                  value={row.amount}
                />
              </OperationField>
              <OperationField
                htmlFor={`harvest-time-${index}`}
                label="Hora del pesaje"
              >
                <Input
                  className={operationInputClassName}
                  id={`harvest-time-${index}`}
                  onChange={(event) =>
                    onUpdateWorker(index, 'time', event.target.value)
                  }
                  required
                  type="time"
                  value={row.time}
                />
              </OperationField>
              <OperationField
                htmlFor={`harvest-rate-${index}`}
                label="Tarifa acordada ($/kg)"
              >
                <Input
                  className={operationInputClassName}
                  disabled={isEditing}
                  id={`harvest-rate-${index}`}
                  min="0.01"
                  onChange={(event) =>
                    onUpdateWorker(index, 'agreedRate', event.target.value)
                  }
                  required
                  step="0.01"
                  type="number"
                  value={row.agreedRate}
                />
              </OperationField>
              {workerRows.length > 1 && !isEditing ? (
                <Button
                  aria-label={`Quitar trabajador ${index + 1}`}
                  className="size-11 rounded-xl text-[#68766b] hover:bg-[#f2e9e6] hover:text-[#8c4135]"
                  onClick={() => onRemoveWorker(index)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" />
                </Button>
              ) : (
                <span className="hidden size-11 sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>
      <p className="rounded-xl border border-[#dce8d9] bg-[#f0f5ed] p-3 text-sm leading-5 text-[#426548]">
        El pesaje se registra en kilogramos y queda asociado a la jornada,
        actividad y lote seleccionados.
      </p>
      {isEditing && (
        <p className="text-xs leading-5 text-[#748074]">
          La fecha, el trabajador, el lote y la tarifa pertenecen a la jornada
          asociada y no se modifican desde la edición del pesaje.
        </p>
      )}
    </>
  );
}

export function WorkdayFields({
  activities,
  activity,
  isEditing,
  onSetActivity,
  onUpdateWorker,
  workerRows,
  workers,
}) {
  return (
    <>
      <OperationField htmlFor="workday-worker" label="Trabajador">
        <OperationSelect
          disabled={isEditing}
          id="workday-worker"
          onChange={(value) => onUpdateWorker(0, 'worker', value)}
          value={workerRows[0].worker}
        >
          <option disabled value="">
            Selecciona un trabajador
          </option>
          {workers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.nombre}
            </option>
          ))}
        </OperationSelect>
      </OperationField>
      <OperationField htmlFor="workday-rate" label="Jornal acordado ($/día)">
        <Input
          className={operationInputClassName}
          disabled={isEditing}
          id="workday-rate"
          min="0.01"
          onChange={(event) =>
            onUpdateWorker(0, 'agreedRate', event.target.value)
          }
          required
          step="0.01"
          type="number"
          value={workerRows[0].agreedRate}
        />
      </OperationField>
      <OperationField htmlFor="workday-activity" label="Actividad laboral">
        <OperationSelect
          id="workday-activity"
          onChange={onSetActivity}
          value={activity}
        >
          <option disabled value="">
            Selecciona una actividad
          </option>
          {activities.map((workActivity) => (
            <option key={workActivity.id} value={workActivity.id}>
              {workActivity.name}
            </option>
          ))}
        </OperationSelect>
      </OperationField>
      <p className="rounded-xl border border-[#dce8d9] bg-[#f0f5ed] p-3 text-sm leading-5 text-[#426548]">
        La jornada se registra con modalidad por jornal. El trabajador y la
        tarifa acordada quedan asociados a la fecha; la actividad y el lote se
        guardan en el detalle.
      </p>
    </>
  );
}
