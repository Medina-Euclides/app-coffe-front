// Botón flotante para abrir el asistente de IA desde cualquier pantalla.
// Solo funciona con conexión: sin internet se pone gris y explica por qué al tocarlo.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BotMessageSquare, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '#hooks/useOnlineStatus';

const ASSISTANT_PATH = '/asistente-ia';

const baseClass =
  'flex size-14 items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring';

export default function AssistantFab() {
  const { pathname } = useLocation();
  const isOnline = useOnlineStatus();
  const [showHint, setShowHint] = useState(false);
  const hintTimer = useRef(null);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  if (pathname.startsWith(ASSISTANT_PATH)) return null;
  const hintVisible = showHint && !isOnline;

  const explainOffline = () => {
    setShowHint(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(false), 3500);
  };

  return (
    <div className="pointer-events-none fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-2 md:right-8 md:bottom-8">
      <p
        aria-live="polite"
        className={`pointer-events-auto max-w-56 rounded-xl bg-foreground px-3 py-2 text-sm text-background shadow-lg ${
          hintVisible ? '' : 'sr-only'
        }`}
        role="status"
      >
        {hintVisible ? 'Necesitas conexión a internet para usar el asistente.' : ''}
      </p>

      {isOnline ? (
        <Link
          aria-label="Abrir asistente de IA"
          className={`${baseClass} pointer-events-auto bg-primary text-primary-foreground shadow-[0_4px_0_color-mix(in_oklab,var(--primary),black_45%),0_10px_24px_-8px_rgb(21_40_30/0.45)] transition-[background-color,box-shadow,translate] duration-100 hover:bg-primary-hover active:translate-y-1 active:shadow-[0_0_0_color-mix(in_oklab,var(--primary),black_45%),0_6px_16px_-8px_rgb(21_40_30/0.45)] motion-reduce:transition-none`}
          title="Asistente de IA"
          to={ASSISTANT_PATH}
        >
          <BotMessageSquare aria-hidden="true" className="size-6" strokeWidth={2} />
        </Link>
      ) : (
        <button
          aria-disabled="true"
          aria-label="Asistente de IA no disponible sin conexión"
          className={`${baseClass} pointer-events-auto relative cursor-not-allowed border border-border-strong bg-muted text-subtle shadow-[0_4px_0_var(--border-strong)]`}
          onClick={explainOffline}
          title="Sin conexión"
          type="button"
        >
          <BotMessageSquare aria-hidden="true" className="size-6" strokeWidth={2} />
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-warning text-white"
          >
            <WifiOff className="size-3" strokeWidth={2.5} />
          </span>
        </button>
      )}
    </div>
  );
}
