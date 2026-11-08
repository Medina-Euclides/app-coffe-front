// Estado vacío o sin resultados: ícono, título, explicación y una acción opcional.
import { Sprout } from 'lucide-react';
import { cn } from '#lib/utils';

export default function EmptyState({ title, description, icon: Icon = Sprout, action, className }) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-input bg-card px-5 py-12 text-center', className)}>
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-tint text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink-soft">{title}</h2>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
