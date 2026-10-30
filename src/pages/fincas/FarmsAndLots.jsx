import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import EmptyState from '#components/shared/EmptyState';
import ManagementPage from '#components/shared/ManagementPage';
import FarmCard from './components/FarmCard.jsx';
import FarmFormDialog from './components/FarmFormDialog.jsx';
import LotCard from './components/LotCard.jsx';
import LotFormDialog from './components/LotFormDialog.jsx';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import { api } from '#services/api';
import {
  guardarCacheFincasYLotes,
  guardarFincaActiva,
} from '#services/farmStorage';
import { leerLocal } from '#lib/storage';

function cargarListaGuardada(key) {
  const saved = leerLocal(key, []);
  return Array.isArray(saved) ? saved : [];
}

export default function FarmsAndLots({ usuario }) {
  const userId = usuario?.id || 'default';
  const [farms, setFarms] = useState(() =>
    cargarListaGuardada(`cafesmart_fincas_${userId}`),
  );
  const [lots, setLots] = useState(() =>
    cargarListaGuardada(`cafesmart_lotes_${userId}`),
  );
  const [selectedFarmId, setSelectedFarmId] = useState(() =>
    localStorage.getItem(`cafesmart_finca_activa_${userId}`),
  );
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState(null);
  const [lotToEdit, setLotToEdit] = useState(null);
  const [lotToView, setLotToView] = useState(null);
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([api.farms.list(), api.lots.list()])
      .then(([loadedFarms, loadedLots]) => {
        if (!active) return;
        setFarms(loadedFarms);
        setLots(loadedLots);
        guardarCacheFincasYLotes(userId, loadedFarms, loadedLots);
        setSelectedFarmId((currentId) =>
          loadedFarms.some((farm) => String(farm.id) === String(currentId))
            ? currentId
            : null,
        );
      })
      .catch((error) => {
        if (active) {
          console.error('Error al cargar fincas y lotes:', error);
          setNotice(error.message || 'No se pudieron cargar las fincas y los lotes.');
          setNoticeIsError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const selectedFarm = farms.find(
    (farm) => String(farm.id) === String(selectedFarmId),
  );
  const farmsInSearch = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? farms.filter((farm) =>
          `${farm.nombre || ''} ${farm.ubicacion || ''}`
            .toLocaleLowerCase()
            .includes(query),
        )
      : farms;
  }, [farms, search]);
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
    if (data.name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    if (
      farms.some(
        (farm) =>
          String(farm.id) !== String(farmToEdit?.id) &&
          String(farm.nombre || '').trim().toLocaleLowerCase() ===
            data.name.toLocaleLowerCase(),
      )
    ) {
      return 'Ya existe una finca con ese nombre.';
    }

    try {
      const savedFarm = farmToEdit
        ? await api.farms.update(farmToEdit.id, data)
        : await api.farms.create(data);
      const nextFarms = farmToEdit
        ? farms.map((farm) =>
            String(farm.id) === String(savedFarm.id) ? savedFarm : farm,
          )
        : [...farms, savedFarm];
      setFarms(nextFarms);
      guardarCacheFincasYLotes(userId, nextFarms, lots);
      setNotice(farmToEdit ? 'Finca actualizada.' : 'Finca agregada.');
      setNoticeIsError(false);
      setFarmToEdit(null);
      return '';
    } catch (error) {
      console.error('Error al guardar la finca:', error);
      return error.message || 'No se pudo guardar la finca. Inténtalo de nuevo.';
    }
  };

  const saveLot = async ({ nombre, variedad, hectareas, description }) => {
    if (!selectedFarm) return 'Selecciona primero una finca.';
    if (nombre.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    if (
      hectareas !== null &&
      (!Number.isFinite(hectareas) || hectareas <= 0)
    ) {
      return 'El área debe ser un número mayor que cero.';
    }
    if (
      lots.some(
        (lot) =>
          String(lot.id) !== String(lotToEdit?.id) &&
          String(lot.fincaId) === String(selectedFarm.id) &&
          String(lot.nombre || '').trim().toLocaleLowerCase() ===
            nombre.toLocaleLowerCase(),
      )
    ) {
      return 'Ya existe un lote con ese nombre en esta finca.';
    }

    const data = {
      name: nombre,
      coffee_variety: variedad,
      area_hectares: hectareas,
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
      setLots(nextLots);
      guardarCacheFincasYLotes(userId, farms, nextLots);
      setNotice(lotToEdit ? 'Lote actualizado.' : 'Lote agregado a la finca.');
      setNoticeIsError(false);
      setLotToEdit(null);
      return '';
    } catch (error) {
      console.error('Error al guardar el lote:', error);
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
      setLots(nextLots);
      guardarCacheFincasYLotes(userId, farms, nextLots);
      setNotice(isActive ? 'Lote desactivado.' : 'Lote reactivado.');
      setNoticeIsError(false);
    } catch (error) {
      console.error('Error al cambiar el estado del lote:', error);
      setNotice(error.message || 'No se pudo actualizar el estado del lote.');
      setNoticeIsError(true);
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
        {notice && (
          <p
            aria-live="polite"
            className={`rounded-lg border px-3 py-2 text-sm ${
              noticeIsError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]'
            }`}
            role="status"
          >
            {notice}
          </p>
        )}
        {loading ? (
          <p aria-live="polite" className="py-8 text-center text-sm text-[#68766b]" role="status">
            Cargando fincas y lotes…
          </p>
        ) : selectedFarm ? (
          <div className="space-y-5">
            <Button
              className="min-h-10 rounded-lg px-2 text-[#526254] hover:bg-[#edf3e9] hover:text-[#214b32]"
              onClick={() => {
                setSelectedFarmId(null);
                localStorage.removeItem(`cafesmart_finca_activa_${userId}`);
                setSearch('');
              }}
              type="button"
              variant="ghost"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Todas las fincas
            </Button>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#294533]">
                Lotes de {selectedFarm.nombre}
              </h2>
              <p className="text-sm text-[#748074]">
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
                    farmName={selectedFarm.nombre}
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
          noticeIsError && farms.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#68766b]">
              No se pudo consultar la lista de fincas. Intenta de nuevo cuando
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
                lotCount={
                  lots.filter(
                    (lot) => String(lot.fincaId) === String(farm.id),
                  ).length
                }
                onEdit={openEditFarmDialog}
                onView={(item) => {
                  setSelectedFarmId(item.id);
                  guardarFincaActiva(userId, item.id);
                  setSearch('');
                }}
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
            <DialogTitle className="text-lg font-semibold text-[#183d2b]">
              {lotToView?.nombre}
            </DialogTitle>
            <DialogDescription>
              Lote de {selectedFarm?.nombre}
            </DialogDescription>
          </DialogHeader>
          {lotToView && (
            <dl className="space-y-3 rounded-xl bg-[#f7f8f3] p-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#748074]">
                  Variedad
                </dt>
                <dd className="mt-1 font-medium text-[#294533]">
                  {lotToView.variedad || 'No especificada'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#748074]">
                  Área
                </dt>
                <dd className="mt-1 font-medium text-[#294533]">
                  {lotToView.hectareas
                    ? `${new Intl.NumberFormat('es-CO', {
                        maximumFractionDigits: 2,
                      }).format(Number(lotToView.hectareas))} ha`
                    : 'No especificada'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[#748074]">
                  Estado
                </dt>
                <dd className="mt-1 font-medium text-[#294533]">
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
