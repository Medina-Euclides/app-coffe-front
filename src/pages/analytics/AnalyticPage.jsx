// Página de analíticas: muestra producción de café, gastos y balance por finca.
import ErrorBanner from '#components/shared/ErrorBanner';
import FarmSelect from '#components/shared/FarmSelect';
import LoadingState from '#components/shared/LoadingState';
import NoticeBanner from '#components/shared/NoticeBanner';
import PageTitle from '#components/shared/PageTitle';
import SegmentedControl from '#components/shared/SegmentedControl';
import StatCard from '#components/shared/StatCard';
import { formatoDinero } from '#lib/formatters';
import { formatPeriodRange, periods } from './analyticsFormat.js';
import ExpenseBreakdown from './components/ExpenseBreakdown.jsx';
import LotProductionChart from './components/LotProductionChart.jsx';
import ProductionChart from './components/ProductionChart.jsx';
import { useAnalyticsSummary } from './hooks/useAnalyticsSummary.js';

const money = (value) => formatoDinero(Number(value) || 0);

export default function AnalyticPage({ usuario }) {
  const analytics = useAnalyticsSummary(usuario?.id || 'default');
  const { summary, periodOption, productionSeries } = analytics;
  const periodText = periodOption.produccion;
  const finance = summary?.financial_summary;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <PageTitle>Analítica de la finca</PageTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Consulta la producción de café y el destino de tus gastos de forma clara y sencilla.
          </p>
        </div>
        <FarmSelect
          className="w-full lg:w-64"
          disabled={analytics.farmsLoading || analytics.farms.length === 0}
          farms={analytics.farms}
          id="analytics-farm"
          onChange={analytics.setSelectedFarmId}
          showLabel
          value={analytics.selectedFarmId}
        />
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          label="Período de producción"
          onChange={analytics.setPeriod}
          options={periods}
          value={analytics.period}
        />
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {productionSeries ? formatPeriodRange(productionSeries) : ''}
        </p>
      </div>

      <ErrorBanner message={analytics.farmsError} onRetry={analytics.refetchFarms} retryLabel="Recargar" />
      <ErrorBanner message={analytics.error} onRetry={analytics.refetchSummary} />

      {analytics.loading && !summary ? (
        <LoadingState className="py-12">Cargando analíticas…</LoadingState>
      ) : summary ? (
        <>
          {summary._local && (
            <NoticeBanner message="Calculado con los datos de este dispositivo (sin conexión o con registros pendientes de sincronizar)." />
          )}
          <section aria-label="Resumen financiero" className="grid gap-4 sm:grid-cols-3">
            <StatCard title={`Ingresos por ventas de ${periodText}`} tone="positive" value={money(finance.sales_income)} />
            <StatCard title={`Egresos de ${periodText}`} tone="negative" value={money(finance.total_expenses)} />
            <StatCard
              title={`Balance neto de ${periodText}`}
              tone={Number(finance.net_income) < 0 ? 'negative' : 'positive'}
              value={money(finance.net_income)}
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <ProductionChart
              data={analytics.productionData}
              periodText={periodText}
              totalKg={productionSeries?.total_quantity_kg}
            />
            <ExpenseBreakdown
              expenses={analytics.expenses}
              periodText={periodText}
              totalExpenses={analytics.totalExpenses}
            />
          </section>

          <LotProductionChart data={analytics.lotProductionData} periodText={periodText} />
        </>
      ) : !analytics.error && !analytics.farmsError ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No hay datos para mostrar.</p>
      ) : null}
    </main>
  );
}
