// Datos y acciones de Fincas y lotes: listas, finca abierta, búsqueda, formularios,
// guardado con validación y activar/desactivar lotes.
import { useDeferredValue, useMemo, useState } from 'react';
import { useConfirm } from '#hooks/useConfirm';
import { useCrudList } from '#hooks/useCrudList';
import { useDialog } from '#hooks/useDialog';
import { useNotice } from '#hooks/useNotice';
import { validateFarm, validateLot } from '#lib/domain/farms';
import { filterBySearch } from '#lib/utils';
import { api } from '#services/api';
import { borrarFincaActiva, guardarFincaActiva, leerFincaActiva } from '#services/farmStorage';

const getFarmSearchText = (farm) => `${farm.nombre || ''} ${farm.ubicacion || ''}`;
const getLotSearchText = (lot) => `${lot.nombre || ''} ${lot.variedad || ''}`;

export function useFarmsAndLots(userId) {
  const farmsKey = `farms:${userId}`;
  const lotsKey = `lots:${userId}`;

  const farmsList = useCrudList(farmsKey, api.farms.list);
  const lotsList = useCrudList(lotsKey, api.lots.list);
  const farms = farmsList.data;
  const lots = lotsList.data;
  const loading = farmsList.loading || lotsList.loading;
  const loadError = farmsList.error || lotsList.error;

  const [selectedFarmId, setSelectedFarmId] = useState(() => leerFincaActiva(userId) || null);
  const [search, setSearch] = useState('');
  // Búsqueda diferida: el input se siente inmediato, pero el filtrado de listas
  // costosas no bloquea cada pulsación de tecla (use-deferred-value).
  const deferredSearch = useDeferredValue(search);
  const farmDialog = useDialog();
  const lotDialog = useDialog();
  const [lotToView, setLotToView] = useState(null);
  const { notice, isError, show: setNotice } = useNotice();
  const confirmer = useConfirm();

  // Búsqueda por ID en O(1) con Map en lugar de .find() en cada render.
  const farmById = useMemo(
    () => new Map(farms.map((f) => [String(f.id), f])),
    [farms],
  );
  const selectedFarm = farmById.get(String(selectedFarmId)) || null;
  const farmToEdit = farmDialog.item;
  const lotToEdit = lotDialog.item;

  const farmsInSearch = useMemo(
    () => filterBySearch(farms, deferredSearch, getFarmSearchText),
    [farms, deferredSearch],
  );

  const lotsOfSelectedFarm = useMemo(
    () =>
      selectedFarm
        ? lots.filter((lot) => String(lot.fincaId) === String(selectedFarm.id))
        : [],
    [lots, selectedFarm],
  );
  const lotsForFarm = useMemo(
    () => filterBySearch(lotsOfSelectedFarm, deferredSearch, getLotSearchText),
    [lotsOfSelectedFarm, deferredSearch],
  );

  const saveFarm = async (data) => {
    const validationError = validateFarm(data, farms, farmToEdit?.id);
    if (validationError) return validationError;

    try {
      farmsList.upsert(
        farmToEdit
          ? await api.farms.update(farmToEdit.id, data)
          : await api.farms.create(data),
      );
      setNotice(farmToEdit ? 'Finca actualizada.' : 'Finca agregada.', false);
      farmDialog.close();
      return '';
    } catch (error) {
      console.error('Error al guardar la finca:', error);
      setNotice(error.message || 'No se pudo guardar la finca. Inténtalo de nuevo.', true);
      return error.message || 'No se pudo guardar la finca. Inténtalo de nuevo.';
    }
  };

  const saveLot = async ({
    nombre,
    variedad,
    hectareas,
    plantCount,
    description,
  }) => {
    if (!selectedFarm) return 'Selecciona primero una finca.';
    const validationError = validateLot(
      { nombre, hectareas, plantCount },
      lots,
      selectedFarm.id,
      lotToEdit?.id,
    );
    if (validationError) return validationError;

    const data = {
      name: nombre,
      coffee_variety: variedad,
      area_hectares: hectareas,
      plant_count: plantCount,
      description,
      ...(lotToEdit ? {} : { id_farm: selectedFarm.id }),
    };
    try {
      lotsList.upsert(
        lotToEdit
          ? await api.lots.update(lotToEdit.id, data)
          : await api.lots.create(data),
      );
      setNotice(lotToEdit ? 'Lote actualizado.' : 'Lote agregado a la finca.', false);
      lotDialog.close();
      return '';
    } catch (error) {
      console.error('Error al guardar el lote:', error);
      setNotice(error.message || 'No se pudo guardar el lote. Inténtalo de nuevo.', true);
      return error.message || 'No se pudo guardar el lote. Inténtalo de nuevo.';
    }
  };

  const toggleLotStatus = async (lot) => {
    const isActive = lot.estado !== 'inactivo';
    const confirmed = await confirmer.confirm(
      isActive
        ? {
            title: `¿Desactivar el lote “${lot.nombre}”?`,
            description: 'Podrás consultarlo y reactivarlo después.',
            confirmLabel: 'Desactivar',
          }
        : { title: `¿Reactivar el lote “${lot.nombre}”?`, confirmLabel: 'Reactivar', tone: 'primary' },
    );
    if (!confirmed) return;

    try {
      lotsList.upsert(await api.lots.update(lot.id, { is_active: !isActive }));
      setNotice(isActive ? 'Lote desactivado.' : 'Lote reactivado.', false);
    } catch (error) {
      console.error('Error al cambiar el estado del lote:', error);
      setNotice(error.message || 'No se pudo actualizar el estado del lote.', true);
    }
  };

  const selectFarm = (farm) => {
    setSelectedFarmId(farm.id);
    guardarFincaActiva(userId, farm.id);
    setSearch('');
    setLotToView(null);
  };

  const showAllFarms = () => {
    setSelectedFarmId(null);
    borrarFincaActiva(userId);
    setSearch('');
  };

  // Recarga en paralelo las listas independientes (async-parallel).
  const retry = async () => {
    await Promise.all([farmsList.refetch(), lotsList.refetch()]);
  };

  return {
    farms,
    lots,
    loading,
    loadError,
    retry,
    selectedFarm,
    selectFarm,
    showAllFarms,
    search,
    setSearch,
    farmsInSearch,
    lotsOfSelectedFarm,
    lotsForFarm,
    farmDialog,
    lotDialog,
    lotToView,
    setLotToView,
    notice,
    isError,
    confirmer,
    saveFarm,
    saveLot,
    toggleLotStatus,
  };
}
