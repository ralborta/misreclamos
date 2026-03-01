"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { CaseTypesNavLinks } from "@/components/casos/CaseTypesNavLinks";
import { SidebarIcons, type SidebarIconName } from "@/components/tickets/SidebarIcons";

const SIDEBAR_WIDTH = "17rem";

const NAV_ACTIVE_BG = "#375A7F";

export function TicketsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f3f8fd]">
      <ReclamosSidebar />
      <main
        className="min-h-screen p-6 lg:p-8 bg-slate-50 rounded-l-2xl shadow-sm"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        {children}
      </main>
    </div>
  );
}

function ReclamosSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col shadow-lg min-w-[17rem] w-[17rem] flex-shrink-0"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Barra superior: logo + nombre - fondo oscuro */}
      <div className="bg-[#2C3E50] px-4 py-5 flex-shrink-0">
        <Link href="/tickets" className="flex flex-col items-center gap-2 hover:opacity-95 transition">
          <img
            src="/Logo-MisReclamos.png"
            alt="Mis Reclamos"
            className="h-14 w-auto max-w-[160px] object-contain logo-img min-h-[40px]"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden logo-fallback flex items-center justify-center gap-2">
            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-white/10 text-white text-xl font-bold">
              ⚖
            </span>
          </div>
          <span className="text-base font-bold text-white tracking-tight">Mis Reclamos</span>
        </Link>
      </div>

      {/* Navegación: iconos + texto + chevron, ítem activo #375A7F */}
      <nav className="flex-1 min-h-0 space-y-0 px-3 py-4 text-sm overflow-y-auto overflow-x-hidden bg-[#2C3E50]">
        <SectionTitle>Inicio</SectionTitle>
        <NavLink label="Dashboard" href="/dashboard" icon="home" />
        <NavLink label="Todos los Casos" href="/tickets" icon="folder" />
        <NavLink label="Legado" href="/legado" icon="briefcase" />

        <div className="my-2 border-t border-white/10" />

        <SectionTitle>Por Estado</SectionTitle>
        <NavLink label="Abiertos" href="/tickets/abiertos" icon="check" iconColor="emerald" />
        <NavLink label="En Progreso" href="/tickets/en-progreso" icon="clock" iconColor="orange" />
        <NavLink label="Esperando Cliente" href="/tickets/esperando-cliente" icon="chat" iconColor="sky" />
        <NavLink label="Resueltos" href="/tickets/resueltos" icon="check" iconColor="emerald" />
        <NavLink label="Cerrados" href="/tickets/cerrados" icon="folder" />

        <div className="my-2 border-t border-white/10" />

        <SectionTitle>Por tipo de caso</SectionTitle>
        <CaseTypesNavLinks />

        <div className="my-2 border-t border-white/10" />

        <SectionTitle>Gestión</SectionTitle>
        <NavLink label="Casos" href="/casos" icon="folder" />
        <NavLink label="Abogados" href="/agentes" icon="users" />
        <NavLink label="Clientes" href="/clientes" icon="users" />
        <NavLink label="Configuración" href="/configuracion" icon="settings" />
      </nav>

      {/* Pie */}
      <div className="bg-[#2C3E50] px-4 py-4 flex-shrink-0 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-widest text-[#7A8E9F]">
      {children}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  iconColor,
}: {
  href: string;
  label: string;
  icon: Exclude<SidebarIconName, "chevronRight">;
  iconColor?: "emerald" | "orange" | "sky";
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/tickets" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${!active ? "hover:bg-white/10" : ""}`}
      style={active ? { backgroundColor: NAV_ACTIVE_BG } : undefined}
    >
      <span
        className={`flex-shrink-0 ${active ? "text-white" : "text-white/90 group-hover:text-white"}`}
        style={iconColor && !active ? iconColorStyle(iconColor) : undefined}
      >
        <SidebarIcons name={icon} className="h-5 w-5" />
      </span>
      <span className="flex-1 min-w-0 break-words text-white/95 group-hover:text-white">
        {label}
      </span>
      <span className={`flex-shrink-0 text-sm ${active ? "text-white" : "text-white/50"}`}>
        <SidebarIcons name="chevronRight" className="h-4 w-4" />
      </span>
    </Link>
  );
}

function iconColorStyle(color: "emerald" | "orange" | "sky"): React.CSSProperties {
  const map = { emerald: "#34D399", orange: "#F97316", sky: "#38BDF8" };
  return { color: map[color] };
}
