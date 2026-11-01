import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Search } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#components/ui/tabs';
import { api } from '#services/api';
import WorkdayCard from './components/WorkdayCard.jsx';
import WorkdayFilters from './components/WorkdayFilters.jsx';
import WorkdayFormDialog from './components/WorkdayFormDialog.jsx';
import HarvestRecordFormDialog from './components/HarvestRecordFormDialog.jsx';
import WorkdayHeader from './components/WorkdayHeader.jsx';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function asAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function getWorkerName(worker) {
  if (typeof worker === 'string') return worker;
  if (!worker || typeof worker !== 'object') return '';
  return (
    worker.nombre ||
    worker.name ||
    worker.full_name ||
    [worker.first_name, worker.last_name].filter(Boolean).join(' ')
  );
}

function getDateKey(value) {
  if (!value) return '';
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapWorkday(workday) {
  const details = Array.isArray(workday.details) ? workday.details : [];
  const detail = details[0] || null;
  const activity =
    workday.activity_type && typeof workday.activity_type === 'object'
      ? workday.activity_type
      : null;
  const worker =
    workday.worker && typeof workday.worker === 'object' ? workday.worker : null;
  const topLevelRecords =
    workday.harvest_records ||
    workday.harvestRecords ||
    workday.pesajes ||
    [];
  const harvestRecords = [
    ...(Array.isArray(topLevelRecords) ? topLevelRecords : []),
    ...details.flatMap((item) =>
      Array.isArray(item.harvest_records) ? item.harvest_records : [],
    ),
  ];
  const rate = asAmount(
    workday.agreed_rate ?? workday.rate ?? workday.tarifa,
  );
  const paymentMode = String(
    workday.payment_mode ||
      workday.modalidad_pago ||
      (workday.isPerKilogram ? 'kg' : ''),
  ).toLocaleLowerCase();
  const isPerKilogram = /kg|kilo|kilogram/.test(paymentMode);
  const activityNames = [
    activity?.name ||
    workday.activity_type_name ||
    workday.activity_name ||
    detail?.activity_name ||
    (typeof workday.activity_type === 'string' ? workday.activity_type : '') ||
    '',
    ...details.map((item) => item.activity_name).filter(Boolean),
  ].filter(Boolean);
  const activityName = [...new Set(activityNames)].join(', ') || 'Actividad laboral';
  const isHarvest =
    Boolean(
      activity?.is_harvest ??
        workday.is_harvest ??
        detail?.activity_type?.is_harvest ??
        detail?.is_harvest,
    ) ||
    activityNames.some((name) => name.toLocaleLowerCase().includes('recole'));
  const kgFromRecords = harvestRecords.reduce(
    (total, record) =>
      total + asAmount(record.quantity_kg ?? record.kilograms ?? record.kg),
    0,
  );
  const totalKg = asAmount(
    workday.total_kg ?? workday.quantity_kg ?? workday.harvested_kg ?? kgFromRecords,
  );
  const totalAmount = asAmount(
    workday.total_estimated ??
      workday.total_amount ??
      workday.total_pay ??
      workday.total ??
      (isPerKilogram ? rate * totalKg : rate),
  );
  const lotNames = details
    .map((item) =>
      [item.lot_name, item.farm_name].filter(Boolean).join(' · '),
    )
    .filter(Boolean);
  const lot =
    workday.lot && typeof workday.lot === 'object'
      ? [
          workday.lot.name || workday.lot.nombre,
          workday.lot.farmName ||
            workday.lot.farm?.name ||
            workday.lot.farm_name,
        ]
          .filter(Boolean)
          .join(' · ')
      : lotNames.join(' / ') ||
        workday.lot_name ||
        (detail?.farm_name
          ? `${detail.lot_name} · ${detail.farm_name}`
          : detail?.lot_name) ||
        workday.lot ||
        workday.lote ||
        '';
  const date = workday.date || workday.workday_date || workday.fecha;
  const count = Number(
    workday.harvest_records_count ??
      workday.weighings_count ??
      workday.pesajes_count ??
      harvestRecords.length,
  );

  return {
    id:
      workday.id ??
      `${getDateKey(date)}-${worker?.id ?? workday.worker ?? activityName}`,
    workerId: worker?.id ?? workday.worker,
    details,
    activityName,
    date,
    dateKey: getDateKey(date),
    identification:
      worker?.identification ||
      worker?.cedula ||
      workday.worker_identification ||
      workday.identification ||
      '',
    isHarvest,
    isPerKilogram,
    kgCount: totalKg,
    lot: typeof lot === 'string' ? lot : '',
    paymentLabel: isPerKilogram ? 'Pago por kg' : 'Modalidad: Jornal',
    rate,
    totalAmount,
    weighingCount: Number.isFinite(count) ? count : 0,
    workerName:
      getWorkerName(worker) ||
      workday.worker_name ||
      workday.workerName ||
      workday.nombre_trabajador ||
      '',
  };
}

function belongsToPeriod(dateKey, period, todayKey) {
  if (period === 'all') return true;
  if (!dateKey) return false;
  if (period === 'today') return dateKey === todayKey;
  if (period === 'month') return dateKey.slice(0, 7) === todayKey.slice(0, 7);
  return dateKey.slice(0, 4) === todayKey.slice(0, 4);
}

function WorkdayEmptyState({ hasWorkdays, errorMessage }) {
  const hasError = Boolean(errorMessage);
  return (
    <Card className="flex flex-col items-center gap-3 rounded-2xl border-[#e7ebe4] bg-white px-6 py-12 text-center shadow-none">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4eb] text-[#315d3b]">
        <ClipboardList aria-hidden="true" className="size-6" />
      </span>
      <div>
        <h2 className="font-semibold text-[#263b2c]">
          {hasError
            ? 'No se pudieron cargar las jornadas'
            : hasWorkdays
              ? 'No hay resultados para estos filtros'
              : 'Aún no hay jornadas laborales'}
        </h2>
        <p className="mt-1 max-w-md text-sm leading-6 text-[#748074]">
          {hasError
            ? errorMessage
            : hasWorkdays
              ? 'Cambia la búsqueda, el periodo o la modalidad para ver otros registros.'
              : 'Cuando registres una jornada, aquí podrás consultar su actividad, tarifa y valor estimado.'}
        </p>
      </div>
    </Card>
  );
}

export default function WorkdayPage() {
  const [workdays, setWorkdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('today');
  const [modality, setModality] = useState('all');
  const [section, setSection] = useState('workdays');
  const [action, setAction] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    api.workdays
      .list()
      .then((items) => {
        if (active) setWorkdays(items.map(mapWorkday));
      })
      .catch((error) => {
        if (!active) return;
        console.error('Error al cargar jornadas laborales:', error);
        setLoadError(error.message || 'No se pudieron cargar las jornadas.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const [todayKey] = useState(() => getDateKey(new Date()));
  const filteredWorkdays = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return workdays
      .filter((workday) => belongsToPeriod(workday.dateKey, period, todayKey))
      .filter((workday) => {
        if (modality === 'jornal') return !workday.isPerKilogram;
        if (modality === 'kilogram') return workday.isPerKilogram;
        return true;
      })
      .filter((workday) => {
        if (!query) return true;
        return [
          workday.workerName,
          workday.identification,
          workday.activityName,
          workday.lot,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);
      })
      .sort((first, second) => second.dateKey.localeCompare(first.dateKey));
  }, [modality, period, search, todayKey, workdays]);

  const calculatedTotal = filteredWorkdays.reduce(
    (total, workday) => total + workday.totalAmount,
    0,
  );
  const periodLabel = {
    today: 'hoy',
    month: 'este mes',
    year: 'este año',
    all: 'en total',
  }[period];

  const saveWorkday = async (payload, context) => {
    const createdWorkday = await api.workdays.create(payload);
    let createdDetail;
    try {
      createdDetail = await api.workdayDetails.create({
        workday: createdWorkday.id,
        activity_type: context.activity.id,
        lot: context.lot.id,
      });
    } catch (detailError) {
      try {
        await api.workdays.delete(createdWorkday.id);
      } catch (cleanupError) {
        console.error(
          'No se pudo eliminar la jornada incompleta después de fallar su detalle:',
          cleanupError,
        );
        throw new Error(
          `${detailError.message} La jornada base quedó creada sin su actividad y lote; no la vuelvas a registrar para ese trabajador y fecha.`,
        );
      }
      throw detailError;
    }

    const savedDetail = {
      ...createdDetail,
      activity_type: context.activity,
      activity_name: createdDetail.activity_name || context.activity.name,
      lot_name: createdDetail.lot_name || context.lot.nombre || context.lot.name,
      farm_name: createdDetail.farm_name || context.lot.farmName || '',
    };
    setWorkdays((currentWorkdays) => [
      mapWorkday({
        ...createdWorkday,
        worker: context.worker,
        details: [savedDetail],
      }),
      ...currentWorkdays,
    ]);
    setPeriod('all');
    setModality('all');
    setSearch('');
    setNotice('La jornada laboral se registró correctamente.');
  };

  const saveHarvestRecord = (record, detail) => {
    setWorkdays((currentWorkdays) =>
      currentWorkdays.map((workday) => {
        if (String(workday.id) !== detail.workdayId) return workday;

        const details = workday.details.map((item) =>
          String(item.id) === detail.id
            ? {
                ...item,
                harvest_records: [...(item.harvest_records || []), record],
              }
            : item,
        );

        return mapWorkday({
          ...workday,
          worker: workday.workerId,
          worker_name: workday.workerName,
          payment_mode: workday.isPerKilogram ? 'kg' : 'jornal',
          agreed_rate: workday.rate,
          details,
        });
      }),
    );
    setPeriod('all');
    setModality('all');
    setSearch('');
    setNotice('El pesaje de recolección se registró correctamente.');
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <WorkdayHeader
        calculatedTotal={currencyFormatter.format(calculatedTotal)}
        onAddHarvest={() => setAction('pesaje')}
        onAddWorkday={() => setAction('jornada')}
        visibleCount={filteredWorkdays.length}
        periodLabel={periodLabel}
      />

      {notice && (
        <p
          aria-live="polite"
          className="rounded-xl border border-[#dce8d9] bg-[#f0f5ed] px-4 py-3 text-sm text-[#315d3b]"
          role="status"
        >
          {notice}
        </p>
      )}

      <Tabs
        className="w-full gap-4"
        onValueChange={setSection}
        value={section}
      >
        <TabsList className="grid h-auto w-full max-w-[535px] grid-cols-2 rounded-2xl bg-[#e9ede7] p-1">
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-[#69776d] data-active:bg-[#173d30] data-active:text-white data-active:shadow-none"
            value="workdays"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
            Jornadas laborales
          </TabsTrigger>
          <TabsTrigger
            className="h-10 rounded-xl text-sm text-[#69776d] data-active:bg-[#173d30] data-active:text-white data-active:shadow-none"
            value="harvest"
          >
            <ClipboardList aria-hidden="true" className="size-4" />
            Recolección
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="workdays">
          <WorkdayFilters
            modality={modality}
            onModalityChange={setModality}
            onPeriodChange={setPeriod}
            onSearchChange={setSearch}
            period={period}
            search={search}
          />

          {loading ? (
            <p
              aria-live="polite"
              className="rounded-2xl border border-[#e7ebe4] bg-white px-5 py-10 text-center text-sm text-[#748074]"
              role="status"
            >
              Cargando jornadas laborales…
            </p>
          ) : filteredWorkdays.length ? (
            <div className="space-y-3">
              {filteredWorkdays.map((workday) => (
                <WorkdayCard key={workday.id} workday={workday} />
              ))}
            </div>
          ) : (
            <WorkdayEmptyState
              errorMessage={loadError}
              hasWorkdays={workdays.length > 0}
            />
          )}
        </TabsContent>

        <TabsContent value="harvest">
          <Card className="flex flex-col items-center gap-3 rounded-2xl border-[#e7ebe4] bg-white px-6 py-12 text-center shadow-none">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4eb] text-[#315d3b]">
              <Search aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h2 className="font-semibold text-[#263b2c]">
                Recolección
              </h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-[#748074]">
                Esta vista se desarrollará en el siguiente paso. Por ahora,
                puedes consultar aquí las jornadas y sus pesajes asociados.
              </p>
            </div>
            <Button
              className="mt-1 rounded-xl bg-[#173d30] px-4 text-white hover:bg-[#214b32]"
              onClick={() => setSection('workdays')}
              type="button"
            >
              Volver a jornadas laborales
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {action === 'jornada' && (
        <WorkdayFormDialog
          existingWorkdays={workdays}
          onOpenChange={(open) => !open && setAction('')}
          onSave={saveWorkday}
          open
        />
      )}

      {action === 'pesaje' && (
        <HarvestRecordFormDialog
          onOpenChange={(open) => !open && setAction('')}
          onSave={saveHarvestRecord}
          open
        />
      )}
    </section>
  );
}
