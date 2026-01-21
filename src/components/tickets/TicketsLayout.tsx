"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export function TicketsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <ReclamosSidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
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
    <aside className="w-72 bg-white border-r border-slate-200/60 shadow-xl flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-slate-200/60 bg-gradient-to-br from-emerald-50 to-teal-50">
        <Link href="/tickets" className="flex items-center gap-3 hover:opacity-90 transition">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 text-2xl font-bold">
            ⚖️
          </div>
          <div>
            <span className="text-xl font-bold block text-slate-900">MisReclamos</span>
            <span className="text-xs text-slate-600 font-medium">Gestión Legal</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6 text-sm overflow-y-auto">
        <SectionTitle>Inicio</SectionTitle>
        <NavLink label="📊 Dashboard" href="/dashboard" icon="📊" />
        <NavLink label="📋 Todos los Casos" href="/tickets" icon="📋" />
        
        <SectionTitle>Por Estado</SectionTitle>
        <NavLink label="Abiertos" href="/tickets/abiertos" icon="🔓" />
        <NavLink label="En Progreso" href="/tickets/en-progreso" icon="⚙️" />
        <NavLink label="Esperando Cliente" href="/tickets/esperando-cliente" icon="⏳" />
        <NavLink label="Resueltos" href="/tickets/resueltos" icon="✅" />
        <NavLink label="Cerrados" href="/tickets/cerrados" icon="🔒" />
        
        <SectionTitle>Por Prioridad</SectionTitle>
        <NavLink label="Urgente" href="/tickets/urgentes" indicator="bg-red-500" icon="🚨" />
        <NavLink label="Alta" href="/tickets/alta" indicator="bg-orange-500" icon="⚠️" />
        <NavLink label="Normal" href="/tickets/normal" indicator="bg-emerald-500" icon="📄" />
        <NavLink label="Baja" href="/tickets/baja" indicator="bg-slate-400" icon="📝" />
        
        <SectionTitle>Gestión</SectionTitle>
        <NavLink label="👨‍⚖️ Abogados" href="/agentes" icon="👨‍⚖️" />
        <NavLink label="👤 Clientes" href="/clientes" icon="👤" />
        <NavLink label="⚙️ Configuración" href="/configuracion" icon="⚙️" />
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200/60 bg-slate-50/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-2 pt-6 text-xs font-bold uppercase tracking-wider text-slate-500">
      {children}
    </div>
  );
}

function NavLink({
  href,
  label,
  indicator,
  icon,
}: {
  href: string;
  label: string;
  indicator?: string;
  icon?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/tickets" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
          : "text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700"
      }`}
    >
      {icon && <span className="text-base">{icon}</span>}
      {indicator && !icon && (
        <span className={`h-2.5 w-2.5 rounded-full ${indicator} shadow-sm`}></span>
      )}
      <span className="flex-1">{label}</span>
      {active && (
        <span className="w-2 h-2 rounded-full bg-white"></span>
      )}
    </Link>
  );
}
