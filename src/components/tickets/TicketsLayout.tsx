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
    <aside className="w-64 flex flex-col shadow-lg">
      {/* Barra superior: logo en public/ (Logo-MisReclamos.png o "Logo MisReclamos.png") */}
      <div className="bg-[#213b5c] px-4 py-5">
        <Link href="/tickets" className="flex flex-col gap-1 hover:opacity-95 transition">
          <img
            src="/Logo-MisReclamos.png"
            alt="MisReclamos"
            className="h-10 w-auto object-contain object-left logo-img min-h-[40px]"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden logo-fallback flex items-center gap-2">
            <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-white/10 text-[#f7941d] text-lg font-bold">
              ⚖
            </span>
            <div>
              <span className="text-base font-bold uppercase tracking-tight text-[#f7941d] block">MisReclamos</span>
              <span className="text-xs text-white/90 font-normal">Tus derechos, tu abogado</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navegación: fondo claro, texto azul */}
      <nav className="flex-1 space-y-1 px-3 py-5 text-sm overflow-y-auto bg-[#f3f8fd] border-r border-[#213b5c]/10">
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

      {/* Pie azul oscuro (estilo landing) */}
      <div className="bg-[#213b5c] px-4 py-4">
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
    <div className="px-4 pb-2 pt-5 text-[11px] font-bold uppercase tracking-widest text-[#213b5c]">
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
      className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
        active
          ? "bg-[#f7941d] text-white shadow-sm"
          : "text-[#213b5c] hover:bg-[#213b5c]/10 hover:text-[#213b5c]"
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
