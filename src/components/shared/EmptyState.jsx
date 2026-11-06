import { Sprout } from 'lucide-react';

export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-input bg-card px-5 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-tint text-primary">
        <Sprout aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink-soft">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
