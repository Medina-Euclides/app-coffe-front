import { Outlet } from 'react-router-dom';
import { SidebarApp } from './SidebarApp.jsx';
import {
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar.jsx';
import SyncStatus from '../shared/SyncStatus.jsx';

export default function AppLayout({ usuario, onLogout }) {
  return (
    <SidebarProvider>
      <a
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-2 focus:outline-offset-2 focus:outline-emerald-800"
        href="#contenido-principal"
      >
        Saltar al contenido principal
      </a>
      <SidebarApp onLogout={onLogout} usuario={usuario} />
      <main
        className="min-w-0 flex-1 bg-[#f7f8f3] p-4 md:p-8"
        id="contenido-principal"
      >
        <header className="mb-4 flex min-w-0 flex-wrap items-center gap-3 md:hidden">
          <SidebarTrigger aria-label="Abrir menú de navegación" />
          <span className="font-semibold text-emerald-950">CafeSmart</span>
          <SyncStatus />
        </header>
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
