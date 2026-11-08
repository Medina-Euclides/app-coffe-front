// Cifra destacada con su etiqueta (ingresos, gastos, balance…).
// tone: 'positive' (verde hoja), 'negative' (rojo) o 'default'.
import { Card, CardDescription, CardHeader, CardTitle } from '#components/ui/card';
import { cn } from '#lib/utils';

const toneClass = {
  positive: 'text-leaf',
  negative: 'text-destructive',
  default: 'text-foreground',
};

export default function StatCard({ title, value, tone = 'default', className }) {
  return (
    <Card className={cn('rounded-2xl border-border bg-card shadow-sm', className)}>
      <CardHeader className="gap-1 pb-1">
        <CardDescription className="text-sm text-muted-foreground">{title}</CardDescription>
        <CardTitle className={cn('cifra text-3xl sm:text-4xl', toneClass[tone])}>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
