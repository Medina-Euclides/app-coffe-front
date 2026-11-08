// Listado de fincas y lotes con búsqueda, formularios y tarjetas consistentes.
import { useMemo, useState } from 'react';
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
import ConfirmDialog from '#components/shared/ConfirmDialog';
import { useConfirm } from '#hooks/useConfirm';
import { useCrudList } from '#hooks/useCrudList';
import { useDialog } from '#hooks/useDialog';
import { useNotice } from '#hooks/useNotice';
import { filterBySearch } from '#lib/utils';

const getFarmSearchText = (farm) => `${farm.nombre || ''} ${farm.ubicacion || ''}`;
const getLotSearchText = (lot) => `${lot.nombre || ''} ${lot.variedad || ''}`;

export default function FarmsAndLots({ usuario }) {
  const userId = usuario?.id || 'default';
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
  const farmDialog = useDialog();
  const lotDialog = useDialog();
  const [lotToView, setLotToView] = useState(null);
  const { notice, isError, show: setNotice } = useNotice();
  const confirmer = useConfirm();

  const selectedFarm = farms.find(
    (farm) => String(farm.id) === String(selectedFarmId),
  );
  const farmToEdit = farmDialog.item;
  const lotToEdit = lotDialog.item;

  const farmsInSearch = useMemo(
    () => filterBySearch(farms, search, getFarmSearchText),
    [farms, search],
  );

  const lotsOfSelectedFarm = useMemo(
    () =>
      selectedFarm
        ? lots.filter((lot) => String(lot.fincaId) === String(selectedFarm.id))
        : [],
    [lots, selectedFarm],
  );
  const lotsForFarm = useMemo(
    () => filterBySearch(lotsOfSelectedFarm, search, getLotSearchText),
    [lotsOfSelectedFarm, search],
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
        onAction={() => (selectedFarm ? lotDialog.openWith(null) : farmDialog.openWith(null))}
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
lotsOfSelectedFarm.length
                    ? 'Prueba con otro nombre o variedad.'
                    : `Agrega el primer lote asociado a ${selectedFarm.nombre}.`
                }
                title={
lotsOfSelectedFarm.length
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
                    onEdit={lotDialog.openWith}
                    onToggleStatus={toggleLotStatus}
                    onView={setLotToView}
                  />
                ))}
              </div>
            )}
          </div>
        ) : farmsInSearch.length === 0 ? (
          loadError ? (
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
                onEdit={farmDialog.openWith}
                onOpenLots={handleSelectFarm}
              />
            ))}
          </div>
        )}
      </ManagementPage>

      {farmDialog.open && (
        <FarmFormDialog
          farm={farmToEdit}
          onOpenChange={(open) => {
            if (!open) farmDialog.close();
          }}
          onSave={saveFarm}
          open={farmDialog.open}
        />
      )}
      {selectedFarm && (
        lotDialog.open && (
          <LotFormDialog
            farmName={selectedFarm.nombre}
            lot={lotToEdit}
            onOpenChange={(open) => {
              if (!open) lotDialog.close();
            }}
            onSave={saveLot}
            open={lotDialog.open}
          />
        )
      )}
      <ConfirmDialog {...confirmer.dialogProps} />
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
