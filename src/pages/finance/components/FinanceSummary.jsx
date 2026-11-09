// Totales de ventas y gastos de los movimientos filtrados.
import { Card } from '#components/ui/card';
import { formatoDinero } from '#lib/formatters';

export default function FinanceSummary({ sales, expenses, periodLabel }) {
  return (
    <section aria-label={`Resumen ${periodLabel}`} className="grid gap-3 sm:grid-cols-2">
      <Card className="flex flex-row items-center justify-between rounded-2xl border-border/60 bg-muted px-4 py-3 shadow-none">
        <span className="text-sm text-ink-soft">Ventas · {periodLabel}</span>
        <strong className="text-base text-leaf">{formatoDinero(sales)}</strong>
      </Card>
      <Card className="flex flex-row items-center justify-between rounded-2xl border-destructive/20 bg-destructive-soft px-4 py-3 shadow-none">
        <span className="text-sm text-muted-foreground">Gastos · {periodLabel}</span>
        <strong className="text-base text-destructive">{formatoDinero(expenses)}</strong>
      </Card>
    </section>
  );
}
