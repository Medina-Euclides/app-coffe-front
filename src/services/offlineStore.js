// Caché local de listas y aplicación optimista de cambios hechos sin conexión.
// Las listas se guardan con la misma forma que devuelve el backend, así las páginas
// no necesitan saber si los datos vienen del servidor o del dispositivo.
import { db } from '#lib/db';

export const CACHE_KEYS = [
  'farms',
  'lots',
  'workers',
  'activities',
  'workdays',
  'expenses',
  'sales',
  'settlements',
  'settlement_workdays',
  'settlement_harvests',
  'payments',
];

const same = (a, b) => String(a) === String(b);
const nowIso = () => new Date().toISOString();

export async function readCache(key) {
  const row = await db.cache.get(key);
  return row ? row.data : null;
}

export async function writeCache(key, data) {
  await db.cache.put({ key, data, updated_at: nowIso() });
}

async function updateCache(key, updater) {
  const current = (await readCache(key)) || [];
  const next = updater(current);
  await writeCache(key, next);
  return next;
}

export async function clearLocalData() {
  await Promise.all([db.cache.clear(), db.outbox.clear(), db.meta.clear()]);
}

// ---------------------------------------------------------------------------
// Listas planas (trabajadores, gastos, ventas)
// ---------------------------------------------------------------------------
export async function upsertItem(key, item) {
  let saved = item;
  await updateCache(key, (items) => {
    const index = items.findIndex((current) => same(current.id, item.id));
    if (index === -1) return [item, ...items];
    saved = { ...items[index], ...item };
    return items.map((current, i) => (i === index ? saved : current));
  });
  return saved;
}

// ---------------------------------------------------------------------------
// Árbol de jornadas: jornada -> participantes -> detalles -> pesajes
// ---------------------------------------------------------------------------
function mapParticipants(workdays, fn) {
  return workdays.map((workday) => ({
    ...workday,
    participants: (workday.participants || []).map((participant) =>
      fn(participant, workday),
    ),
  }));
}

function mapDetails(workdays, fn) {
  return mapParticipants(workdays, (participant) => ({
    ...participant,
    details: (participant.details || []).map((detail) => fn(detail, participant)),
  }));
}

async function lookup(key, id) {
  const items = (await readCache(key)) || [];
  return items.find((item) => same(item.id, id)) || null;
}

const workerName = (worker) =>
  worker ? [worker.first_name, worker.last_name].filter(Boolean).join(' ') : '';

// Busca un elemento dentro del árbol de jornadas para devolverlo a la página.
async function findInWorkdays(predicate) {
  const workdays = (await readCache('workdays')) || [];
  for (const workday of workdays) {
    if (predicate.type === 'workday' && same(workday.id, predicate.id)) return workday;
    for (const participant of workday.participants || []) {
      if (predicate.type === 'participant' && same(participant.id, predicate.id)) {
        return participant;
      }
      for (const detail of participant.details || []) {
        if (predicate.type === 'detail' && same(detail.id, predicate.id)) return detail;
        for (const record of detail.harvest_records || []) {
          if (predicate.type === 'record' && same(record.id, predicate.id)) return record;
        }
      }
    }
  }
  return null;
}

export const local = {
  workdays: {
    async create(id, data) {
      const farm = await lookup('farms', data.farm);
      const workday = {
        producer: null,
        farm_name: farm?.name || '',
        status: 'abierta',
        closed_at: null,
        created_at: nowIso(),
        participants: [],
        ...data,
        id,
      };
      await updateCache('workdays', (items) => [
        workday,
        ...items.filter((item) => !same(item.id, id)),
      ]);
      return workday;
    },
    async replace(workday) {
      await updateCache('workdays', (items) =>
        items.some((item) => same(item.id, workday.id))
          ? items.map((item) => (same(item.id, workday.id) ? workday : item))
          : [workday, ...items],
      );
      return workday;
    },
    async close(id) {
      await updateCache('workdays', (items) =>
        items.map((item) =>
          same(item.id, id) ? { ...item, status: 'cerrada', closed_at: nowIso() } : item,
        ),
      );
      return findInWorkdays({ type: 'workday', id });
    },
    async remove(id) {
      await updateCache('workdays', (items) => items.filter((item) => !same(item.id, id)));
    },
    async updateLabor(id, data) {
      const activity = await lookup('activities', data.activity_type);
      await updateCache('workdays', (items) =>
        items.map((workday) =>
          !same(workday.id, id)
            ? workday
            : {
                ...workday,
                participants: workday.participants.map((participant) =>
                  participant.settlement_status === 'anulado'
                    ? participant
                    : {
                        ...participant,
                        payment_mode: data.payment_mode,
                        agreed_rate: data.agreed_rate,
                        details: (participant.details || []).map((detail) => ({
                          ...detail,
                          activity_type: data.activity_type,
                          activity_name: activity?.name || detail.activity_name,
                          activity_is_harvest: Boolean(activity?.is_harvest),
                        })),
                      },
                ),
              },
        ),
      );
      return findInWorkdays({ type: 'workday', id });
    },
  },

  workdayWorkers: {
    async create(id, data) {
      const worker = await lookup('workers', data.worker);
      const participant = {
        worker_name: workerName(worker),
        worker_identification: worker?.identification || null,
        settlement_status: 'pendiente',
        details: [],
        ...data,
        id,
      };
      await updateCache('workdays', (items) =>
        items.map((workday) =>
          same(workday.id, data.workday)
            ? {
                ...workday,
                participants: [
                  ...(workday.participants || []).filter((p) => !same(p.id, id)),
                  participant,
                ],
              }
            : workday,
        ),
      );
      return participant;
    },
    async update(id, data) {
      await updateCache('workdays', (items) =>
        mapParticipants(items, (participant) =>
          same(participant.id, id) ? { ...participant, ...data, id: participant.id } : participant,
        ),
      );
      return findInWorkdays({ type: 'participant', id });
    },
    async setStatus(id, status) {
      await updateCache('workdays', (items) =>
        mapParticipants(items, (participant) => {
          if (!same(participant.id, id)) return participant;
          const details =
            status === 'anulado'
              ? (participant.details || []).map((detail) => ({
                  ...detail,
                  harvest_records: (detail.harvest_records || []).map((record) =>
                    record.settlement_status === 'registrado'
                      ? { ...record, settlement_status: 'anulado' }
                      : record,
                  ),
                }))
              : participant.details;
          return { ...participant, settlement_status: status, details };
        }),
      );
      return findInWorkdays({ type: 'participant', id });
    },
    async remove(id) {
      await updateCache('workdays', (items) =>
        items.map((workday) => ({
          ...workday,
          participants: (workday.participants || []).filter((p) => !same(p.id, id)),
        })),
      );
    },
  },

  workdayDetails: {
    async create(id, data) {
      const [activity, lot] = await Promise.all([
        lookup('activities', data.activity_type),
        lookup('lots', data.lot),
      ]);
      const detail = {
        activity_name: activity?.name || '',
        activity_is_harvest: Boolean(activity?.is_harvest),
        lot_name: lot?.name || '',
        harvest_records: [],
        ...data,
        id,
      };
      await updateCache('workdays', (items) =>
        mapParticipants(items, (participant) =>
          same(participant.id, data.workday_worker)
            ? {
                ...participant,
                details: [
                  ...(participant.details || []).filter((d) => !same(d.id, id)),
                  detail,
                ],
              }
            : participant,
        ),
      );
      return detail;
    },
    async update(id, data) {
      await updateCache('workdays', (items) =>
        mapDetails(items, (detail) =>
          same(detail.id, id) ? { ...detail, ...data, id: detail.id } : detail,
        ),
      );
      return findInWorkdays({ type: 'detail', id });
    },
    async remove(id) {
      await updateCache('workdays', (items) =>
        mapParticipants(items, (participant) => ({
          ...participant,
          details: (participant.details || []).filter((d) => !same(d.id, id)),
        })),
      );
    },
  },

  harvestRecords: {
    async create(id, data) {
      const record = { settlement_status: 'registrado', ...data, id };
      await updateCache('workdays', (items) =>
        mapDetails(items, (detail) =>
          same(detail.id, data.workday_detail)
            ? {
                ...detail,
                harvest_records: [
                  ...(detail.harvest_records || []).filter((r) => !same(r.id, id)),
                  record,
                ],
              }
            : detail,
        ),
      );
      return record;
    },
    async update(id, data) {
      await updateCache('workdays', (items) =>
        mapDetails(items, (detail) => ({
          ...detail,
          harvest_records: (detail.harvest_records || []).map((record) =>
            same(record.id, id) ? { ...record, ...data, id: record.id } : record,
          ),
        })),
      );
      return findInWorkdays({ type: 'record', id });
    },
  },

  flat: {
    async create(key, id, data, extra = {}) {
      return upsertItem(key, { created_at: nowIso(), updated_at: nowIso(), ...extra, ...data, id });
    },
    async update(key, id, data) {
      return upsertItem(key, { ...data, id, updated_at: nowIso() });
    },
  },
};
