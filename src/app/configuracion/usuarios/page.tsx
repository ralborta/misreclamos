import { requireAdmin } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import UsuariosBackoffice from "@/components/configuracion/UsuariosBackoffice";
import Link from "next/link";

export default async function UsuariosAccesoPage() {
  await requireAdmin();

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/configuracion" className="text-sm text-[#2196F3] hover:underline">
            ← Volver a configuración
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Usuarios y acceso</h1>
        </div>
        <UsuariosBackoffice />
      </div>
    </TicketsLayout>
  );
}
