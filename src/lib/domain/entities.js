// Lectura tolerante de ids y nombres: la API, la caché local y los datos antiguos
// guardan referencias como id suelto o como objeto anidado, con nombres de campo distintos.

// Id de una referencia que puede venir como objeto ({ id }) o como valor suelto.
export function getReferenceId(reference) {
  if (reference && typeof reference === 'object') return reference.id;
  return reference;
}

// Igual que getReferenceId, pero siempre como texto ('' si no hay).
export function getId(value) {
  if (value && typeof value === 'object') return String(value.id ?? '');
  return value == null ? '' : String(value);
}

// Primer id presente entre varios campos candidatos (objeto o valor suelto).
function firstId(values, objectKeys) {
  for (const value of values) {
    if (value && typeof value === 'object') {
      const id = objectKeys.map((key) => value[key]).find(Boolean);
      if (id) return String(id);
    } else if (value != null && String(value)) {
      return String(value);
    }
  }
  return '';
}

export function getFarmId(record) {
  return firstId(
    [record?.farm, record?.farm_id, record?.farmId, record?.id_farm],
    ['id', 'pk', 'uuid'],
  );
}

export function getWorkerId(participant) {
  return firstId(
    [participant?.worker, participant?.worker_id, participant?.workerId, participant?.id_worker],
    ['id', 'pk', 'uuid', 'worker_id'],
  );
}

// Une listas por id; los campos de las últimas listas pisan a los de las primeras.
export function mergeById(...lists) {
  const byId = new Map();
  for (const item of lists.flat()) {
    if (item?.id == null) continue;
    byId.set(String(item.id), { ...byId.get(String(item.id)), ...item });
  }
  return [...byId.values()];
}

// Nombre de un trabajador sin importar el formato en que llegó ('' si no hay).
export function getWorkerName(worker) {
  if (typeof worker === 'string') return worker;
  if (!worker || typeof worker !== 'object') return '';
  return (
    worker.nombre ||
    worker.name ||
    worker.full_name ||
    [worker.first_name, worker.last_name].filter(Boolean).join(' ')
  );
}

export function getWorkerIdentification(worker) {
  return worker?.identification || worker?.cedula || '';
}

// "Ana Pérez · C.C. 123" para listas de selección.
export function getWorkerLabel(worker) {
  const identification = getWorkerIdentification(worker);
  return [
    getWorkerName(worker) || 'Trabajador sin nombre',
    identification ? `C.C. ${identification}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

// "Lote 1 · Finca La Esperanza" para listas de selección.
export function getLotLabel(lot) {
  const lotName = lot.nombre || lot.name || 'Lote sin nombre';
  const farmName = lot.farmName || lot.farm?.name || lot.farm_name || lot.fincaNombre || '';
  return farmName ? `${lotName} · Finca ${farmName}` : lotName;
}

// Labores (detalles) de una participación, siempre como arreglo.
export function getParticipantDetails(participant) {
  return Array.isArray(participant?.details) ? participant.details : [];
}
