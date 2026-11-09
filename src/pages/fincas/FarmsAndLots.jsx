// Fincas y lotes: listado de fincas y, al abrir una, sus lotes. Con búsqueda,
// formularios, detalle del lote y activar/desactivar.
import ConfirmDialog from '#components/shared/ConfirmDialog';
import LoadingState from '#components/shared/LoadingState';
import ManagementPage from '#components/shared/ManagementPage';
import NoticeBanner from '#components/shared/NoticeBanner';
import FarmFormDialog from './components/FarmFormDialog.jsx';
import FarmsView from './components/FarmsView.jsx';
import LotDetailDialog from './components/LotDetailDialog.jsx';
import LotFormDialog from './components/LotFormDialog.jsx';
import LotsView from './components/LotsView.jsx';
import { useFarmsAndLots } from './hooks/useFarmsAndLots.js';

const closeOnFalse = (dialog) => (open) => {
  if (!open) dialog.close();
};

export default function FarmsAndLots({ usuario }) {
  const page = useFarmsAndLots(usuario?.id || 'default');
  const { selectedFarm, farmDialog, lotDialog } = page;

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
        onSearchChange={page.setSearch}
        searchLabel={selectedFarm ? 'lotes por nombre o variedad' : 'fincas'}
        searchValue={page.search}
        title={selectedFarm ? selectedFarm.nombre : 'Fincas y lotes'}
      >
        <NoticeBanner isError={page.isError} message={page.notice} />
        {page.loading ? (
          <LoadingState>Cargando fincas y lotes…</LoadingState>
        ) : selectedFarm ? (
          <LotsView
            farm={selectedFarm}
            hasLots={page.lotsOfSelectedFarm.length > 0}
            lots={page.lotsForFarm}
            onBack={page.showAllFarms}
            onEdit={lotDialog.openWith}
            onToggleStatus={page.toggleLotStatus}
            onView={page.setLotToView}
          />
        ) : (
          <FarmsView
            allFarmsCount={page.farms.length}
            farms={page.farmsInSearch}
            loadError={page.loadError}
            lots={page.lots}
            onEdit={farmDialog.openWith}
            onOpenLots={page.selectFarm}
            onRetry={page.retry}
          />
        )}
      </ManagementPage>

      {farmDialog.open && (
        <FarmFormDialog
          farm={farmDialog.item}
          onOpenChange={closeOnFalse(farmDialog)}
          onSave={page.saveFarm}
          open
        />
      )}
      {selectedFarm && lotDialog.open && (
        <LotFormDialog
          farmName={selectedFarm.nombre}
          lot={lotDialog.item}
          onOpenChange={closeOnFalse(lotDialog)}
          onSave={page.saveLot}
          open
        />
      )}
      <ConfirmDialog {...page.confirmer.dialogProps} />
      <LotDetailDialog
        farmName={selectedFarm?.nombre}
        lot={page.lotToView}
        onOpenChange={() => page.setLotToView(null)}
      />
    </>
  );
}
