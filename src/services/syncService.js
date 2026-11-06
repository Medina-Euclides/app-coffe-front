// Motor de sincronización: envía la cola (push) y descarga los datos del servidor (pull).
import {
  contarPendientes,
  contarRechazados,
  descartarRechazados,
  marcarRechazado,
  marcarSincronizados,
  obtenerPendientes,
  OUTBOX_EVENT,
} from './syncQueue.js';
import { CACHE_KEYS, writeCache } from './offlineStore.js';
import { db } from '#lib/db';
import { api } from './api';
import { CONNECTIVITY_EVENT, isOnline, probe } from './connectivity.js';

export const SYNC_EVENT = 'cafesmart:sync-state';
export const DATA_EVENT = 'cafesmart:data-changed';
const BATCH_SIZE = 50;
const AUTO_SYNC_MS = 60_000;

let running = null;
let state = { syncing: false, pending: 0, rejected: 0, lastSync: null, error: '' };

function setState(patch) {
  state = { ...state, ...patch };
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: state }));
}

export const getSyncState = () => state;

export async function refreshCounts() {
  const [pending, rejected, last] = await Promise.all([
    contarPendientes(),
    contarRechazados(),
    db.meta.get('lastSync'),
  ]);
  setState({ pending, rejected, lastSync: last?.value || null });
}

function describeErrors(errors) {
  if (!errors) return 'Rechazado por el servidor.';
  if (typeof errors === 'string') return errors;
  if (Array.isArray(errors)) return errors.join(' ');
  return Object.values(errors)
    .map((value) => (Array.isArray(value) ? value.join(' ') : String(value)))
    .join(' ');
}

async function push() {
  const pending = await obtenerPendientes();
  let applied = 0;
  let rejected = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const response = await api.sync.push({
      operations: batch.map(({ op_id, entity, action, object_id, data, client_ts }) => ({
        op_id,
        entity,
        action,
        object_id,
        data,
        client_ts,
      })),
    });
    const bySeq = new Map(batch.map((op) => [op.op_id, op.seq]));
    const done = [];
    for (const result of response.results || []) {
      const seq = bySeq.get(result.op_id);
      if (seq === undefined) continue;
      const failed =
        result.status === 'rejected' ||
        (result.status === 'duplicate' && result.original_status === 'rejected');
      if (failed) {
        rejected += 1;
        await marcarRechazado(seq, describeErrors(result.errors));
      } else {
        applied += 1;
        done.push(seq);
      }
    }
    await marcarSincronizados(done);
  }
  return { applied, rejected };
}

async function pull() {
  // Si quedan operaciones pendientes no se sobrescribe la caché para no perder cambios locales.
  if ((await contarPendientes()) > 0) return false;
  const { data } = await api.sync.pull();
  await db.transaction('rw', db.cache, async () => {
    for (const key of CACHE_KEYS) {
      if (Array.isArray(data?.[key])) await writeCache(key, data[key]);
    }
  });
  return true;
}

// Ejecuta push + pull. Si ya hay una sincronización en curso, devuelve la misma promesa.
export function syncNow() {
  if (running) return running;
  if (!isOnline() || !api.auth.hasSession()) {
    void refreshCounts();
    return Promise.resolve({ ok: false, applied: 0, rejected: 0, offline: true });
  }
  running = (async () => {
    setState({ syncing: true, error: '' });
    try {
      const { applied, rejected } = await push();
      const pulled = await pull();
      if (pulled) {
        const lastSync = new Date().toISOString();
        await db.meta.put({ key: 'lastSync', value: lastSync });
      }
      if (applied || pulled) window.dispatchEvent(new CustomEvent(DATA_EVENT));
      return { ok: true, applied, rejected };
    } catch (error) {
      setState({ error: error.message || 'Error al sincronizar.' });
      return { ok: false, applied: 0, rejected: 0, error };
    } finally {
      setState({ syncing: false });
      await refreshCounts();
      running = null;
    }
  })();
  return running;
}

// Programa una sincronización pronto (tras registrar algo con conexión).
let scheduled;
export function scheduleSync(delay = 1500) {
  clearTimeout(scheduled);
  scheduled = setTimeout(() => void syncNow(), delay);
}

export async function discardRejected() {
  await descartarRechazados();
  await refreshCounts();
  void syncNow();
}

// Arranca la sincronización automática: al abrir, al reconectar, al volver a la app y cada minuto.
let started = false;
export function startAutoSync() {
  if (started) return;
  started = true;
  // Cuando el servidor vuelve a responder, se envía la cola de inmediato.
  window.addEventListener(CONNECTIVITY_EVENT, (event) => {
    if (event.detail?.online) void syncNow();
  });
  window.addEventListener('online', () => void probe().then((ok) => ok && syncNow()));
  window.addEventListener(OUTBOX_EVENT, (event) => {
    void refreshCounts();
    if (event.detail?.type === 'added' && isOnline()) scheduleSync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  setInterval(async () => {
    if (isOnline() && (await contarPendientes()) > 0) void syncNow();
  }, AUTO_SYNC_MS);
  void refreshCounts();
  void syncNow();
}

// Compatibilidad con el código anterior.
export const sincronizarPendientes = syncNow;
export const cantidadPendientes = contarPendientes;
