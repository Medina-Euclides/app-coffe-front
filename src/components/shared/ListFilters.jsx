import { SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import SearchInput from '#components/shared/SearchInput';
import SegmentedControl from '#components/shared/SegmentedControl';

const periods = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'all', label: 'Todo' },
];

const modalities = [
  { value: 'all', label: 'Todas las modalidades' },
  { value: 'jornal', label: 'Por jornal' },
  { value: 'kilogram', label: 'Por kilogramo' },
];
const modalityLabel = Object.fromEntries(modalities.map(({ value, label }) => [value, label]));

// Búsqueda + periodo + modalidad de pago (Jornadas y Pagos).
export default function ListFilters({
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
      <SearchInput
        className="flex-1"
        id="workday-search"
        inputClassName="shadow-none"
        label="Buscar por trabajador o cédula"
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        value={search}
      />

      <SegmentedControl label="Filtrar por periodo" onChange={onPeriodChange} options={periods} value={period} />

      <Select onValueChange={onModalityChange} value={modality}>
        <SelectTrigger
          aria-label="Filtrar por modalidad de pago"
          className="h-12 w-full rounded-xl border-border bg-muted px-3 text-base text-ink-soft sm:w-[190px]"
        >
          {/* Sin esto, el Select muestra el valor interno («all») en vez del texto. */}
          <SelectValue placeholder="Todas las modalidades">
            {(value) => modalityLabel[value]}
          </SelectValue>
          <SlidersHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
        </SelectTrigger>
        <SelectContent>
          {modalities.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
