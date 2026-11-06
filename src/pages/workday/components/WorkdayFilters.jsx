import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

const periods = [
  { value: 'today', label: 'Hoy' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
  { value: 'all', label: 'Todo' },
];

export default function WorkdayFilters({
  search,
  onSearchChange,
  period,
  onPeriodChange,
  modality,
  onModalityChange,
  searchPlaceholder = 'Buscar por trabajador o CC…',
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2.5 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <label className="sr-only" htmlFor="workday-search">
          Buscar por trabajador o cédula
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          autoComplete="off"
          className="h-10 rounded-xl border-border bg-card pl-9 text-sm shadow-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-ring/20"
          id="workday-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={search}
        />
      </div>

      <div
        aria-label="Filtrar por periodo"
        className="flex h-10 items-center rounded-xl bg-muted p-1"
        role="group"
      >
        {periods.map((option) => (
          <Button
            aria-pressed={period === option.value}
            className={
              period === option.value
                ? 'h-8 rounded-lg bg-primary px-3 text-xs text-primary-foreground shadow-none hover:bg-primary-hover'
                : 'h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground'
            }
            key={option.value}
            onClick={() => onPeriodChange(option.value)}
            type="button"
            variant="ghost"
          >
            {option.value === 'today' && (
              <CalendarDays aria-hidden="true" className="size-3.5" />
            )}
            {option.label}
          </Button>
        ))}
      </div>

      <Select onValueChange={onModalityChange} value={modality}>
        <SelectTrigger
          aria-label="Filtrar por modalidad de pago"
          className="h-10 w-full rounded-xl border-border bg-muted px-3 text-sm text-ink-soft sm:w-[190px]"
        >
          <SelectValue placeholder="Todas las modalidades" />
          <SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las modalidades</SelectItem>
          <SelectItem value="jornal">Por jornal</SelectItem>
          <SelectItem value="kilogram">Por kilogramo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
