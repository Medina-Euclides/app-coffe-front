import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SidebarApp } from './SidebarApp.jsx';
import { SidebarProvider, useSidebar } from '../ui/sidebar.jsx';
import SyncStatus from '../shared/SyncStatus.jsx';
import AssistantFab from './AssistantFab.jsx';
import NotificationBell from '../shared/NotificationBell.jsx';
import { usePendingWorkdays } from '#hooks/usePendingWorkdays';

// Se oculta al bajar y reaparece al subir, sin tener que volver al inicio de la página.
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < 64) setHidden(false);
      else if (delta > 8) setHidden(true);
      else if (delta < -8) setHidden(false);
      if (Math.abs(delta) > 8 || y < 64) lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return [hidden, setHidden];
}

// Barra superior del móvil con el menú, el estado de conexión y la campanita.
function MobileTopBar({ pendingWorkdays }) {
  const { toggleSidebar } = useSidebar();
  const [hidden, setHidden] = useHideOnScrollDown();

  return (
    <header
      className={`sticky top-0 z-30 transition-transform duration-200 ease-out motion-reduce:transition-none ${hidden ? '-translate-y-full' : 'translate-y-0'} -mx-4 -mt-4 mb-5 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_var(--border),0_6px_16px_-12px_rgb(21_40_30/0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-card/85 md:hidden`}
      onFocus={() => setHidden(false)}
    >
      <div className="flex min-h-14 min-w-0 items-center gap-3 px-3 py-2">
        <button
          aria-label="Abrir menú de navegación"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-muted text-primary transition-colors hover:bg-secondary active:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={toggleSidebar}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" strokeWidth={2.25} />
        </button>
        <SyncStatus />
        <NotificationBell
          onClose={pendingWorkdays.close}
          pending={pendingWorkdays.pending}
        />
      </div>
    </header>
  );
}

export default function AppLayout({ usuario, onLogout }) {
  // Deja espacio al final para que el botón flotante del asistente no tape contenido.
  const showsAssistantFab = !useLocation().pathname.startsWith('/asistente-ia');
  // Una sola consulta para las dos campanitas (barra móvil y menú lateral).
  const pendingWorkdays = usePendingWorkdays();
  return (
    <SidebarProvider>
      <a
        className="sr-only z-50 rounded-lg bg-card px-4 py-2 text-sm font-semibold text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-2 focus:outline-offset-2 focus:outline-ring"
        href="#contenido-principal"
      >
        Saltar al contenido principal
      </a>
      <SidebarApp onLogout={onLogout} pendingWorkdays={pendingWorkdays} usuario={usuario} />
      <main
        className={`min-w-0 flex-1 bg-muted p-4 md:p-8 ${showsAssistantFab ? 'pb-28 md:pb-28' : ''}`}
        id="contenido-principal"
      >
        <MobileTopBar pendingWorkdays={pendingWorkdays} />
        <Outlet />
      </main>
      <AssistantFab />
    </SidebarProvider>
  );
}
