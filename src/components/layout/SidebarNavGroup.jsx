import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar.jsx';

export default function SidebarNavGroup({ icon: Icon, label, options }) {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const hasActiveOption = options.some(
    (option) =>
      typeof option !== 'string' &&
      (pathname === option.to || pathname.startsWith(`${option.to}/`)),
  );
  const [openOverride, setOpenOverride] = useState(null);
  const open = openOverride ?? hasActiveOption;
  const panelId = useId();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        aria-controls={panelId}
        aria-expanded={open}
        className="h-11 rounded-xl px-3 font-medium text-[#526254] hover:bg-[#eef2e9] hover:text-[#214b32] aria-expanded:bg-[#eef2e9] aria-expanded:text-[#214b32]"
        onClick={() => setOpenOverride(!open)}
        title={label}
        type="button"
      >
        <Icon aria-hidden="true" className="size-[18px] text-[#627663]" />
        <span className="min-w-0 flex-1 text-left">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-[#849184] transition-transform motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
        />
      </SidebarMenuButton>

      <ul
        aria-hidden={!open}
        className={`ml-5 mt-1 flex flex-col gap-1 overflow-hidden border-l border-[#dfe6dc] pl-3 transition-[max-height,opacity] duration-200 motion-reduce:transition-none ${
          open ? 'max-h-64 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        } group-data-[collapsible=icon]:hidden`}
        inert={!open}
        id={panelId}
      >
        {options.map((option) => {
          const optionLabel =
            typeof option === 'string' ? option : option.label;

          return (
            <li key={optionLabel}>
              {typeof option === 'string' ? (
                <button
                  className="h-9 w-full cursor-not-allowed rounded-lg px-3 text-left text-sm text-[#68766b] disabled:opacity-100"
                  disabled
                  title="Disponible próximamente"
                  type="button"
                >
                  {optionLabel}
                </button>
              ) : (
                <NavLink
                  className={({ isActive }) =>
                    `flex min-h-10 items-center rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426b48] ${
                      isActive
                        ? 'bg-[#e7f0e3] font-semibold text-[#214b32]'
                        : 'text-[#68766b] hover:bg-[#eef2e9] hover:text-[#214b32]'
                    }`
                  }
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                  to={option.to}
                >
                  {optionLabel}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </SidebarMenuItem>
  );
}
