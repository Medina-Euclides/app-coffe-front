// Tarjeta para un gráfico: título, descripción, una cifra destacada opcional (badge)
// a la derecha y el gráfico debajo.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#components/ui/card';
import { cn } from '#lib/utils';

const badgeTones = {
  primary: 'bg-tint text-primary',
  muted: 'bg-muted text-foreground',
};

export default function ChartCard({
  title,
  description,
  badge,
  badgeTone = 'primary',
  contentClassName,
  className,
  children,
}) {
  return (
    <Card className={cn('rounded-2xl border-border bg-card shadow-sm', className)}>
      <CardHeader className={badge ? 'flex-row items-start justify-between gap-3' : undefined}>
        <div>
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {badge && (
          <div className={cn('shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-semibold', badgeTones[badgeTone])}>
            {badge}
          </div>
        )}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
