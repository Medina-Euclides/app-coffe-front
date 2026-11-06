// Página de analíticas: muestra producción de café, gastos y balance por finca.
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '#components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { Button } from '#components/ui/button';
import { api } from '#services/api';
import PageTitle from '#components/shared/PageTitle';
import SegmentedControl from '#components/shared/SegmentedControl';

const periods = [
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
];

const categoryColors = {
  labor: 'var(--chart-1)',
  inputs: 'var(--chart-4)',
  tools_materials: 'var(--chart-3)',
  transport: 'var(--chart-2)',
  services: 'var(--chart-5)',
  other: 'var(--subtle)',
};

const productionChartConfig = {
  total_quantity_kg: {
    label: 'Café recolectado',
    color: 'var(--chart-4)',
  },
};

const lotChartConfig = {
  total_quantity_kg: {
    label: 'Producción',
    color: 'var(--chart-1)',
  },
};

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const kilogramsFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 3,
});

function parseLocalDate(value) {
  if (!value) return null;
  const parsedDate = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatBucket(point, period) {
  const start = parseLocalDate(point.start_date);
  const end = parseLocalDate(point.end_date);
  if (!start || !end) return '';

  if (period === 'week') {
    return new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(start);
  }
  if (period === 'year') {
    return new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(start);
  }
  return `${String(start.getDate()).padStart(2, '0')}–${String(
    end.getDate(),
  ).padStart(2, '0')}`;
}

function formatDate(value, options = { day: 'numeric', month: 'short' }) {
  const date = parseLocalDate(value);
  return date
    ? new Intl.DateTimeFormat('es-CO', options).format(date)
    : '';
}

function formatPeriodRange(series) {
  if (!series) return '';
  return `${formatDate(series.start_date)} – ${formatDate(series.end_date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function StatCard({ title, value, tone = 'default' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-leaf'
      : tone === 'negative'
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="gap-1 pb-1">
        <CardDescription className="text-sm text-muted-foreground">
          {title}
        </CardDescription>
        <CardTitle className={`cifra text-3xl sm:text-4xl ${toneClass}`}>
          {currencyFormatter.format(Number(value) || 0)}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function AnalyticPage({ usuario }) {
  const userId = usuario?.id || 'default';
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [period, setPeriod] = useState('month');
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmsError, setFarmsError] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    api.farms
      .list()
      .then((loadedFarms) => {
        if (!active) return;
        // Abre con «Todas las fincas» para cuadrar con el resumen de Inicio.
        setFarms(loadedFarms);
      })
      .catch((loadError) => {
        if (!active) return;
        console.error('Error al cargar fincas para analíticas:', loadError);
        setFarmsError(
          loadError.message || 'No se pudieron cargar las fincas.',
        );
      })
      .finally(() => {
        if (active) setFarmsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (farmsLoading || farmsError) return undefined;
    let active = true;

    api.analytics
      .summary({
        farmId: selectedFarmId || undefined,
        period,
      })
      .then((data) => {
        if (active) {
          setSummary(data);
          setError('');
        }
      })
      .catch((loadError) => {
        if (!active) return;
        console.error('Error al cargar analíticas:', loadError);
        setSummary(null);
        setError(loadError.message || 'No se pudieron cargar las analíticas.');
      });

    return () => {
      active = false;
    };
  }, [farmsError, farmsLoading, period, reloadKey, selectedFarmId]);

  const activeSummary =
    summary &&
    summary.period === period &&
    String(summary.farm_id || '') === selectedFarmId
      ? summary
      : null;
  const loading = farmsLoading || (!farmsError && !error && !activeSummary);
  const productionSeries = activeSummary?.production_series;
  const productionData = useMemo(
    () =>
      (productionSeries?.points || []).map((point) => ({
        ...point,
        label: formatBucket(point, period),
        total_quantity_kg: Number(point.total_quantity_kg) || 0,
      })),
    [period, productionSeries],
  );
  const lotProductionData = useMemo(
    () =>
      (activeSummary?.production_by_lot || [])
        .map((lot) => ({
          ...lot,
          total_quantity_kg: Number(lot.total_quantity_kg) || 0,
        }))
        .sort((first, second) => second.total_quantity_kg - first.total_quantity_kg),
    [activeSummary],
  );

  const expenses = activeSummary?.expenses_by_category || [];
  const totalExpenses =
    Number(activeSummary?.financial_summary?.total_expenses) || 0;
  const periodLabel =
    periods.find((option) => option.value === period)?.label || 'Este mes';

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <PageTitle>
            Analítica de la finca
          </PageTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Consulta la producción de café y el destino de tus gastos de forma
            clara y sencilla.
          </p>
        </div>
        <div className="w-full lg:w-64">
          <label
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
            htmlFor="analytics-farm"
          >
            Finca
          </label>
          <select
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            disabled={farmsLoading || farms.length === 0}
            id="analytics-farm"
            onChange={(event) => {
              setError('');
              setSelectedFarmId(event.target.value);
            }}
            value={selectedFarmId}
          >
            <option value="">Todas las fincas</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.nombre}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          label="Período de producción"
          onChange={(value) => {
            setError('');
            setPeriod(value);
          }}
          options={periods}
          value={period}
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {periodLabel}
          {productionSeries ? ` · ${formatPeriodRange(productionSeries)}` : ''}
        </p>
      </div>

      {farmsError && (
        <div
          aria-live="assertive"
          className="rounded-xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {farmsError}
          <Button
            className="ml-3 h-8"
            onClick={() => window.location.reload()}
            type="button"
            variant="outline"
          >
            Recargar
          </Button>
        </div>
      )}
      {error && (
        <div
          aria-live="assertive"
          className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{error}</span>
          <Button
            className="h-9 rounded-lg"
            onClick={() => {
              setError('');
              setReloadKey((key) => key + 1);
            }}
            type="button"
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      )}

      {loading && !activeSummary ? (
        <p aria-live="polite" className="py-12 text-center text-sm text-muted-foreground" role="status">
          Cargando analíticas…
        </p>
      ) : activeSummary ? (
        <>
          <section
            aria-label="Resumen financiero"
            className="grid gap-4 sm:grid-cols-3"
          >
            <StatCard
              title="Ingresos acumulados por ventas"
              value={activeSummary.financial_summary.sales_income}
              tone="positive"
            />
            <StatCard
              title="Egresos acumulados"
              value={activeSummary.financial_summary.total_expenses}
              tone="negative"
            />
            <StatCard
              title="Balance neto acumulado"
              value={activeSummary.financial_summary.net_income}
              tone={
                Number(activeSummary.financial_summary.net_income) < 0
                  ? 'negative'
                  : 'positive'
              }
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Café recolectado
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Producción de {periodLabel.toLocaleLowerCase()}
                  </CardDescription>
                </div>
                <div className="shrink-0 rounded-full border border-border bg-tint px-3 py-1.5 text-sm font-semibold text-primary">
                  {kilogramsFormatter.format(
                    Number(productionSeries?.total_quantity_kg) || 0,
                  )}{' '}
                  kg
                </div>
              </CardHeader>
              <CardContent>
                {productionData.length > 0 ? (
                  <ChartContainer
                    className="mt-3 h-[280px] w-full aspect-auto"
                    config={productionChartConfig}
                  >
                    <BarChart
                      accessibilityLayer
                      data={productionData}
                      margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        axisLine={false}
                        dataKey="label"
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('es-CO', {
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(value)
                        }
                        tickLine={false}
                        tickMargin={8}
                        width={48}
                      />
                      <Tooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => (
                              <span className="font-semibold">
                                {kilogramsFormatter.format(Number(value))} kg
                              </span>
                            )}
                          />
                        }
                        cursor={{ fill: 'var(--muted)' }}
                      />
                      <Bar
                        dataKey="total_quantity_kg"
                        fill="var(--color-total_quantity_kg)"
                        maxBarSize={56}
                        radius={[7, 7, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No hay producción registrada para este período.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card shadow-sm">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    ¿En qué se fue la plata?
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Distribución histórica de egresos por categoría
                  </CardDescription>
                </div>
                <div className="shrink-0 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-semibold text-foreground">
                  {currencyFormatter.format(totalExpenses)}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                {expenses.map((expense) => {
                  const amount = Number(expense.total_amount) || 0;
                  const percentage =
                    totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

                  return (
                    <div className="space-y-2" key={expense.category}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-sm font-medium text-ink-soft">
                          {expense.label}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {currencyFormatter.format(amount)}{' '}
                          <span className="font-normal text-muted-foreground">
                            ({Math.round(percentage)}%)
                          </span>
                        </span>
                      </div>
                      <div
                        aria-label={`${expense.label}: ${Math.round(percentage)}%`}
                        className="h-2.5 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={Math.round(percentage)}
                      >
                        <div
                          className="h-full rounded-full transition-[width]"
                          style={{
                            backgroundColor:
                              categoryColors[expense.category] || 'var(--subtle)',
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>

          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Producción por lote
              </CardTitle>
              <CardDescription>
                Acumulado histórico · los lotes sin cosecha también aparecen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lotProductionData.length > 0 ? (
                <ChartContainer
                  className="h-[min(420px,65vh)] min-h-[240px] w-full aspect-auto"
                  config={lotChartConfig}
                >
                  <BarChart
                    accessibilityLayer
                    data={lotProductionData}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${kilogramsFormatter.format(value)} kg`
                      }
                      tickLine={false}
                      type="number"
                    />
                    <YAxis
                      axisLine={false}
                      dataKey="lot_name"
                      tickLine={false}
                      type="category"
                      width={130}
                    />
                    <Tooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, item) => (
                            <span className="font-semibold">
                              {kilogramsFormatter.format(Number(value))} kg
                              {item.payload.plant_count !== null &&
                                item.payload.plant_count !== undefined &&
                                ` · ${new Intl.NumberFormat('es-CO').format(
                                  item.payload.plant_count,
                                )} plantas`}
                            </span>
                          )}
                        />
                      }
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Bar
                      dataKey="total_quantity_kg"
                      fill="var(--color-total_quantity_kg)"
                      maxBarSize={26}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No hay lotes registrados para mostrar.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : !error && !farmsError ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay datos para mostrar.
        </p>
      ) : null}
    </main>
  );
}
