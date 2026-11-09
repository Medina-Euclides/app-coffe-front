// Filtros de movimientos: tipo, búsqueda, finca y periodo.
import FarmSelect from '#components/shared/FarmSelect';
import SearchInput from '#components/shared/SearchInput';
import SegmentedControl from '#components/shared/SegmentedControl';
import { DATE_FILTERS, TYPE_FILTERS } from '../financeFilters.js';

export default function MovementFilters({
  typeFilter,
  onTypeFilterChange,
  search,
  onSearchChange,
  farms,
  selectedFarmId,
  onFarmChange,
  dateFilter,
  onDateFilterChange,
}) {
  return (
    <section aria-label="Filtros de movimientos" className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SegmentedControl
        label="Tipo de movimiento"
        onChange={onTypeFilterChange}
        options={TYPE_FILTERS}
        value={typeFilter}
      />
      <SearchInput
        className="flex-1"
        id="finance-search"
        label="Buscar por concepto, comprador o categoría"
        onChange={onSearchChange}
        placeholder="Buscar por concepto, comprador o categoría…"
        value={search}
      />
      <FarmSelect
        farms={farms}
        id="finance-farm"
        label="Filtrar por finca"
        onChange={onFarmChange}
        value={selectedFarmId}
      />
      <SegmentedControl
        label="Período"
        onChange={onDateFilterChange}
        options={DATE_FILTERS}
        value={dateFilter}
      />
    </section>
  );
}
