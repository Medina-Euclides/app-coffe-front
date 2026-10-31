import { NavLink } from 'react-router-dom';

const tabs = [
  { label: 'Recolección', to: '/operaciones/recoleccion', id: 'recoleccion' },
  { label: 'Jornadas laborales', to: '/operaciones/jornadas', id: 'jornadas' },
];

export default function OperationsTabs({ section }) {
  return (
    <nav
      aria-label="Secciones de operaciones"
      className="flex w-full gap-1 overflow-x-auto rounded-xl border border-[#e2e8dd] bg-white p-1 sm:w-fit"
    >
      {tabs.map((tab) => (
        <NavLink
          aria-current={section === tab.id ? 'page' : undefined}
          className={`min-h-10 shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48] ${
            section === tab.id
              ? 'bg-[#e7f0e3] text-[#214b32]'
              : 'text-[#68766b] hover:bg-[#f4f6f1] hover:text-[#214b32]'
          }`}
          key={tab.id}
          to={tab.to}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
