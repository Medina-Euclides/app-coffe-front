import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "#components/ui/sidebar"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Home,
  Users,
  Sprout,
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
    label: "Operaciones diarias",
    icon: Sprout,
    options: [
      { label: "Jornadas laborales", to: "/jornada-laboral" },
      { label: "Pagos laborales", to: "/pagos-laborales" },
      { label: "Ventas y Egresos", to: "/movimientos-financieros" },
    ],
  },
  {
    label: "Consultas",
    icon: LayoutDashboard,
    options: [
      { label: "Analitica", to: "/analitica" },
    ],
  },
]

function obtenerNombreMostrar(usuario) {
  if (usuario?.full_name) return usuario.full_name
  if (usuario?.first_name || usuario?.last_name) {
    return [usuario.first_name, usuario.last_name].filter(Boolean).join(" ")
  }
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
    <Sidebar className="[&_[data-slot=sidebar-inner]]:bg-sidebar [&_[data-slot=sidebar-inner]]:text-foreground">
      <SidebarHeader className="gap-0 border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary ring-1 ring-secondary">
            <img
              src="/icon.png"
              alt="Logo CafeSmart"
              width="40"
              height="40"
              className="size-10 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-foreground">
              CafeSmart
            </p>
            <p className="mt-0.5 text-xs font-medium tracking-wide text-muted-foreground">
              Gestión Cafetera
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        <SidebarGroup className="gap-2 p-0">
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
                    ? "h-11 rounded-xl bg-secondary px-3 font-semibold text-primary shadow-sm hover:bg-secondary hover:text-foreground data-active:bg-secondary data-active:text-primary"
                    : "h-11 rounded-xl px-3 font-medium text-muted-foreground hover:bg-tint hover:text-primary active:bg-secondary active:text-primary"
                }
              >
                <Home aria-hidden="true" className="size-[18px]" />
                <span>Inicio</span>
                {pathname === "/inicio" && (
                  <span
                    aria-hidden="true"
                    className="ml-auto size-1.5 rounded-full bg-cereza"
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

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card/80 px-3 py-3 shadow-[0_4px_16px_-12px_rgba(36,55,43,0.35)]">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-4 ring-secondary"
          >
            {inicialMostrar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold capitalize text-foreground">
              {nombreMostrar}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-leaf"
              />
              Sesión activa
            </p>
          </div>
        </div>
        {onLogout && (
          <button
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-tint hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
