import { useEffect, useState } from 'react';
import { CONNECTIVITY_EVENT, isOnline as currentlyOnline } from '#services/connectivity';

// true solo si hay red Y el servidor responde (no basta con estar conectado al Wi-Fi).
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(currentlyOnline);

  useEffect(() => {
    const update = () => setIsOnline(currentlyOnline());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener(CONNECTIVITY_EVENT, update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener(CONNECTIVITY_EVENT, update);
    };
  }, []);

  return isOnline;
}
