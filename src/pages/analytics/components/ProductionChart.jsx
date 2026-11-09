// Café recolectado en el periodo, en barras por día, semana, mes o año.
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '#components/shared/ChartCard';
import { ChartContainer, ChartTooltipContent } from '#components/ui/chart';
import { formatoCompacto, formatoKilos } from '#lib/formatters';

const productionChartConfig = {
  total_quantity_kg: {
    label: 'Café recolectado',
    color: 'var(--chart-4)',
  },
};

export default function ProductionChart({ data, totalKg, periodText }) {
  const productionData = data;
  return (
    <ChartCard
      badge={`${formatoKilos(Number(totalKg) || 0)} kg`}
      description={`Producción de ${periodText}`}
      title="Café recolectado"
    >
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
              tickFormatter={formatoCompacto}
              tickLine={false}
              tickMargin={8}
              width={48}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="font-semibold">
                      {formatoKilos(Number(value))} kg
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
    </ChartCard>
  );
}
