import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ticketWhereForUser } from "@/lib/ticket-scope";

export async function getTicketsAndCounts(user: SessionUser) {
  const where = ticketWhereForUser(user);
  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      id: true,
      code: true,
      title: true,
      contactName: true,
      status: true,
      priority: true,
      legalType: true,
      caseNotes: true,
      lastMessageAt: true,
      createdAt: true,
      customer: {
        select: { name: true, phone: true },
      },
      assignedTo: {
        select: { name: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
  });

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const waitingCount = tickets.filter((t) => t.status === "WAITING_CUSTOMER").length;
  const urgentCount = tickets.filter((t) => t.priority === "URGENT").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const closedCount = tickets.filter((t) => t.status === "CLOSED").length;

  const serialized = tickets.map((t) => ({
    ...t,
    lastMessageAt: t.lastMessageAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }));

  return {
    tickets: serialized,
    counts: {
      open: openCount,
      inProgress: inProgressCount,
      waiting: waitingCount,
      urgent: urgentCount,
      resolved: resolvedCount,
      closed: closedCount,
    },
  };
}
