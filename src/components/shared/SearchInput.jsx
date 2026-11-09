// Campo de búsqueda con lupa y etiqueta para lectores de pantalla.
import { Search } from 'lucide-react';
import { Input } from '#components/ui/input';
import { cn } from '#lib/utils';

export default function SearchInput({ id, label, value, onChange, placeholder, className, inputClassName }) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        autoComplete="off"
        className={cn(
          'h-12 rounded-xl border-border bg-card pl-10 text-base shadow-sm placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-ring/20',
          inputClassName,
        )}
        id={id}
        name="search"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}
