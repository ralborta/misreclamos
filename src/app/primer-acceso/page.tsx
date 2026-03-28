import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PrimerAccesoForm } from "@/components/auth/PrimerAccesoForm";

export const dynamic = "force-dynamic";

export default async function PrimerAccesoPage() {
  const conPassword = await prisma.agentUser.count({
    where: { passwordHash: { not: null } },
  });
  if (conPassword > 0) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f8fd] px-4 py-10">
      <div className="text-center mb-8">
        <img
          src="/Logo-MisReclamos.png"
          alt="MisReclamos"
          className="h-12 w-auto mx-auto object-contain mb-3"
        />
        <p className="text-[#213b5c] font-semibold">MisReclamos</p>
      </div>
      <PrimerAccesoForm />
      <p className="mt-8 max-w-md text-center text-xs text-[#213b5c]/60">
        Después podrás crear más abogados en Configuración → Usuarios acceso.
      </p>
    </div>
  );
}
