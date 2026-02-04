import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { LegadoActions } from "@/components/legado/LegadoActions";

export const dynamic = "force-dynamic";

type LegadoData = Record<string, unknown>;

function getDataValue(data: LegadoData, keys: string[]): string {
  for (const key of keys) {
    const v = data[key];
    if (v != null && v !== "") {
      if (typeof v === "object") return JSON.stringify(v);
      return String(v).trim();
    }
  }
  return "—";
}

function getPhoneForWhatsApp(data: LegadoData): string | null {
  const raw = getDataValue(data, ["Telefono", "Teléfono", "telefono", "Phone", "Tel"]);
  if (!raw || raw === "—") return null;
  const digits = String(raw).replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

export default async function LegadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const legado = await prisma.legado.findUnique({ where: { id } });
  if (!legado) notFound();

  const data = (legado.data as LegadoData) || {};
  const phone = getPhoneForWhatsApp(data);

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/legado"
            className="text-sm text-[#213b5c] hover:text-[#f7941d] hover:underline"
          >
            ← Volver a Legado
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-[#213b5c]">Registro legado</h1>
          <p className="mt-1 text-sm text-slate-500">
            Importado el {new Date(legado.createdAt).toLocaleDateString("es-AR")}
            {legado.source && ` · ${legado.source}`}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Teléfono</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {getDataValue(data, ["Telefono", "Teléfono", "telefono", "Phone", "Tel"])}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Email</dt>
              <dd className="mt-1 text-slate-700">
                {getDataValue(data, ["eMail", "E-mail", "email", "Email"])}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-slate-500">Mensaje</dt>
              <dd className="mt-1 text-slate-700 whitespace-pre-wrap">
                {getDataValue(data, ["Mensaje", "mensaje"])}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Tipo consulta</dt>
              <dd className="mt-1 text-slate-700">
                {getDataValue(data, ["TipoConsulta", "Tipo Consulta"])}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">País</dt>
              <dd className="mt-1 text-slate-700">
                {getDataValue(data, ["País", "Pais", "Country"])}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Fecha contacto</dt>
              <dd className="mt-1 text-slate-700">
                {getDataValue(data, ["FechaContacto", "Fecha Contacto"])}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Status</dt>
              <dd className="mt-1">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-700">
                  {getDataValue(data, ["Status", "status"])}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Calificación</dt>
              <dd className="mt-1 text-slate-700">
                {getDataValue(data, ["Calificacion", "Calificación"])}
              </dd>
            </div>
          </dl>

          <LegadoActions legadoId={id} phone={phone} />
        </div>
      </div>
    </TicketsLayout>
  );
}
