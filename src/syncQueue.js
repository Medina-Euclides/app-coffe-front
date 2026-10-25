const QUEUE_KEY = 'cafesmart_sync_queue';

const leerCola = () => {
  try {
    const dato = localStorage.getItem(QUEUE_KEY);
    return dato ? JSON.parse(dato) : [];
  } catch {
    return [];
  }
};

const guardarCola = (cola) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(cola));
  } catch {
    // Ignorar errores de almacenamiento
  }
};

export const agregarAPendientes = (registro) => {
  const cola = leerCola();
  const nuevoRegistro = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...registro
  };
  cola.push(nuevoRegistro);
  guardarCola(cola);
  return nuevoRegistro;
};

export const obtenerPendientes = () => leerCola();

export const limpiarPendientes = () => guardarCola([]);

export const marcarSincronizados = (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const cola = leerCola().filter((item) => !ids.includes(item.id));
  guardarCola(cola);
};

export const contarPendientes = () => leerCola().length;
