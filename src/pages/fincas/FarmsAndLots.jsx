// Listado de fincas y lotes con búsqueda, formularios y tarjetas consistentes.
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import EmptyState from '#components/shared/EmptyState';
import NoticeBanner from '#components/shared/NoticeBanner';
import ManagementPage from '#components/shared/ManagementPage';
import FarmFormDialog from './components/FarmFormDialog.jsx';
import LotFormDialog from './components/LotFormDialog.jsx';
import FarmCard from './components/FarmCard.jsx';
import LotCard from './components/LotCard.jsx';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { api } from '#services/api';
import { borrarFincaActiva, guardarFincaActiva, leerFincaActiva } from '#services/farmStorage';
import { formatoArea, formatoConteo } from '#lib/formatters';
import { validateFarm, validateLot } from '#lib/domain/farms';
import { useApiList } from '#hooks/useApiList';
import { useSearchFilter } from '#hooks/useSearchFilter';
import { useNotice } from '#hooks/useNotice';

export default function FarmsAndLots({ usuario }) {
  const userId = usuario?.id || 'default';
  const farmsKey = `farms:${userId}`;
  const lotsKey = `lots:${userId}`;

  const {
    data: farmsRaw,
    setData: setFarmsRaw,
    loading: farmsLoading,
    error: farmsError,
  } = useApiList(
    farmsKey,
    () => api.farms.list(),
  );

  const {
    data: lotsRaw,
    setData: setLotsRaw,
    loading: lotsLoading,
    error: lotsError,
  } = useApiList(
    lotsKey,
    () => api.lots.list(),
  );

  const [selectedFarmId, setSelectedFarmId] = useState(() => leerFincaActiva(userId) || null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(farmsLoading || lotsLoading);
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState(null);
  const [lotToEdit, setLotToEdit] = useState(null);
  const [lotToView, setLotToView] = useState(null);
  const { notice, isError, show: setNotice } = useNotice();

  // Sincroniza loading cuando terminan ambas cargas.
  useEffect(() => {
    setLoading(farmsLoading || lotsLoading);
  }, [farmsLoading, lotsLoading]);

  const farms = useMemo(() => farmsRaw || [], [farmsRaw]);
  const lots = useMemo(() => lotsRaw || [], [lotsRaw]);

  const selectedFarm = farms.find(
    (farm) => String(farm.id) === String(selectedFarmId),
  );

  const { filtered: farmsInSearch } = useSearchFilter(
    farms,
    (farm) => `${farm.nombre || ''} ${farm.ubicacion || ''}`,
  );

  const lotsForFarm = useMemo(() => {
    if (!selectedFarm) return [];
    const query = search.trim().toLocaleLowerCase();
    return lots.filter(
      (lot) =>
        String(lot.fincaId) === String(selectedFarm.id) &&
        (!query ||
          `${lot.nombre || ''} ${lot.variedad || ''}`
            .toLocaleLowerCase()
            .includes(query)),
    );
  }, [lots, search, selectedFarm]);

  const saveFarm = async (data) => {
    const validationError = validateFarm(data, farms, farmToEdit?.id);
    if (validationError) return validationError;

    try {
      const savedFarm = farmToEdit
        ? await api.farms.update(farmToEdit.id, data)
        : await api.farms.create(data);
      const nextFarms = farmToEdit
        ? farms.map((farm) =>
            String(farm.id) === String(savedFarm.id) ? savedFarm : farm,
          )
        : [...farms, savedFarm];
      setFarmsRaw(nextFarms);
      setNotice(farmToEdit ? 'Finca actualizada.' : 'Finca agregada.', false);
      setFarmToEdit(null);
      setFarmDialogOpen(false);
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
      const savedLot = lotToEdit
        ? await api.lots.update(lotToEdit.id, data)
        : await api.lots.create(data);
      const nextLots = lotToEdit
        ? lots.map((lot) =>
            String(lot.id) === String(savedLot.id) ? savedLot : lot,
          )
        : [...lots, savedLot];
      setLotsRaw(nextLots);
      setNotice(lotToEdit ? 'Lote actualizado.' : 'Lote agregado a la finca.', false);
      setLotToEdit(null);
      setLotDialogOpen(false);
      return '';
    } catch (error) {
      console.error('Error al guardar el lote:', error);
      setNotice(error.message || 'No se pudo guardar el lote. Inténtalo de nuevo.', true);
      return error.message || 'No se pudo guardar el lote. Inténtalo de nuevo.';
    }
  };

  const toggleLotStatus = async (lot) => {
    const isActive = lot.estado !== 'inactivo';
    const message = isActive
      ? `¿Desactivar el lote “${lot.nombre}”? Podrás consultarlo y reactivarlo después.`
      : `¿Reactivar el lote “${lot.nombre}”?`;
    if (!window.confirm(message)) return;

    try {
      const updatedLot = await api.lots.update(lot.id, {
        is_active: !isActive,
      });
      const nextLots = lots.map((item) =>
        String(item.id) === String(updatedLot.id) ? updatedLot : item,
      );
      setLotsRaw(nextLots);
      setNotice(isActive ? 'Lote desactivado.' : 'Lote reactivado.', false);
    } catch (error) {
      console.error('Error al cambiar el estado del lote:', error);
      setNotice(error.message || 'No se pudo actualizar el estado del lote.', true);
    }
  };

  const openNewFarmDialog = () => {
    setFarmToEdit(null);
    setFarmDialogOpen(true);
  };

  const openEditFarmDialog = (farm) => {
    setFarmToEdit(farm);
    setFarmDialogOpen(true);
  };

  const openNewLotDialog = () => {
    setLotToEdit(null);
    setLotDialogOpen(true);
  };

  const openEditLotDialog = (lot) => {
    setLotToEdit(lot);
    setLotDialogOpen(true);
  };

  const handleSelectFarm = (farm) => {
    setSelectedFarmId(farm.id);
    guardarFincaActiva(userId, farm.id);
    setSearch('');
    setLotToView(null);
  };

  return (
    <>
      <ManagementPage
        actionLabel={selectedFarm ? 'Agregar lote' : 'Agregar finca'}
        description={
          selectedFarm
            ? `Consulta y organiza los lotes que pertenecen a ${selectedFarm.nombre}.`
            : 'Administra tus fincas y organiza los lotes que pertenecen a cada una.'
        }
        onAction={selectedFarm ? openNewLotDialog : openNewFarmDialog}
        onSearchChange={setSearch}
        searchLabel={selectedFarm ? 'lotes por nombre o variedad' : 'fincas'}
        searchValue={search}
        title={selectedFarm ? selectedFarm.nombre : 'Fincas y lotes'}
      >
        <NoticeBanner message={notice} isError={isError} />
        {loading ? (
          <p aria-live="polite" className="py-8 text-center text-sm text-muted-foreground" role="status">
            Cargando fincas y lotes…
          </p>
        ) : selectedFarm ? (
          <div className="space-y-5">
            <Button
              className="min-h-10 rounded-lg px-2 text-ink-soft hover:bg-tint hover:text-primary"
              onClick={() => {
                setSelectedFarmId(null);
                borrarFincaActiva(userId);
                setSearch('');
              }}
              type="button"
              variant="ghost"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Todas las fincas
            </Button>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl text-ink-soft">
                Lotes de {selectedFarm.nombre}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lotsForFarm.length} {lotsForFarm.length === 1 ? 'lote' : 'lotes'}
              </p>
            </div>
            {lotsForFarm.length === 0 ? (
              <EmptyState
                description={
                  lots.some(
                    (lot) =>
                      String(lot.fincaId) === String(selectedFarm.id),
                  )
                    ? 'Prueba con otro nombre o variedad.'
                    : `Agrega el primer lote asociado a ${selectedFarm.nombre}.`
                }
                title={
                  lots.some(
                    (lot) =>
                      String(lot.fincaId) === String(selectedFarm.id),
                  )
                    ? 'No encontramos lotes'
                    : 'Esta finca aún no tiene lotes'
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {lotsForFarm.map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                    onEdit={openEditLotDialog}
                    onToggleStatus={toggleLotStatus}
                    onView={setLotToView}
                  />
                ))}
              </div>
            )}
          </div>
        ) : farmsInSearch.length === 0 ? (
          farmsError || lotsError ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No se pudieron consultar las fincas y lotes. Intenta de nuevo cuando
              el servidor esté disponible.
            </p>
          ) : (
            <EmptyState
              description={
                farms.length
                  ? 'Prueba con otro nombre de finca.'
                  : 'Registra tus fincas para comenzar a organizar sus lotes.'
              }
              title={farms.length ? 'No encontramos fincas' : 'Aún no hay fincas'}
            />
          )
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {farmsInSearch.map((farm) => (
              <FarmCard
                farm={farm}
                key={farm.id}
                lots={lots.filter(
                  (lot) => String(lot.fincaId) === String(farm.id),
                )}
                onEdit={openEditFarmDialog}
                onOpenLots={handleSelectFarm}
              />
            ))}
          </div>
        )}
      </ManagementPage>

      {farmDialogOpen && (
        <FarmFormDialog
          farm={farmToEdit}
          onOpenChange={(open) => {
            setFarmDialogOpen(open);
            if (!open) setFarmToEdit(null);
          }}
          onSave={saveFarm}
          open={farmDialogOpen}
        />
      )}
      {selectedFarm && (
        lotDialogOpen && (
          <LotFormDialog
            farmName={selectedFarm.nombre}
            lot={lotToEdit}
            onOpenChange={(open) => {
              setLotDialogOpen(open);
              if (!open) setLotToEdit(null);
            }}
            onSave={saveLot}
            open={lotDialogOpen}
          />
        )
      )}
      <Dialog
        onOpenChange={(open) => {
          if (!open) setLotToView(null);
        }}
        open={Boolean(lotToView)}
      >
        <DialogContent className="rounded-2xl p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-2xl text-foreground">
              {lotToView?.nombre}
            </DialogTitle>
            <DialogDescription>
              Lote de {selectedFarm?.nombre}
            </DialogDescription>
          </DialogHeader>
          {lotToView && (
            <dl className="space-y-3 rounded-xl bg-muted p-4">
              <div>
                <dt className="text-sm text-muted-foreground">
                  Variedad
                </dt>
                <dd className="mt-1 font-medium text-ink-soft">
                  {lotToView.variedad || 'No especificada'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Área
                </dt>
                <dd className="mt-1 font-medium text-ink-soft">
                  {lotToView.hectareas
                    ? formatoArea(Number(lotToView.hectareas))
                    : 'No especificada'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                    Plantas de café
                </dt>
                <dd className="mt-1 font-medium text-ink-soft">
                    {lotToView.plant_count === null ||
                    lotToView.plant_count === undefined
                      ? 'No especificadas'
                      : formatoConteo(lotToView.plant_count)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                    Estado
                </dt>
                <dd className="mt-1 font-medium text-ink-soft">
                  {lotToView.estado === 'inactivo' ? 'Inactivo' : 'Activo'}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
