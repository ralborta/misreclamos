import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Abogado (SUPPORT): solo tickets asignados a su usuario. Admin: sin filtro. */
export function ticketWhereForUser(user: SessionUser | undefined): Prisma.TicketWhereInput {
  if (!user) return { id: "__none__" };
  if (user.role === "ADMIN") return {};
  return { assignedToUserId: user.id };
}

export function userSeesAllTickets(user: SessionUser | undefined): boolean {
  return user?.role === "ADMIN";
}

/** Combina filtros de listado (tipo, estado, etc.) con el alcance del rol. */
export function andTicketScope(
  user: SessionUser,
  ...filters: Prisma.TicketWhereInput[]
): Prisma.TicketWhereInput {
  const scope = ticketWhereForUser(user);
  const parts = [...filters];
  if (Object.keys(scope).length > 0) parts.push(scope);
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

export async function ticketAccessibleByUser(user: SessionUser, ticketId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  const t = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { assignedToUserId: true },
  });
  return !!t && t.assignedToUserId === user.id;
}
