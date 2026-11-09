// Kilos por lote en el periodo, en barras horizontales (también lotes sin cosecha).
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '#components/shared/ChartCard';
import { ChartContainer, ChartTooltipContent } from '#components/ui/chart';
import { formatoConteo, formatoKilos } from '#lib/formatters';

const lotChartConfig = {
  total_quantity_kg: {
    label: 'Producción',
    color: 'var(--chart-1)',
  },
};

export default function LotProductionChart({ data, periodText }) {
  const lotProductionData = data;
  return (
    <ChartCard
      description={`Kilos de ${periodText}; los lotes sin cosecha también aparecen`}
      title="Producción por lote"
    >
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
                `${formatoKilos(value)} kg`
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
                      {formatoKilos(Number(value))} kg
                      {item.payload.plant_count !== null &&
                        item.payload.plant_count !== undefined &&
                        ` · ${formatoConteo(item.payload.plant_count)} plantas`}
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
    </ChartCard>
  );
}
