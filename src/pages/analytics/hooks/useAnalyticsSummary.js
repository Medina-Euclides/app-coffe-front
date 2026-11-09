// Datos de la página de analíticas: fincas, resumen del periodo para la finca elegida
// (del servidor o calculado en el dispositivo) y las series listas para los gráficos.
import { useCallback, useMemo, useState } from 'react';
import { useApiList } from '#hooks/useApiList';
import { useApiResource } from '#hooks/useApiResource';
import { api } from '#services/api';
import { formatBucket, periods } from '../analyticsFormat.js';

export function useAnalyticsSummary(userId) {
  // Abre con «Todas las fincas» para cuadrar con el resumen de Inicio.
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [period, setPeriod] = useState('month');
  const {
    data: farms,
    loading: farmsLoading,
    error: farmsError,
    refetch: refetchFarms,
  } = useApiList(`farms:${userId}`, api.farms.list);
  // Al sincronizar, el resumen local se reemplaza por el del servidor.
  const fetchSummary = useCallback(
    () => api.analytics.summary({ farmId: selectedFarmId || undefined, period }),
    [period, selectedFarmId],
  );
  const {
    data: summary,
    error,
    refetch: refetchSummary,
  } = useApiResource(`analytics:${selectedFarmId}:${period}`, fetchSummary, {
    enabled: !farmsLoading && !farmsError,
  });

  // Mientras llega el resumen nuevo no se muestra el del filtro anterior.
  const activeSummary =
    summary && summary.period === period && String(summary.farm_id || '') === selectedFarmId
      ? summary
      : null;
  const productionSeries = activeSummary?.production_series;

  const productionData = useMemo(
    () =>
      (productionSeries?.points || []).map((point) => ({
        ...point,
        label: formatBucket(point, period),
        total_quantity_kg: Number(point.total_quantity_kg) || 0,
      })),
    [period, productionSeries],
  );
  const lotProductionData = useMemo(
    () =>
      (activeSummary?.production_by_lot || [])
        .map((lot) => ({ ...lot, total_quantity_kg: Number(lot.total_quantity_kg) || 0 }))
        .sort((first, second) => second.total_quantity_kg - first.total_quantity_kg),
    [activeSummary],
  );

  return {
    farms,
    farmsLoading,
    farmsError,
    refetchFarms,
    selectedFarmId,
    setSelectedFarmId,
    period,
    setPeriod,
    periodOption: periods.find((option) => option.value === period) || periods[1],
    summary: activeSummary,
    error,
    refetchSummary,
    loading: farmsLoading || (!farmsError && !error && !activeSummary),
    productionSeries,
    productionData,
    lotProductionData,
    expenses: activeSummary?.expenses_by_category || [],
    totalExpenses: Number(activeSummary?.financial_summary?.total_expenses) || 0,
  };
}
