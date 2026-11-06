// Cola de operaciones pendientes (outbox) guardada en IndexedDB.
import { db, newId } from '#lib/db';

export const OUTBOX_EVENT = 'cafesmart:outbox-changed';

const notify = (type = 'changed') =>
  window.dispatchEvent(new CustomEvent(OUTBOX_EVENT, { detail: { type } }));

export async function agregarAPendientes({ op_id, client_ts, entity, action, object_id, data }) {
  const op = {
    op_id: op_id || newId(),
    entity,
    action,
    object_id,
    data: data || {},
    client_ts: client_ts || new Date().toISOString(),
    status: 'pending',
    error: null,
  };
  op.seq = await db.outbox.add(op);
  notify('added');
  return op;
}

export const obtenerPendientes = () =>
  db.outbox.where('status').equals('pending').sortBy('seq');

export const obtenerRechazados = () =>
  db.outbox.where('status').equals('rejected').sortBy('seq');

export const contarPendientes = () => db.outbox.where('status').equals('pending').count();

export const contarRechazados = () => db.outbox.where('status').equals('rejected').count();

export async function marcarSincronizados(seqs) {
  if (!seqs.length) return;
  await db.outbox.bulkDelete(seqs);
  notify();
}

export async function marcarRechazado(seq, error) {
  await db.outbox.update(seq, { status: 'rejected', error });
  notify();
}

export async function descartarRechazados() {
  await db.outbox.where('status').equals('rejected').delete();
  notify();
}
