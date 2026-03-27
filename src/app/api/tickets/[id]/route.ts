import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin, sessionOptions, type SessionData } from "@/lib/auth";
import { ticketAccessibleByUser } from "@/lib/ticket-scope";
import { sendWhatsAppMessage } from "@/lib/builderbot";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await ticketAccessibleByUser(session.user, id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { customer: true, assignedTo: true, messages: true },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedToUserId: z.string().optional().nullable(),
  legalType: z.string().optional().nullable(),
  caseNotes: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const can = await ticketAccessibleByUser(session.user, id);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formato inválido", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!isAdmin(session.user) && parsed.data.assignedToUserId !== undefined) {
    return NextResponse.json(
      { error: "Solo un administrador puede asignar o reasignar el caso a otro abogado" },
      { status: 403 }
    );
  }

  // Obtener el ticket actual para comparar cambios
  const currentTicket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedTo: true,
    },
  });

  if (!currentTicket) {
    return NextResponse.json({ error: "Reclamo no encontrado" }, { status: 404 });
  }

  // Detectar si se está asignando a un nuevo agente
  const isNewAssignment = 
    parsed.data.assignedToUserId !== undefined &&
    parsed.data.assignedToUserId !== currentTicket.assignedToUserId &&
    parsed.data.assignedToUserId !== null;

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...parsed.data,
    },
    include: {
      customer: true,
      assignedTo: true,
    },
  });

  // Si se asignó a un nuevo agente, enviar notificación por WhatsApp
  if (isNewAssignment && ticket.assignedTo) {
    try {
      const summary = ticket.aiSummary || "No hay resumen disponible aún.";
      const message = `🎫 *Nuevo reclamo asignado*\n\n` +
        `Reclamo: *${ticket.code}*\n` +
        `Cliente: ${ticket.customer?.name || ticket.customer?.phone}\n` +
        `Prioridad: ${ticket.priority}\n` +
        `Estado: ${ticket.status}\n\n` +
        `📋 *Resumen:*\n${summary}\n\n` +
        `👉 Ver en panel: [URL_DEL_PANEL]/tickets/${ticket.id}`;

      await sendWhatsAppMessage({
        number: ticket.assignedTo.phone,
        message,
      });

      console.log(`[Tickets] ✅ Notificación enviada a ${ticket.assignedTo.name} (${ticket.assignedTo.phone})`);
    } catch (error: any) {
      console.error(`[Tickets] ⚠️ Error al notificar al abogado:`, error.message);
      // No fallar si la notificación falla
    }
  }

  return NextResponse.json({ ticket });
}
