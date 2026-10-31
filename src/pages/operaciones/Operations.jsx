import { useState } from 'react';
import {
  ClipboardList,
  Sprout,
  UsersRound,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import EmptyState from '#components/shared/EmptyState';
import ManagementPage from '#components/shared/ManagementPage';
import OperationRecordCard from './components/OperationRecordCard.jsx';
import OperationRecordDetailsDialog from './components/OperationRecordDetailsDialog.jsx';
import OperationRecordFormDialog from './components/OperationRecordFormDialog.jsx';
import OperationsTabs from './components/OperationsTabs.jsx';
import useOperations from './useOperations.js';

export default function Operations({ usuario }) {
  const { pathname } = useLocation();
  const section = pathname.endsWith('/jornadas') ? 'jornadas' : 'recoleccion';
  const isHarvest = section === 'recoleccion';
  const userId = usuario?.id || 'default';
  const [dialog, setDialog] = useState(null);
  const {
    activities,
    defaultAgreedRate,
    filteredRecords,
    loadError,
    loading,
    lots,
    lotFilter,
    records,
    refreshWorkdays,
    saveOperation,
    search,
    setLotFilter,
    setSearch,
    workers,
  } = useOperations({ isHarvest, userId });
  const hasLoadError = Boolean(loadError);

  return (
    <>
      <ManagementPage
        actionLabel={`Registrar ${isHarvest ? 'recolección' : 'jornada'}`}
        description={
          isHarvest
            ? 'Registra y consulta el café recolectado por cada trabajador en los diferentes lotes de la finca.'
            : 'Registra y consulta las labores realizadas por los trabajadores, con su actividad, fecha y lote.'
        }
        onAction={() => {
          if (!loading && !hasLoadError) setDialog({ mode: 'create' });
        }}
        onSearchChange={setSearch}
        searchLabel={
          isHarvest
            ? 'recolecciones por trabajador o lote'
            : 'jornadas por trabajador, actividad o lote'
        }
        searchValue={search}
        title={isHarvest ? 'Recolección' : 'Jornadas laborales'}
      >
        <OperationsTabs section={section} />

        <div className="flex flex-col gap-3 rounded-2xl border border-[#e5e9e1] bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-center gap-2 text-sm text-[#68766b]">
            {isHarvest ? (
              <Sprout aria-hidden="true" className="size-4 text-[#56805a]" />
            ) : (
              <ClipboardList
                aria-hidden="true"
                className="size-4 text-[#53717c]"
              />
            )}
            <span>
              <strong className="font-semibold text-[#294533]">
                {filteredRecords.length}
              </strong>{' '}
              {isHarvest ? 'registros de recolección' : 'jornadas'}
            </span>
            <span className="rounded-full bg-[#f3f5ef] px-2 py-1 text-[11px] font-medium text-[#748074]">
              Backend Django
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#68766b]">
            <span className="shrink-0">Filtrar por lote</span>
            <select
              aria-label="Filtrar registros por lote"
              className="h-10 min-w-0 flex-1 rounded-lg border border-[#dfe5dc] bg-white px-3 text-sm text-[#294533] outline-none focus-visible:border-[#5b805e] focus-visible:ring-3 focus-visible:ring-[#5b805e]/20 sm:w-56 sm:flex-none"
              onChange={(event) => setLotFilter(event.target.value)}
              value={lotFilter}
            >
              <option value="">Todos los lotes</option>
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && (
          <p aria-live="polite" className="text-sm text-[#68766b]" role="status">
            Cargando trabajadores, lotes y registros…
          </p>
        )}
        {hasLoadError && (
          <p
            aria-live="polite"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            No se pudieron cargar los datos de operaciones: {loadError}
          </p>
        )}

        {!loading && !hasLoadError && filteredRecords.length === 0 ? (
          <EmptyState
            description={
              records.length
                ? 'Prueba con otro término de búsqueda o selecciona un lote diferente.'
                : 'Cuando registres una operación, aparecerá aquí.'
            }
            title={records.length ? 'No encontramos registros' : 'Aún no hay registros'}
          />
        ) : !loading && !hasLoadError ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRecords.map((record) => (
              <OperationRecordCard
                key={record.id}
                onEdit={(selectedRecord) =>
                  setDialog({ mode: 'edit', record: selectedRecord })
                }
                onView={(selectedRecord) =>
                  setDialog({ mode: 'view', record: selectedRecord })
                }
                record={record}
                section={section}
              />
            ))}
          </div>
        ) : null}

        <p className="flex items-center gap-2 text-xs leading-5 text-[#748074]">
          <UsersRound aria-hidden="true" className="size-4 shrink-0" />
          {isHarvest
            ? 'Cada pesaje queda vinculado a una jornada, su actividad y el lote correspondiente.'
            : 'Las labores se registran dentro de la jornada laboral de cada trabajador.'}
        </p>
      </ManagementPage>

      {(dialog?.mode === 'create' || dialog?.mode === 'edit') && (
        <OperationRecordFormDialog
          key={`${section}-${dialog.mode}-${dialog.record?.id || 'new'}`}
          activities={activities}
          defaultAgreedRate={defaultAgreedRate}
          lots={lots}
          onClose={() => setDialog(null)}
          onSave={saveOperation}
          onSaved={refreshWorkdays}
          record={dialog.record}
          section={section}
          workers={workers}
        />
      )}
      {dialog?.mode === 'view' && (
        <OperationRecordDetailsDialog
          onClose={() => setDialog(null)}
          record={dialog.record}
          section={section}
        />
      )}
    </>
  );
}
