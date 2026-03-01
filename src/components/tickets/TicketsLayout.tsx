"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { CaseTypesNavLinks } from "@/components/casos/CaseTypesNavLinks";

const SIDEBAR_WIDTH = "17rem"; /* 272px - fijo para que no se ajuste */

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

      {/* Navegación: mismo fondo oscuro, ítem activo azul */}
      <nav className="flex-1 min-h-0 space-y-0 px-2 py-4 text-sm overflow-y-auto overflow-x-hidden bg-[#2C3E50]">
        <SectionTitle>Inicio</SectionTitle>
        <NavLink label="Dashboard" href="/dashboard" />
        <NavLink label="Todos los Casos" href="/tickets" />
        <NavLink label="Legado" href="/legado" />

        <div className="my-3 border-t border-white/10" />

        <SectionTitle>Por Estado</SectionTitle>
        <NavLink label="Abiertos" href="/tickets/abiertos" withArrow />
        <NavLink label="En Progreso" href="/tickets/en-progreso" withArrow />
        <NavLink label="Esperando Cliente" href="/tickets/esperando-cliente" withArrow />
        <NavLink label="Resueltos" href="/tickets/resueltos" withArrow />
        <NavLink label="Cerrados" href="/tickets/cerrados" withArrow />

        <SectionTitle>Por tipo de caso</SectionTitle>
        <CaseTypesNavLinks />

        <SectionTitle>Gestión</SectionTitle>
        <NavLink label="Casos" href="/casos" />
        <NavLink label="Abogados" href="/agentes" />
        <NavLink label="Clientes" href="/clientes" />
        <NavLink label="Configuración" href="/configuracion" />
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
    <div className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-widest text-white/60">
      {children}
    </div>
  );
}

function NavLink({
  href,
  label,
  indicator,
  withArrow,
}: {
  href: string;
  label: string;
  indicator?: string;
  withArrow?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/tickets" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
        active
          ? "bg-[#2196F3] text-white shadow-sm"
          : "text-white/90 hover:bg-white/10 hover:text-white"
      }`}
    >
      {indicator && (
        <span className={`h-2 w-2 rounded-full ${indicator} flex-shrink-0`}></span>
      )}
      {!indicator && <span className="w-2 flex-shrink-0"></span>}
      <span className="flex-1 min-w-0 break-words">{label}</span>
      {withArrow && <span className="text-white/50 text-xs">›</span>}
    </Link>
  );
}
