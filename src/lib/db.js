// Base de datos local (IndexedDB) para trabajar sin conexión.
//  - cache:  última copia de cada lista del servidor (+ cambios locales aún no enviados).
//  - outbox: operaciones registradas sin conexión, en el orden en que se hicieron.
//  - meta:   datos de control (última sincronización, etc.).
import Dexie from 'dexie';

export const db = new Dexie('cafesmart');

db.version(1).stores({
  cache: 'key',
  outbox: '++seq, op_id, status',
  meta: 'key',
});

// UUID v4 generado en el dispositivo. crypto.randomUUID solo existe en HTTPS/localhost,
// por eso se incluye un respaldo con getRandomValues (disponible en cualquier contexto).
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
