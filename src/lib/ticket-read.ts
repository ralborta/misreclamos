import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

/**
 * Marca el ticket como leído por el usuario backoffice (idempotente).
 * - No hace nada si la sesión es legacy (no existe fila en AgentUser).
 * - No hace nada si el AgentUser no existe (fk inválida).
 */
export async function markTicketRead(user: SessionUser, ticketId: string): Promise<void> {
  if (!user || user.legacy) return;
  try {
    const exists = await prisma.agentUser.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    if (!exists) return;
    await prisma.ticketRead.upsert({
      where: { ticketId_userId: { ticketId, userId: user.id } },
      update: { lastReadAt: new Date() },
      create: { ticketId, userId: user.id, lastReadAt: new Date() },
    });
  } catch (error: any) {
    console.error("[markTicketRead] error:", error?.message);
  }
}
