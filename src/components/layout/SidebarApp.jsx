import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "#components/ui/sidebar"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Sprout,
  ChartNoAxesCombined,
  ChartPie,
} from "lucide-react"
import SidebarNavGroup from "./SidebarNavGroup.jsx"

const gruposNavegacion = [
  {
    label: "Gestión de la finca",
    icon: Users,
    options: [
      { label: "Trabajadores", to: "/gestion/trabajadores" },
      { label: "Actividades laborales", to: "/gestion/actividades" },
      { label: "Fincas y lotes", to: "/gestion/fincas" },
    ],
  },
  {
    label: "Operaciones",
    icon: Sprout,
    options: [
      { label: "Recolección", to: "/operaciones/recoleccion" },
      { label: "Jornadas laborales", to: "/operaciones/jornadas" },
    ],
  },
  {
    label: "Economía",
    icon: ChartNoAxesCombined,
    options: [
      { label: "Pagos", to: "/economia/pagos" },
      { label: "Egresos", to: "/economia/egresos" },
      { label: "Ventas", to: "/economia/ventas" },
    ],
  },
  {
    label: "Consultas",
    icon: ChartPie,
    options: ["Producción", "Resumen económico"],
  },
]

function obtenerNombreMostrar(usuario) {
  if (usuario?.nombre) return usuario.nombre
  if (usuario?.name) return usuario.name
  if (usuario?.displayName) return usuario.displayName
  if (usuario?.username) return usuario.username
  if (usuario?.nombreProductor) return usuario.nombreProductor
  if (usuario?.correo) return usuario.correo.split("@")[0]
  if (usuario?.email) return usuario.email.split("@")[0]
  return "Usuario"
}

export const SidebarApp = ({ usuario, onLogout }) => {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const nombreMostrar = obtenerNombreMostrar(usuario)
  const inicialMostrar = nombreMostrar.charAt(0).toUpperCase()

  return (
    <Sidebar className="[&_[data-slot=sidebar-inner]]:bg-[#fbfaf5] [&_[data-slot=sidebar-inner]]:text-[#24372b]">
      <SidebarHeader className="gap-0 border-b border-[#e7e8dc] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e6efe2] ring-1 ring-[#d6e3d2]">
            <img
              src="/icon.png"
              alt="Logo CafeSmart"
              width="40"
              height="40"
              className="size-10 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-[#183d2b]">
              CafeSmart
            </p>
            <p className="mt-0.5 text-xs font-medium tracking-wide text-[#718071]">
              Gestión Cafetera
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        <SidebarGroup className="gap-2 p-0">
          <SidebarGroupLabel className="h-auto px-3 pb-2 text-[0.68rem] font-bold tracking-[0.14em] text-[#8b9488] group-data-[collapsible=icon]:hidden">
            MENÚ PRINCIPAL
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                render={
                  <NavLink
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                    to="/inicio"
                  />
                }
                size="lg"
                isActive={pathname === "/inicio"}
                className={
                  pathname === "/inicio"
                    ? "h-11 rounded-xl bg-[#e7f0e3] px-3 font-semibold text-[#214b32] shadow-sm hover:bg-[#dcebd8] hover:text-[#173d2b] data-active:bg-[#e7f0e3] data-active:text-[#214b32]"
                    : "h-11 rounded-xl px-3 font-medium text-[#68766b] hover:bg-[#eef2e9] hover:text-[#214b32] active:bg-[#e7f0e3] active:text-[#214b32]"
                }
              >
                <LayoutDashboard aria-hidden="true" className="size-[18px]" />
                <span>Inicio</span>
                {pathname === "/inicio" && (
                  <span
                    aria-hidden="true"
                    className="ml-auto size-1.5 rounded-full bg-[#4d8057]"
                  />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {gruposNavegacion.map((grupo) => (
              <SidebarNavGroup key={grupo.label} {...grupo} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#e7e8dc] p-4">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e3e8dd] bg-white/80 px-3 py-3 shadow-[0_4px_16px_-12px_rgba(36,55,43,0.35)]">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#214b32] text-sm font-bold text-[#f4f3e9] ring-4 ring-[#eaf0e5]"
          >
            {inicialMostrar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold capitalize text-[#263b2c]">
              {nombreMostrar}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#778477]">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-[#5b9b66]"
              />
              Sesión activa
            </p>
          </div>
        </div>
        {onLogout && (
          <button
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#68766b] transition-colors hover:bg-[#eef2e9] hover:text-[#214b32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#214b32]"
            onClick={onLogout}
            type="button"
          >
            Cerrar sesión
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
