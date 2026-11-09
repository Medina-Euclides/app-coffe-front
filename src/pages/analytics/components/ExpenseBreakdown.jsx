// Egresos del periodo por categoría, con barra de porcentaje para cada una.
import ChartCard from '#components/shared/ChartCard';
import { formatoDinero } from '#lib/formatters';
import { categoryColors } from '../analyticsFormat.js';

export default function ExpenseBreakdown({ expenses, totalExpenses, periodText }) {
  return (
    <ChartCard
      badge={formatoDinero(totalExpenses)}
      badgeTone="muted"
      contentClassName="space-y-5 pt-4"
      description={`Egresos de ${periodText} por categoría`}
      title="¿En qué se fue la plata?"
    >
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
                {formatoDinero(amount)}{' '}
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
    </ChartCard>
  );
}
