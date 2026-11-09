// Acciones sobre las jornadas: crear, cerrar, agregar o retirar trabajadores, editar la
// labor y registrar pesajes. Actualizan la lista al instante y muestran el aviso.
import { useState } from 'react';
import { api } from '#services/api';
import {
  addWorkersToWorkday as addWorkersToWorkdayRequest,
  createWorkdayWithWorkers,
} from '#lib/domain/workdayActions';
import { mapParticipant, mapWorkday } from '#lib/domain/workdays';
import { notifyDataChanged } from '#hooks/usePendingWorkdays';

// `onSaved` se llama tras crear algo nuevo (p. ej. para limpiar los filtros).
export function useWorkdayActions({ setWorkdays, confirmer, showNotice, clearNotice, onSaved }) {
  const [busyAction, setBusyAction] = useState('');

  const saveWorkday = async (payload, context) => {
    const { createdWorkday, savedParticipants } =
      await createWorkdayWithWorkers(payload, context);

    setWorkdays((currentWorkdays) => [
      ...mapWorkday({
        ...createdWorkday,
        participants: savedParticipants,
        farm_name: context.farm.nombre || context.farm.name,
      }),
      ...currentWorkdays,
    ]);
    onSaved();
    showNotice('La jornada laboral se registró correctamente.');
  };

  const closeWorkday = async (workday) => {
    const confirmed = await confirmer.confirm({
      title: '¿Cerrar esta jornada?',
      description: 'Después de cerrarla no se podrán agregar ni modificar registros.',
      confirmLabel: 'Cerrar jornada',
    });
    if (!confirmed) return;

    setBusyAction(`close:${workday.id}`);
    clearNotice();
    try {
      await api.workdays.close(workday.id);
      setWorkdays((current) =>
        current.map((participant) =>
          String(participant.workdayId) === String(workday.id)
            ? { ...participant, workdayStatus: 'cerrada' }
            : participant,
        ),
      );
      showNotice('La jornada se cerró correctamente.');
      // La campanita de notificaciones baja su contador.
      notifyDataChanged();
    } catch (error) {
      console.error('Error al cerrar la jornada:', error);
      showNotice(error.message || 'No se pudo cerrar la jornada.', true);
    } finally {
      setBusyAction('');
    }
  };

  const addWorkersToWorkday = async (workday, context) => {
    if (workday.status !== 'abierta') {
      throw new Error('No se pueden agregar trabajadores a una jornada cerrada.');
    }

    const savedParticipants = await addWorkersToWorkdayRequest(workday, context);

    const mappedParticipants = mapWorkday({
      id: workday.id,
      farm: workday.farmId,
      farm_name: workday.farmName,
      date: workday.date,
      status: workday.status,
      participants: savedParticipants,
    });
    const mappedIds = new Set(
      mappedParticipants.map((participant) => String(participant.id)),
    );
    setWorkdays((current) => [
      ...mappedParticipants,
      ...current.filter(
        (participant) => !mappedIds.has(String(participant.id)),
      ),
    ]);
    showNotice(
      `${savedParticipants.length} ${savedParticipants.length === 1 ? 'trabajador agregado' : 'trabajadores agregados'} a la jornada.`,
    );
  };

  const updateWorkdayLabor = async (workday, data) => {
    if (workday.status !== 'abierta') {
      throw new Error('No se puede modificar una jornada cerrada.');
    }

    try {
      const updatedWorkday = await api.workdays.updateLabor(workday.id, data);
      const updatedParticipants = mapWorkday(updatedWorkday);
      setWorkdays((current) => [
        ...updatedParticipants,
        ...current.filter(
          (participant) =>
            String(participant.workdayId) !== String(workday.id),
        ),
      ]);
      showNotice('La jornada y los datos de sus trabajadores se actualizaron.');
    } catch (error) {
      console.error('Error al actualizar jornada completa:', error);
      throw error;
    }
  };

  const cancelParticipation = async (participant) => {
    const confirmed = await confirmer.confirm({
      title: `¿Retirar a ${participant.workerName || 'este trabajador'} de la jornada?`,
      confirmLabel: 'Retirar',
    });
    if (!confirmed) return;

    setBusyAction(`cancel:${participant.id}`);
    clearNotice();
    try {
      await api.workdayWorkers.cancel(participant.id);
      setWorkdays((current) =>
        current.map((item) =>
          String(item.id) === String(participant.id)
            ? { ...item, settlementStatus: 'anulado' }
            : item,
        ),
      );
      showNotice(
        `${participant.workerName || 'El trabajador'} fue retirado de la jornada.`,
      );
    } catch (error) {
      console.error('Error al retirar al trabajador de la jornada:', error);
      showNotice(
        error.message || 'No se pudo retirar al trabajador de la jornada.',
        true,
      );
    } finally {
      setBusyAction('');
    }
  };

  const saveHarvestRecord = (record, detail) => {
    setWorkdays((currentWorkdays) =>
      currentWorkdays.map((workday) => {
        if (
          String(workday.workdayId) !== detail.workdayId ||
          String(workday.workerId) !== detail.workerId
        ) {
          return workday;
        }

        const hasDetail = workday.details.some(
          (item) => String(item.id) === detail.id,
        );
        const details = hasDetail
          ? workday.details.map((item) =>
              String(item.id) === detail.id
                ? {
                    ...item,
                    harvest_records: [...(item.harvest_records || []), record],
                  }
                : item,
            )
          : [...workday.details, { ...detail, harvest_records: [record] }];

        return mapParticipant(
          {
            id: workday.workdayId,
            farm: workday.farmId,
            farm_name: workday.farmName,
            date: workday.date,
          },
          {
            id: workday.id,
            worker: workday.workerId,
            worker_name: workday.workerName,
            payment_mode: workday.isPerKilogram ? 'kg' : 'jornal',
            agreed_rate: workday.rate,
            details,
          },
        );
      }),
    );
    onSaved();
    showNotice('El pesaje de recolección se registró correctamente.');
  };

  return {
    busyAction,
    saveWorkday,
    closeWorkday,
    addWorkersToWorkday,
    updateWorkdayLabor,
    cancelParticipation,
    saveHarvestRecord,
  };
}
