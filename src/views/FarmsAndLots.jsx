import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import EmptyState from '../components/gestion-finca/EmptyState.jsx';
import ManagementPage from '../components/gestion-finca/ManagementPage.jsx';
import FarmCard from '../components/farms/FarmCard.jsx';
import FarmFormDialog from '../components/farms/FarmFormDialog.jsx';
import LotCard from '../components/farms/LotCard.jsx';
import LotFormDialog from '../components/farms/LotFormDialog.jsx';
import { Button } from '../components/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.jsx';
import { obtenerFechaLocal } from '../utils/formatters.js';
import { leerLocal } from '../utils/storage.js';

function cargarLista(clave) {
  const guardada = leerLocal(clave, []);
  return Array.isArray(guardada) ? guardada : [];
}

export default function FarmsAndLots({ usuario }) {
  const userId = usuario?.id || 'default';
  const farmsKey = `cafesmart_fincas_${userId}`;
  const lotsKey = `cafesmart_lotes_${userId}`;
  const [farms, setFarms] = useState(() => cargarLista(farmsKey));
  const [lots, setLots] = useState(() => cargarLista(lotsKey));
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [search, setSearch] = useState('');
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState(null);
  const [lotToEdit, setLotToEdit] = useState(null);
  const [lotToView, setLotToView] = useState(null);
  const [notice, setNotice] = useState('');

  const selectedFarm = farms.find(
    (farm) => String(farm.id) === String(selectedFarmId),
  );
  const farmsInSearch = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? farms.filter((farm) =>
          String(farm.nombre || '').toLocaleLowerCase().includes(query),
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

  const persistList = (key, nextItems, setter, message) => {
    try {
      localStorage.setItem(key, JSON.stringify(nextItems));
      setter(nextItems);
      setNotice(message);
      return true;
    } catch (error) {
      console.error('No se pudieron guardar los cambios de fincas y lotes:', error);
      setNotice('No se pudieron guardar los cambios. Revisa el espacio disponible en el dispositivo.');
      return false;
    }
  };

  const saveFarm = (name) => {
    if (name.length < 2) return 'Escribe un nombre de al menos 2 caracteres.';
    if (
      farms.some(
        (farm) =>
          String(farm.id) !== String(farmToEdit?.id) &&
          String(farm.nombre || '').trim().toLocaleLowerCase() ===
            name.toLocaleLowerCase(),
      )
    ) {
      return 'Ya existe una finca con ese nombre.';
    }

    const nextFarms = farmToEdit
      ? farms.map((farm) =>
          farm.id === farmToEdit.id ? { ...farm, nombre: name } : farm,
        )
      : [...farms, { id: Date.now(), nombre: name }];
    if (
      !persistList(
        farmsKey,
        nextFarms,
        setFarms,
        farmToEdit ? 'Finca actualizada.' : 'Finca agregada.',
      )
    ) {
      return 'No se pudo guardar la finca. Inténtalo de nuevo.';
    }
    setFarmToEdit(null);
    return '';
  };

  const saveLot = ({ nombre, variedad, hectareas }) => {
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

    const nextLots = lotToEdit
      ? lots.map((lot) =>
          lot.id === lotToEdit.id
            ? { ...lot, nombre, variedad, hectareas }
            : lot,
        )
      : [
          ...lots,
          {
            id: Date.now(),
            fincaId: selectedFarm.id,
            nombre,
            variedad,
            hectareas,
            estado: 'activo',
            fechaCreacion: obtenerFechaLocal(),
            fechaDesactivacion: null,
            fechaReactivacion: null,
          },
        ];
    if (
      !persistList(
        lotsKey,
        nextLots,
        setLots,
        lotToEdit ? 'Lote actualizado.' : 'Lote agregado a la finca.',
      )
    ) {
      return 'No se pudo guardar el lote. Inténtalo de nuevo.';
    }
    setLotToEdit(null);
    return '';
  };

  const toggleLotStatus = (lot) => {
    const isActive = lot.estado !== 'inactivo';
    const nextStatus = isActive ? 'inactivo' : 'activo';
    const message = isActive
      ? `¿Desactivar el lote “${lot.nombre}”? Podrás consultarlo y reactivarlo después.`
      : `¿Reactivar el lote “${lot.nombre}”?`;
    if (!window.confirm(message)) return;

    const date = obtenerFechaLocal();
    const nextLots = lots.map((item) =>
      item.id === lot.id
        ? {
            ...item,
            estado: nextStatus,
            ...(isActive
              ? { fechaDesactivacion: date }
              : { fechaReactivacion: date }),
          }
        : item,
    );
    persistList(
      lotsKey,
      nextLots,
      setLots,
      isActive ? 'Lote desactivado.' : 'Lote reactivado.',
    );
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
              notice.startsWith('No se pud')
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-[#dce8d9] bg-[#f0f5ed] text-[#426548]'
            }`}
            role="status"
          >
            {notice}
          </p>
        )}
        {selectedFarm ? (
          <div className="space-y-5">
            <Button
              className="min-h-10 rounded-lg px-2 text-[#526254] hover:bg-[#edf3e9] hover:text-[#214b32]"
              onClick={() => {
                setSelectedFarmId(null);
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
          <EmptyState
            description={
              farms.length
                ? 'Prueba con otro nombre de finca.'
                : 'Registra tus fincas para comenzar a organizar sus lotes.'
            }
            title={farms.length ? 'No encontramos fincas' : 'Aún no hay fincas'}
          />
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
