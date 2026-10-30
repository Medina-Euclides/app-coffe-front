import { useMemo, useState } from 'react';
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

const TRABAJADORES = [
  'María Fernanda López',
  'Carlos Andrés Rojas',
  'Jorge Eliécer Gómez',
  'Lucía Ramírez',
  'Pedro Antonio Ruiz',
];

const LOTES = ['Lote El Roble', 'Lote La Esperanza', 'Lote Alto del Café'];

const ACTIVIDADES = [
  'Deshierbe / Plateo',
  'Abonado / Fertilización',
  'Poda y Zoca',
  'Ahoyado y Siembra',
  'Fumigación / Control de plagas',
];

const RECOLECCIONES = [
  {
    id: 'recoleccion-1',
    fecha: '2026-10-29',
    trabajador: 'María Fernanda López',
    lote: 'Lote El Roble',
    kilogramos: '36.5',
  },
  {
    id: 'recoleccion-2',
    fecha: '2026-10-29',
    trabajador: 'Carlos Andrés Rojas',
    lote: 'Lote El Roble',
    kilogramos: '42',
  },
  {
    id: 'recoleccion-3',
    fecha: '2026-10-28',
    trabajador: 'Jorge Eliécer Gómez',
    lote: 'Lote La Esperanza',
    kilogramos: '31.5',
  },
];

const JORNADAS = [
  {
    id: 'jornada-1',
    fecha: '2026-10-29',
    trabajador: 'Lucía Ramírez',
    actividad: 'Deshierbe / Plateo',
    lote: 'Lote Alto del Café',
  },
  {
    id: 'jornada-2',
    fecha: '2026-10-28',
    trabajador: 'Pedro Antonio Ruiz',
    actividad: 'Abonado / Fertilización',
    lote: 'Lote El Roble',
  },
  {
    id: 'jornada-3',
    fecha: '2026-10-27',
    trabajador: 'María Fernanda López',
    actividad: 'Poda y Zoca',
    lote: 'Lote La Esperanza',
  },
];

const inputClassName =
  'h-11 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm text-[#294533] outline-none transition focus-visible:border-[#5b805e] focus-visible:ring-3 focus-visible:ring-[#5b805e]/20';

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

function RecordFormDialog({ onClose, record, section }) {
  const isHarvest = section === 'recoleccion';
  const [mode, setMode] = useState('individual');
  const [date, setDate] = useState(() => record?.fecha || hoy());
  const [lot, setLot] = useState(record?.lote || '');
  const [workerRows, setWorkerRows] = useState([
    {
      worker: record?.trabajador || '',
      amount: record?.kilogramos || '',
    },
  ]);
  const [activity, setActivity] = useState(record?.actividad || '');
  const [notice, setNotice] = useState('');
  const isEditing = Boolean(record);

  const updateWorkerRow = (index, key, value) => {
    setWorkerRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
  };

  const addWorkerRow = () => {
    setWorkerRows((rows) => [...rows, { worker: '', amount: '' }]);
  };

  const removeWorkerRow = (index) => {
    setWorkerRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setNotice('Prototipo visual: los datos todavía no se guardan.');
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
              ? 'Indica la fecha, el lote y los kilogramos recolectados por cada trabajador.'
              : 'Registra una ejecución concreta de una actividad en una fecha y lote.'}
          </DialogDescription>
        </DialogHeader>

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
                onChange={(event) => setDate(event.target.value)}
                required
                type="date"
                value={date}
              />
            </Field>
            <Field htmlFor="operation-lot" label="Lote">
              <select
                className={inputClassName}
                id="operation-lot"
                onChange={(event) => setLot(event.target.value)}
                required
                value={lot}
              >
                <option disabled value="">
                  Selecciona un lote
                </option>
                {LOTES.map((lotName) => (
                  <option key={lotName} value={lotName}>
                    {lotName}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {isHarvest ? (
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
                    className="grid gap-3 rounded-xl border border-[#e5e9e1] bg-[#fbfcf9] p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end"
                    key={`worker-row-${index}`}
                  >
                    <Field
                      htmlFor={`harvest-worker-${index}`}
                      label={`Trabajador${workerRows.length > 1 ? ` ${index + 1}` : ''}`}
                    >
                      <select
                        className={inputClassName}
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
                        {TRABAJADORES.map((worker) => (
                          <option key={worker} value={worker}>
                            {worker}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field htmlFor={`harvest-amount-${index}`} label="Cantidad (kg)">
                      <input
                        className={inputClassName}
                        id={`harvest-amount-${index}`}
                        min="0"
                        onChange={(event) =>
                          updateWorkerRow(index, 'amount', event.target.value)
                        }
                        placeholder="Ej. 25"
                        required
                        step="0.1"
                        type="number"
                        value={row.amount}
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
          ) : (
            <>
              <Field htmlFor="workday-worker" label="Trabajador">
                <select
                  className={inputClassName}
                  id="workday-worker"
                  required
                  defaultValue={record?.trabajador || ''}
                >
                  <option disabled value="">
                    Selecciona un trabajador
                  </option>
                  {TRABAJADORES.map((worker) => (
                    <option key={worker} value={worker}>
                      {worker}
                    </option>
                  ))}
                </select>
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
                  {ACTIVIDADES.map((activityName) => (
                    <option key={activityName} value={activityName}>
                      {activityName}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="rounded-xl border border-[#dce8d9] bg-[#f0f5ed] p-3 text-sm leading-5 text-[#426548]">
                Las actividades se crean previamente en Gestión de la finca. Cada
                ejecución se registra como una jornada independiente.
              </p>
            </>
          )}

          {notice && (
            <p
              aria-live="polite"
              className="rounded-lg border border-[#dce8d9] bg-[#f0f5ed] px-3 py-2 text-sm text-[#426548]"
              role="status"
            >
              {notice}
            </p>
          )}

          <DialogFooter className="flex-col-reverse gap-2 border-0 bg-transparent p-0 sm:flex-row">
            <Button
              className="h-11 rounded-xl border-[#dfe5dc] px-4 text-[#526254] hover:bg-[#f4f6f1]"
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              className="h-11 rounded-xl bg-[#214b32] px-5 text-white hover:bg-[#173d2b]"
              type="submit"
            >
              {isEditing ? 'Guardar cambios' : 'Guardar registro'}
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
            <DetailItem
              icon={Sprout}
              label="Cantidad recolectada"
              value={`${record.kilogramos} kg`}
            />
          ) : (
            <DetailItem
              icon={ClipboardList}
              label="Actividad"
              value={record.actividad}
            />
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

export default function Operations() {
  const { pathname } = useLocation();
  const section = pathname.endsWith('/jornadas') ? 'jornadas' : 'recoleccion';
  const isHarvest = section === 'recoleccion';
  const records = isHarvest ? RECOLECCIONES : JORNADAS;
  const [search, setSearch] = useState('');
  const [lotFilter, setLotFilter] = useState('');
  const [dialog, setDialog] = useState(null);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const searchableText = isHarvest
        ? `${record.trabajador} ${record.lote} ${record.kilogramos}`
        : `${record.trabajador} ${record.lote} ${record.actividad}`;
      const matchesSearch = searchableText.toLocaleLowerCase().includes(query);
      return matchesSearch && (!lotFilter || record.lote === lotFilter);
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
        onAction={() => setDialog({ mode: 'create' })}
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
              Datos de muestra
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
              {LOTES.map((lot) => (
                <option key={lot} value={lot}>
                  {lot}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            description={
              records.length
                ? 'Prueba con otro término de búsqueda o selecciona un lote diferente.'
                : 'Cuando registres una operación, aparecerá aquí.'
            }
            title={records.length ? 'No encontramos registros' : 'Aún no hay registros'}
          />
        ) : (
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
          Los registros de recolección son independientes de las jornadas laborales.
        </p>
      </ManagementPage>

      {(dialog?.mode === 'create' || dialog?.mode === 'edit') && (
        <RecordFormDialog
          key={`${section}-${dialog.mode}-${dialog.record?.id || 'new'}`}
          onClose={() => setDialog(null)}
          record={dialog.record}
          section={section}
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
