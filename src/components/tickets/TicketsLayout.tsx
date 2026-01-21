"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export function TicketsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <ReclamosSidebar />
      <main className="flex-1 p-6 lg:p-8 bg-white">{children}</main>
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 py-6 border-b border-slate-200">
        <Link href="/tickets" className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white text-xl font-bold shadow-sm">
            ⚖
          </div>
          <div>
            <span className="text-lg font-bold block text-slate-900">MisReclamos</span>
            <span className="text-xs text-slate-500 font-normal">Bufete Legal</span>
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
        
        <SectionTitle>Por Prioridad</SectionTitle>
        <NavLink label="Urgente" href="/tickets/urgentes" indicator="bg-orange-500" />
        <NavLink label="Alta" href="/tickets/alta" indicator="bg-orange-400" />
        <NavLink label="Normal" href="/tickets/normal" indicator="bg-blue-500" />
        <NavLink label="Baja" href="/tickets/baja" indicator="bg-slate-400" />
        
        <SectionTitle>Gestión</SectionTitle>
        <NavLink label="Abogados" href="/agentes" />
        <NavLink label="Clientes" href="/clientes" />
        <NavLink label="Configuración" href="/configuracion" />
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="text-slate-500">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
