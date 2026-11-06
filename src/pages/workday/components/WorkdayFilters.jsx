import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import SegmentedControl from '#components/shared/SegmentedControl';

const periods = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
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
          className="h-12 rounded-xl border-border bg-card pl-9 text-base shadow-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-ring/20"
          id="workday-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={search}
        />
      </div>

      <SegmentedControl label="Filtrar por periodo" onChange={onPeriodChange} options={periods} value={period} />

      <Select onValueChange={onModalityChange} value={modality}>
        <SelectTrigger
          aria-label="Filtrar por modalidad de pago"
          className="h-12 w-full rounded-xl border-border bg-muted px-3 text-base text-ink-soft sm:w-[190px]"
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
