import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar.jsx';

export default function SidebarNavGroup({ icon: Icon, label, options }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        aria-controls={panelId}
        aria-expanded={open}
        className="h-11 rounded-xl px-3 font-medium text-[#526254] hover:bg-[#eef2e9] hover:text-[#214b32] aria-expanded:bg-[#eef2e9] aria-expanded:text-[#214b32]"
        onClick={() => setOpen((isOpen) => !isOpen)}
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
        {options.map((option) => (
          <li key={option}>
            <button
              className="h-9 w-full cursor-not-allowed rounded-lg px-3 text-left text-sm text-[#68766b] disabled:opacity-100"
              disabled
              title="Disponible próximamente"
              type="button"
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
    </SidebarMenuItem>
  );
}
