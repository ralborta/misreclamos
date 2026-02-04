"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { CaseTypesNavLinks } from "@/components/casos/CaseTypesNavLinks";

export function TicketsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f3f8fd]">
      <ReclamosSidebar />
      <main className="flex-1 p-6 lg:p-8 bg-white rounded-l-2xl shadow-sm">{children}</main>
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
    <aside className="w-64 bg-white border-r border-[#f7941d]/20 flex flex-col shadow-sm">
      {/* Header: logo en public/logo.png (o public/logo.svg); si no existe se muestra el texto */}
      <div className="px-6 py-6 border-b border-[#f7941d]/30">
        <Link href="/tickets" className="flex items-center gap-3 hover:opacity-90 transition">
          <img
            src="/logo.png"
            alt="MisReclamos"
            className="h-12 w-auto object-contain object-left logo-img"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden logo-fallback flex items-center gap-3">
            <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#213b5c] text-[#f7941d] text-xl font-bold shadow-sm">
              ⚖
            </div>
            <div>
              <span className="text-lg font-bold block text-[#213b5c]">MisReclamos</span>
              <span className="text-xs text-[#213b5c]/70 font-normal">Tus derechos, tu abogado</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 text-sm overflow-y-auto">
        <SectionTitle>Inicio</SectionTitle>
        <NavLink label="Dashboard" href="/dashboard" />
        <NavLink label="Todos los Casos" href="/tickets" />
        
        <SectionTitle>Por Estado</SectionTitle>
        <NavLink label="Abiertos" href="/tickets/abiertos" />
        <NavLink label="En Progreso" href="/tickets/en-progreso" />
        <NavLink label="Esperando Cliente" href="/tickets/esperando-cliente" />
        <NavLink label="Resueltos" href="/tickets/resueltos" />
        <NavLink label="Cerrados" href="/tickets/cerrados" />
        
        <SectionTitle>Por tipo de caso</SectionTitle>
        <CaseTypesNavLinks />
        
        <SectionTitle>Gestión</SectionTitle>
        <NavLink label="Casos" href="/casos" />
        <NavLink label="Abogados" href="/agentes" />
        <NavLink label="Clientes" href="/clientes" />
        <NavLink label="Configuración" href="/configuracion" />
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#f7941d]/20 bg-[#f3f8fd]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#213b5c] hover:bg-[#f7941d]/10 rounded-lg transition-colors"
        >
          <span className="text-[#213b5c]/80">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-[#213b5c]/60">
      {children}
    </div>
  );
}

function NavLink({
  href,
  label,
  indicator,
}: {
  href: string;
  label: string;
  indicator?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/tickets" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-[#f7941d] text-white shadow-sm"
          : "text-[#213b5c] hover:bg-[#f7941d]/10 hover:text-[#213b5c]"
      }`}
    >
      {indicator && (
        <span className={`h-2 w-2 rounded-full ${indicator} flex-shrink-0`}></span>
      )}
      {!indicator && <span className="w-2"></span>}
      <span className="flex-1">{label}</span>
    </Link>
  );
}
