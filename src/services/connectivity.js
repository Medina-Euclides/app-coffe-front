// Estado real de conexión con el servidor.
// navigator.onLine solo indica si hay red (Wi-Fi/datos), no si hay internet: en la finca es
// común tener Wi-Fi sin salida o datos sin señal. Si una petición falla por red, se marca el
// servidor como "no disponible" y todo responde desde el dispositivo al instante, mientras una
// sonda liviana revisa cada pocos segundos si el servidor volvió.
import axios from 'axios';

export const CONNECTIVITY_EVENT = 'cafesmart:connectivity';
const PROBE_INTERVAL_MS = 10_000;
const PROBE_TIMEOUT_MS = 4_000;

let serverDown = false;
let probeTimer = null;
let pingUrl = '/sync/ping/';

export function configureConnectivity({ baseUrl }) {
  pingUrl = `${baseUrl}/sync/ping/`;
}

const browserOnline = () => typeof navigator === 'undefined' || navigator.onLine;

export const isOnline = () => browserOnline() && !serverDown;

function emit() {
  window.dispatchEvent(new CustomEvent(CONNECTIVITY_EVENT, { detail: { online: isOnline() } }));
}

export async function probe() {
  if (!browserOnline()) return false;
  try {
    await axios.get(pingUrl, { timeout: PROBE_TIMEOUT_MS });
    markServerUp();
    return true;
  } catch (error) {
    // Cualquier respuesta HTTP significa que el servidor sí contestó.
    if (error.response) {
      markServerUp();
      return true;
    }
    markServerDown();
    return false;
  }
}

// Sonda rápida cuando algo hace sospechar que la conexión es mala (p. ej. una lista lenta).
let probing = null;
export function probeSoon() {
  probing ||= probe().finally(() => {
    probing = null;
  });
  return probing;
}

export function markServerDown() {
  if (!serverDown) {
    serverDown = true;
    emit();
  }
  if (!probeTimer) probeTimer = setInterval(() => void probe(), PROBE_INTERVAL_MS);
}

export function markServerUp() {
  clearInterval(probeTimer);
  probeTimer = null;
  if (serverDown) {
    serverDown = false;
    emit();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void probe());
  window.addEventListener('offline', () => {
    markServerDown();
    emit();
  });
}
