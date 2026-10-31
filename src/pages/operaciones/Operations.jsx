import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ClipboardList,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Sprout,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import EmptyState from '#components/shared/EmptyState';
import ManagementPage from '#components/shared/ManagementPage';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { hoy } from '#lib/formatters';
import { api } from '#services/api';

const inputClassName =
  'h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#294533] outline-none transition focus-visible:border-[#5b805e] focus-visible:ring-3 focus-visible:ring-[#5b805e]/20';

function horaActual() {
  return new Date().toTimeString().slice(0, 5);
}

function mapHarvestRecords(workdays) {
  return workdays.flatMap((workday) =>
    (workday.details || []).flatMap((detail) =>
      (detail.harvest_records || []).map((harvest) => ({
        id: harvest.id,
        workdayId: workday.id,
        workdayDetailId: detail.id,
        trabajadorId: workday.worker,
        trabajador: workday.worker_name,
        fecha: workday.date,
        modalidadPago: workday.payment_mode,
        tarifaAcordada: workday.agreed_rate,
        activityTypeId: detail.activity_type,
        actividad: detail.activity_name,
        loteId: detail.lot,
        lote: detail.lot_name,
        finca: detail.farm_name,
        kilogramos: String(harvest.quantity_kg),
        hora: harvest.time,
      })),
    ),
  );
}

function mapWorkdayDetails(workdays) {
  return workdays
    .filter((workday) => workday.payment_mode === 'jornal')
    .flatMap((workday) =>
      (workday.details || []).map((detail) => ({
        id: detail.id,
        workdayId: workday.id,
        workdayDetailId: detail.id,
        trabajadorId: workday.worker,
        trabajador: workday.worker_name,
        fecha: workday.date,
        modalidadPago: workday.payment_mode,
        tarifaAcordada: workday.agreed_rate,
        estadoLiquidacion: workday.settlement_status,
        activityTypeId: detail.activity_type,
        actividad: detail.activity_name,
        loteId: detail.lot,
        lote: detail.lot_name,
        finca: detail.farm_name,
      })),
    );
}

function Field({ children, label, htmlFor }) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-sm font-medium text-[#354b3a]"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function OperationsTabs({ section }) {
  const tabs = [
    { label: 'Recolección', to: '/operaciones/recoleccion', id: 'recoleccion' },
    { label: 'Jornadas laborales', to: '/operaciones/jornadas', id: 'jornadas' },
  ];

  return (
    <nav
      aria-label="Secciones de operaciones"
      className="flex w-full gap-1 overflow-x-auto rounded-xl border border-[#e2e8dd] bg-white p-1 sm:w-fit"
    >
      {tabs.map((tab) => (
        <NavLink
          aria-current={section === tab.id ? 'page' : undefined}
          className={`min-h-10 shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48] ${
            section === tab.id
              ? 'bg-[#e7f0e3] text-[#214b32]'
              : 'text-[#68766b] hover:bg-[#f4f6f1] hover:text-[#214b32]'
          }`}
          key={tab.id}
          to={tab.to}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

function RecordCard({ onEdit, onView, record, section }) {
  const isHarvest = section === 'recoleccion';
  const Icon = isHarvest ? Sprout : ClipboardList;

  return (
    <article className="rounded-2xl border border-[#e5e9e1] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            isHarvest
              ? 'bg-[#e8f2e5] text-[#397248]'
              : 'bg-[#e9f1f3] text-[#426976]'
          }`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words font-semibold text-[#233b2b]">
              {record.trabajador}
            </h2>
            {isHarvest && (
              <span className="rounded-full bg-[#edf5e9] px-2.5 py-1 text-xs font-semibold text-[#426b48]">
                Recolección
              </span>
            )}
          </div>
          <p className="mt-1 break-words text-sm text-[#68766b]">
            {isHarvest ? 'Café recolectado' : record.actividad}
          </p>
          {!isHarvest && (
            <p className="mt-1 text-xs font-medium text-[#748074]">
              Jornal: ${Number(record.tarifaAcordada).toLocaleString('es-CO')}
            </p>
          )}
        </div>
        {isHarvest && (
          <p className="shrink-0 text-right">
            <span className="block text-xl font-bold tabular-nums text-[#214b32]">
              {record.kilogramos}
            </span>
            <span className="text-xs text-[#748074]">kg</span>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#edf0e9] pt-3 text-sm text-[#68766b]">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" className="size-4 text-[#849184]" />
          {formatearFecha(record.fecha)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="size-4 text-[#849184]" />
          {record.lote}
        </span>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          aria-label={`Ver detalle de ${record.trabajador}`}
          className="h-9 rounded-lg border-[#dfe5dc] px-3 text-[#526254] hover:bg-[#f4f6f1]"
          onClick={() => onView(record)}
          type="button"
          variant="outline"
        >
          <Eye aria-hidden="true" />
          <span>Detalle</span>
        </Button>
        <Button
          aria-label={`Editar registro de ${record.trabajador}`}
          className="h-9 rounded-lg bg-[#214b32] px-3 text-white hover:bg-[#173d2b]"
          onClick={() => onEdit(record)}
          type="button"
        >
          <Pencil aria-hidden="true" />
          <span>Editar</span>
        </Button>
      </div>
    </article>
  );
}

function RecordFormDialog({
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
      time: record?.hora || horaActual(),
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
        time: horaActual(),
        agreedRate: defaultAgreedRate,
      },
    ]);
  };

  const removeWorkerRow = (index) => {
    setWorkerRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
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
          {isHarvest && !isEditing && (
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
                    onClick={() => {
                      setMode(option.value);
                      if (option.value === 'individual') {
                        setWorkerRows((rows) => [rows[0] || { worker: '', amount: '' }]);
                      }
                    }}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="operation-date" label="Fecha">
              <input
                className={inputClassName}
                id="operation-date"
                disabled={isEditing}
                onChange={(event) => setDate(event.target.value)}
                required
                type="date"
                value={date}
              />
            </Field>
            <Field htmlFor="operation-lot" label="Lote">
              <select
                className={inputClassName}
                disabled={isHarvest && isEditing}
                id="operation-lot"
                onChange={(event) => setLot(event.target.value)}
                required
                value={lot}
              >
                <option disabled value="">
                  Selecciona un lote
                </option>
                {lots.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                  >
                    {option.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {isHarvest ? (
            <>
              <Field htmlFor="harvest-activity" label="Actividad de recolección">
                <select
                  className={inputClassName}
                  disabled={isEditing}
                  id="harvest-activity"
                  onChange={(event) => setActivity(event.target.value)}
                  required
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
                </select>
              </Field>

              <section aria-labelledby="participantes-heading" className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3
                    className="text-sm font-semibold text-[#354b3a]"
                    id="participantes-heading"
                  >
                    {mode === 'consecutivo' ? 'Trabajadores participantes' : 'Trabajador'}
                  </h3>
                  <p className="mt-1 text-xs text-[#748074]">
                    Registra la cantidad individual en kilogramos.
                  </p>
                </div>
                {mode === 'consecutivo' && (
                  <Button
                    className="h-9 rounded-lg border-[#cddbc9] px-3 text-[#315d3b] hover:bg-[#f0f5ed]"
                    onClick={addWorkerRow}
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
                    <Field
                      htmlFor={`harvest-worker-${index}`}
                      label={`Trabajador${workerRows.length > 1 ? ` ${index + 1}` : ''}`}
                    >
                      <select
                        className={inputClassName}
                        disabled={isEditing}
                        id={`harvest-worker-${index}`}
                        onChange={(event) =>
                          updateWorkerRow(index, 'worker', event.target.value)
                        }
                        required
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
                      </select>
                    </Field>
                    <Field htmlFor={`harvest-amount-${index}`} label="Cantidad (kg)">
                      <input
                        className={inputClassName}
                        id={`harvest-amount-${index}`}
                        min="0.001"
                        onChange={(event) =>
                          updateWorkerRow(index, 'amount', event.target.value)
                        }
                        placeholder="Ej. 25"
                        required
                        step="0.001"
                        type="number"
                        value={row.amount}
                      />
                    </Field>
                    <Field htmlFor={`harvest-time-${index}`} label="Hora del pesaje">
                      <input
                        className={inputClassName}
                        id={`harvest-time-${index}`}
                        onChange={(event) =>
                          updateWorkerRow(index, 'time', event.target.value)
                        }
                        required
                        type="time"
                        value={row.time}
                      />
                    </Field>
                    <Field
                      htmlFor={`harvest-rate-${index}`}
                      label="Tarifa acordada ($/kg)"
                    >
                      <input
                        className={inputClassName}
                        disabled={isEditing}
                        id={`harvest-rate-${index}`}
                        min="0.01"
                        onChange={(event) =>
                          updateWorkerRow(index, 'agreedRate', event.target.value)
                        }
                        required
                        step="0.01"
                        type="number"
                        value={row.agreedRate}
                      />
                    </Field>
                    {workerRows.length > 1 ? (
                      <Button
                        aria-label={`Quitar trabajador ${index + 1}`}
                        className="size-11 rounded-xl text-[#68766b] hover:bg-[#f2e9e6] hover:text-[#8c4135]"
                        onClick={() => removeWorkerRow(index)}
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
                  La fecha, el trabajador, el lote y la tarifa pertenecen a la
                  jornada asociada y no se modifican desde la edición del pesaje.
                </p>
              )}
            </>
          ) : (
            <>
              <Field htmlFor="workday-worker" label="Trabajador">
                <select
                  className={inputClassName}
                  disabled={isEditing}
                  id="workday-worker"
                  onChange={(event) =>
                    updateWorkerRow(0, 'worker', event.target.value)
                  }
                  required
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
                </select>
              </Field>
              <Field htmlFor="workday-rate" label="Jornal acordado ($/día)">
                <input
                  className={inputClassName}
                  disabled={isEditing}
                  id="workday-rate"
                  min="0.01"
                  onChange={(event) =>
                    updateWorkerRow(0, 'agreedRate', event.target.value)
                  }
                  required
                  step="0.01"
                  type="number"
                  value={workerRows[0].agreedRate}
                />
              </Field>
              <Field htmlFor="workday-activity" label="Actividad laboral">
                <select
                  className={inputClassName}
                  id="workday-activity"
                  onChange={(event) => setActivity(event.target.value)}
                  required
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
                </select>
              </Field>
              <p className="rounded-xl border border-[#dce8d9] bg-[#f0f5ed] p-3 text-sm leading-5 text-[#426548]">
                La jornada se registra con modalidad por jornal. El trabajador
                y la tarifa acordada quedan asociados a la fecha; la actividad y
                el lote se guardan en el detalle.
              </p>
            </>
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

function RecordDetailsDialog({ onClose, record, section }) {
  const isHarvest = section === 'recoleccion';

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open>
      <DialogContent className="rounded-2xl p-5 sm:max-w-md sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-[#183d2b]">
            Detalle de {isHarvest ? 'recolección' : 'jornada'}
          </DialogTitle>
          <DialogDescription>
            Información del registro de {record.trabajador}.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-4 rounded-xl bg-[#f7f8f3] p-4">
          <DetailItem icon={UserRound} label="Trabajador" value={record.trabajador} />
          <DetailItem icon={CalendarDays} label="Fecha" value={formatearFecha(record.fecha)} />
          <DetailItem icon={MapPin} label="Lote" value={record.lote} />
          {isHarvest ? (
            <>
              <DetailItem
                icon={Sprout}
                label="Actividad"
                value={record.actividad}
              />
              <DetailItem
                icon={Sprout}
                label="Cantidad recolectada"
                value={`${record.kilogramos} kg`}
              />
              <DetailItem
                icon={CalendarDays}
                label="Hora del pesaje"
                value={record.hora}
              />
              <DetailItem
                icon={ClipboardList}
                label="Tarifa acordada"
                value={`$${Number(record.tarifaAcordada).toLocaleString('es-CO')}/kg`}
              />
            </>
          ) : (
            <>
              <DetailItem
                icon={ClipboardList}
                label="Actividad"
                value={record.actividad}
              />
              <DetailItem
                icon={ClipboardList}
                label="Pago acordado"
                value={`$${Number(record.tarifaAcordada).toLocaleString('es-CO')} por jornal`}
              />
              <DetailItem
                icon={CalendarDays}
                label="Estado de liquidación"
                value={record.estadoLiquidacion === 'liquidada' ? 'Liquidada' : 'Pendiente'}
              />
            </>
          )}
        </dl>
        <DialogFooter>
          <Button
            className="h-10 rounded-xl bg-[#214b32] px-4 text-white hover:bg-[#173d2b]"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#65806a]" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-[#748074]">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm font-medium text-[#294533]">
          {value}
        </dd>
      </div>
    </div>
  );
}

function formatearFecha(date) {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export default function Operations({ usuario }) {
  const { pathname } = useLocation();
  const section = pathname.endsWith('/jornadas') ? 'jornadas' : 'recoleccion';
  const isHarvest = section === 'recoleccion';
  const userId = usuario?.id || 'default';
  const [harvestRecords, setHarvestRecords] = useState([]);
  const [workdays, setWorkdays] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [lots, setLots] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadState, setLoadState] = useState({ userId: null, loading: true });
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [lotFilter, setLotFilter] = useState('');
  const [dialog, setDialog] = useState(null);
  const loading = loadState.userId !== userId || loadState.loading;
  const hasLoadError = Boolean(loadError);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.workdays.list(),
      api.workers.list(),
      api.lots.list(),
      api.activities.list(),
    ])
      .then(([loadedWorkdays, loadedWorkers, loadedLots, loadedActivities]) => {
        if (!active) return;
        setLoadError('');
        setWorkdays(loadedWorkdays);
        setHarvestRecords(mapHarvestRecords(loadedWorkdays));
        setWorkers(loadedWorkers.filter((worker) => worker.is_active));
        setLots(loadedLots.filter((lot) => lot.is_active));
        setActivities(
          isHarvest
            ? loadedActivities.filter((activity) => activity.is_harvest)
            : loadedActivities,
        );
      })
      .catch((error) => {
        if (!active) return;
        console.error('Error al cargar datos de operaciones:', error);
        setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoadState({ userId, loading: false });
      });

    return () => {
      active = false;
    };
  }, [isHarvest, userId]);

  const refreshWorkdays = async () => {
    try {
      const loadedWorkdays = await api.workdays.list();
      setWorkdays(loadedWorkdays);
      setHarvestRecords(mapHarvestRecords(loadedWorkdays));
      setLoadError('');
    } catch (error) {
      console.error('Error al actualizar las jornadas laborales:', error);
      setLoadError(error.message);
    }
  };

  const saveOperation = async (record, { activity, date, lot, row }) => {
    if (record && record.modalidadPago === 'jornal') {
      await api.workdayDetails.update(record.workdayDetailId, {
        activity_type: activity,
        lot,
      });
      return;
    }
    if (record) {
      await api.harvestRecords.update(record.id, {
        quantity_kg: row.amount,
        time: row.time,
      });
      return;
    }

    const existingWorkday = workdays.find(
      (workday) =>
        String(workday.worker) === String(row.worker) && workday.date === date,
    );
    let workday = existingWorkday;
    let createdWorkday = false;
    let detail;

    if (existingWorkday) {
      const expectedPaymentMode = isHarvest ? 'kg' : 'jornal';
      if (existingWorkday.payment_mode !== expectedPaymentMode) {
        throw new Error(
          `Ya existe una jornada para este trabajador y fecha con modalidad ${
            expectedPaymentMode === 'kg' ? 'por jornal' : 'por kilogramo'
          }.`,
        );
      }
      if (Number(existingWorkday.agreed_rate) !== Number(row.agreedRate)) {
        throw new Error(
          'La tarifa debe coincidir con la acordada en la jornada existente.',
        );
      }
    } else {
      workday = await api.workdays.create({
        worker: row.worker,
        date,
        payment_mode: isHarvest ? 'kg' : 'jornal',
        agreed_rate: row.agreedRate,
      });
      createdWorkday = true;
    }

    try {
      detail = await api.workdayDetails.create({
        workday: workday.id,
        activity_type: activity,
        lot,
      });
      if (isHarvest) {
        await api.harvestRecords.create({
          workday_detail: detail.id,
          quantity_kg: row.amount,
          time: row.time,
        });
      }
    } catch (error) {
      const cleanupErrors = [];
      if (detail?.id) {
        try {
          await api.workdayDetails.delete(detail.id);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError.message);
        }
      }
      if (createdWorkday && workday?.id) {
        try {
          await api.workdays.delete(workday.id);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError.message);
        }
      }
      if (cleanupErrors.length) {
        throw new Error(
          `${error.message} No se pudieron limpiar todos los datos parciales: ${cleanupErrors.join(' ')}`,
          { cause: error },
        );
      }
      throw error;
    }
  };

  const records = isHarvest ? harvestRecords : mapWorkdayDetails(workdays);
  const lotOptions = lots;
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const searchableText = isHarvest
        ? `${record.trabajador} ${record.lote} ${record.finca} ${record.kilogramos}`
        : `${record.trabajador} ${record.lote} ${record.finca} ${record.actividad}`;
      const matchesSearch = searchableText.toLocaleLowerCase().includes(query);
      const matchesLot =
        !lotFilter ||
        record.loteId === lotFilter;
      return matchesSearch && matchesLot;
    });
  }, [isHarvest, lotFilter, records, search]);

  return (
    <>
      <ManagementPage
        actionLabel={`Registrar ${isHarvest ? 'recolección' : 'jornada'}`}
        description={
          isHarvest
            ? 'Registra y consulta el café recolectado por cada trabajador en los diferentes lotes de la finca.'
            : 'Registra y consulta las labores realizadas por los trabajadores, con su actividad, fecha y lote.'
        }
        onAction={() => {
          if (!loading && !hasLoadError) setDialog({ mode: 'create' });
        }}
        onSearchChange={setSearch}
        searchLabel={isHarvest ? 'recolecciones por trabajador o lote' : 'jornadas por trabajador, actividad o lote'}
        searchValue={search}
        title={isHarvest ? 'Recolección' : 'Jornadas laborales'}
      >
        <OperationsTabs section={section} />

        <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e9e1] bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center gap-2 text-sm text-[#68766b]">
            {isHarvest ? (
              <Sprout aria-hidden="true" className="size-4 text-[#56805a]" />
            ) : (
              <ClipboardList aria-hidden="true" className="size-4 text-[#53717c]" />
            )}
            <span>
              <strong className="font-semibold text-[#294533]">
                {filteredRecords.length}
              </strong>{' '}
              {isHarvest ? 'registros de recolección' : 'jornadas'}
            </span>
            <span className="rounded-full bg-[#f3f5ef] px-2 py-1 text-[11px] font-medium text-[#748074]">
              Backend Django
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#68766b]">
            <span className="shrink-0">Filtrar por lote</span>
            <select
              aria-label="Filtrar registros por lote"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[#dfe5dc] bg-white px-3 text-sm text-[#294533] outline-none focus-visible:border-[#5b805e] focus-visible:ring-3 focus-visible:ring-[#5b805e]/20 sm:w-56 sm:flex-none"
              onChange={(event) => setLotFilter(event.target.value)}
              value={lotFilter}
            >
              <option value="">Todos los lotes</option>
              {lotOptions.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && (
          <p aria-live="polite" className="text-sm text-[#68766b]" role="status">
            Cargando trabajadores, lotes y registros…
          </p>
        )}
        {hasLoadError && (
          <p
            aria-live="polite"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            No se pudieron cargar los datos de operaciones: {loadError}
          </p>
        )}

        {!loading && !hasLoadError && filteredRecords.length === 0 ? (
          <EmptyState
            description={
              records.length || hasLoadError
                ? 'Prueba con otro término de búsqueda o selecciona un lote diferente.'
                : 'Cuando registres una operación, aparecerá aquí.'
            }
            title={
              records.length || hasLoadError
                ? 'No encontramos registros'
                : 'Aún no hay registros'
            }
          />
        ) : !loading && !hasLoadError && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRecords.map((record) => (
              <RecordCard
                key={record.id}
                onEdit={(selectedRecord) =>
                  setDialog({ mode: 'edit', record: selectedRecord })
                }
                onView={(selectedRecord) =>
                  setDialog({ mode: 'view', record: selectedRecord })
                }
                record={record}
                section={section}
              />
            ))}
          </div>
        )}

        <p className="flex items-center gap-2 text-xs leading-5 text-[#748074]">
          <UsersRound aria-hidden="true" className="size-4 shrink-0" />
          {isHarvest
            ? 'Cada pesaje queda vinculado a una jornada, su actividad y el lote correspondiente.'
            : 'Las labores se registran dentro de la jornada laboral de cada trabajador.'}
        </p>
      </ManagementPage>

      {(dialog?.mode === 'create' || dialog?.mode === 'edit') && (
        <RecordFormDialog
          key={`${section}-${dialog.mode}-${dialog.record?.id || 'new'}`}
          activities={activities}
          lots={lots}
          onClose={() => setDialog(null)}
          onSave={saveOperation}
          onSaved={refreshWorkdays}
          record={dialog.record}
          section={section}
          workers={workers}
          defaultAgreedRate={
            localStorage.getItem(
              `cafesmart_tarifa_${isHarvest ? 'kg' : 'jornal'}_${userId}`,
            ) || (isHarvest ? '1000' : '50000')
          }
        />
      )}
      {dialog?.mode === 'view' && (
        <RecordDetailsDialog
          onClose={() => setDialog(null)}
          record={dialog.record}
          section={section}
        />
      )}
    </>
  );
}
