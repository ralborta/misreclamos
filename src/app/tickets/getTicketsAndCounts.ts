import { prisma } from "@/lib/db";

export async function getTicketsAndCounts() {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      contactName: true,
      status: true,
      priority: true,
      legalType: true,
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
