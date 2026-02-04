import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";

export const dynamic = "force-dynamic";

type LegadoData = Record<string, unknown>;

/** Busca el valor probando varias claves (Excel puede variar nombre/tilde). */
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

/** Formatea teléfono para mostrar: 5491159053212 → +54 9 11 5905-3212 */
function formatPhone(raw: string): string {
  if (!raw || raw === "—") return raw;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 10) return raw;
  if (digits.startsWith("549")) {
    const resto = digits.slice(3);
    if (resto.length >= 10) {
      return `+54 9 ${resto.slice(0, 2)} ${resto.slice(2, 6)}-${resto.slice(6)}`;
    }
    return `+54 9 ${resto}`;
  }
  if (digits.startsWith("54")) return `+54 ${digits.slice(2)}`;
  return digits.length >= 10 ? `+${digits}` : raw;
}

export default async function LegadoPage() {
  await requireSession();

  const registros = await prisma.legado.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const total = await prisma.legado.count();

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#213b5c]">Legado</h1>
          <p className="mt-1 text-sm text-[#213b5c]/70">
            {total} {total === 1 ? "registro" : "registros"} importados del Excel
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#213b5c] text-white">
                <tr>
                  <th className="w-12 px-4 py-3 text-left font-semibold"></th>
                  <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                  <th className="px-4 py-3 text-left font-semibold">eMail</th>
                  <th className="px-4 py-3 text-left font-semibold max-w-[200px]">Mensaje</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo consulta</th>
                  <th className="px-4 py-3 text-left font-semibold">País</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha contacto</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Calificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      No hay registros de legado. Usá el script <code className="rounded bg-slate-100 px-1">import-legado</code> para cargar un Excel.
                    </td>
                  </tr>
                ) : (
                  registros.map((r) => {
                    const data = (r.data as LegadoData) || {};
                    const telefonoRaw = getDataValue(data, ["Telefono", "Teléfono", "telefono", "Phone", "Tel"]);
                    const mensaje = getDataValue(data, ["Mensaje", "mensaje"]);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/legado/${r.id}`}
                            className="inline-flex rounded-lg bg-[#213b5c] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#f7941d]"
                          >
                            Ver
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {formatPhone(telefonoRaw)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {getDataValue(data, ["eMail", "E-mail", "email", "Email"])}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-600" title={mensaje}>
                          {mensaje}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {getDataValue(data, ["TipoConsulta", "Tipo Consulta", "tipo_consulta"])}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getDataValue(data, ["País", "Pais", "Country", "país"])}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {getDataValue(data, ["FechaContacto", "Fecha Contacto", "Fecha", "fecha_contacto"])}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {getDataValue(data, ["Status", "status", "Estado"])}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getDataValue(data, ["Calificacion", "Calificación", "calificacion"])}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {total > 500 && (
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Mostrando los últimos 500 de {total} registros.
            </p>
          )}
        </div>
      </div>
    </TicketsLayout>
  );
}
