import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { generateTicketCode } from "@/lib/tickets";

function getStr(data: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = data[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const legado = await prisma.legado.findUnique({ where: { id } });
  if (!legado) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  const data = (legado.data as Record<string, unknown>) || {};
  const phoneRaw = getStr(data, ["Telefono", "Teléfono", "telefono", "Phone", "Tel"]);
  const phone = phoneRaw?.replace(/\D/g, "") || null;
  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { error: "El registro no tiene un teléfono válido para migrar" },
      { status: 400 }
    );
  }

  const name = getStr(data, ["Nombre", "nombre", "Empresa", "empresa"]) || "Cliente legado";
  const contactName = getStr(data, ["Contacto", "contacto", "Nombre", "nombre"]) || name;
  const title = getStr(data, ["Mensaje", "mensaje"])?.slice(0, 200) || "Caso migrado desde legado";
  const legalType = getStr(data, ["TipoConsulta", "Tipo Consulta", "tipo_consulta"]) || null;
  const email = getStr(data, ["eMail", "email", "Email"]) || null;

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name, email: email ?? undefined },
    create: { phone, name, email: email ?? undefined },
  });

  const ticket = await prisma.ticket.create({
    data: {
      code: generateTicketCode(),
      customerId: customer.id,
      contactName,
      title,
      status: "OPEN",
      priority: "NORMAL",
      category: "OTRO",
      channel: "WHATSAPP",
      legalType,
    },
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id, ticketCode: ticket.code });
}
