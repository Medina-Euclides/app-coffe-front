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
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#e7ebe4] bg-white p-2.5 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <label className="sr-only" htmlFor="workday-search">
          Buscar por trabajador o cédula
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#899489]"
        />
        <Input
          autoComplete="off"
          className="h-10 rounded-xl border-[#dfe5dc] bg-white pl-9 text-sm shadow-none placeholder:text-[#899489] focus-visible:border-[#5b805e] focus-visible:ring-[#5b805e]/20"
          id="workday-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por trabajador o CC…"
          type="search"
          value={search}
        />
      </div>

      <div
        aria-label="Filtrar por periodo"
        className="flex h-10 items-center rounded-xl bg-[#f0f3ef] p-1"
        role="group"
      >
        {periods.map((option) => (
          <Button
            aria-pressed={period === option.value}
            className={
              period === option.value
                ? 'h-8 rounded-lg bg-[#173d30] px-3 text-xs text-white shadow-none hover:bg-[#214b32]'
                : 'h-8 rounded-lg px-2.5 text-xs text-[#68766b] hover:bg-white hover:text-[#173d30]'
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
          className="h-10 w-full rounded-xl border-[#e5e9e3] bg-[#f8f9f6] px-3 text-sm text-[#415448] sm:w-[190px]"
        >
          <SelectValue placeholder="Todas las modalidades" />
          <SlidersHorizontal aria-hidden="true" className="size-4 text-[#778477]" />
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
