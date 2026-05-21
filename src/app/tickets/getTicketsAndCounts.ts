import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ticketWhereForUser } from "@/lib/ticket-scope";

export type TicketListItem = {
  id: string;
  code: string;
  title: string;
  contactName: string;
  status: string;
  priority: string;
  legalType: string | null;
  caseNotes: string | null;
  lastMessageAt: string;
  createdAt: string;
  customer: { name: string | null; phone: string } | null;
  assignedTo: { name: string } | null;
  unreadCount: number;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
};

export type TicketCounts = {
  open: number;
  inProgress: number;
  waiting: number;
  urgent: number;
  resolved: number;
  closed: number;
  unread: number;
  trends: {
    open: number;
    inProgress: number;
    waiting: number;
    urgent: number;
    resolved: number;
    closed: number;
  };
};

function pctTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

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

  const ids = tickets.map((t) => t.id);

  // Mensajes INBOUND para calcular no leídos
  const inboundMessages = ids.length
    ? await prisma.ticketMessage.findMany({
        where: { ticketId: { in: ids }, direction: "INBOUND" },
        select: { ticketId: true, createdAt: true },
      })
    : [];

  // Último mensaje OUTBOUND para detectar "sin responder"
  const outboundMessages = ids.length
    ? await prisma.ticketMessage.findMany({
        where: { ticketId: { in: ids }, direction: "OUTBOUND" },
        select: { ticketId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Lecturas del usuario actual (skip si legacy)
  const reads =
    !user.legacy && ids.length
      ? await prisma.ticketRead.findMany({
          where: { userId: user.id, ticketId: { in: ids } },
          select: { ticketId: true, lastReadAt: true },
        })
      : [];

  const readMap = new Map<string, Date>(reads.map((r) => [r.ticketId, r.lastReadAt]));
  const lastInboundMap = new Map<string, Date>();
  const unreadMap = new Map<string, number>();

  for (const msg of inboundMessages) {
    const prev = lastInboundMap.get(msg.ticketId);
    if (!prev || msg.createdAt > prev) lastInboundMap.set(msg.ticketId, msg.createdAt);
    const lastRead = readMap.get(msg.ticketId);
    if (!lastRead || msg.createdAt > lastRead) {
      unreadMap.set(msg.ticketId, (unreadMap.get(msg.ticketId) || 0) + 1);
    }
  }

  const lastOutboundMap = new Map<string, Date>();
  for (const msg of outboundMessages) {
    if (!lastOutboundMap.has(msg.ticketId)) lastOutboundMap.set(msg.ticketId, msg.createdAt);
  }

  const serialized: TicketListItem[] = tickets.map((t) => ({
    id: t.id,
    code: t.code,
    title: t.title,
    contactName: t.contactName,
    status: t.status,
    priority: t.priority,
    legalType: t.legalType,
    caseNotes: t.caseNotes,
    lastMessageAt: t.lastMessageAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
    customer: t.customer ?? null,
    assignedTo: t.assignedTo ?? null,
    unreadCount: unreadMap.get(t.id) ?? 0,
    lastInboundAt: lastInboundMap.get(t.id)?.toISOString() ?? null,
    lastOutboundAt: lastOutboundMap.get(t.id)?.toISOString() ?? null,
  }));

  // Counts reales (no limitados a los 200 mostrados)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const countByStatus = async (filter: Record<string, unknown>): Promise<[number, number]> => {
    const [current, previous] = await Promise.all([
      prisma.ticket.count({ where: { ...where, ...filter } }),
      prisma.ticket.count({
        where: { ...where, ...filter, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      }),
    ]);
    return [current, previous];
  };

  const [
    [openCount, openPrev],
    [inProgressCount, inProgressPrev],
    [waitingCount, waitingPrev],
    [urgentCount, urgentPrev],
    [resolvedCount, resolvedPrev],
    [closedCount, closedPrev],
  ] = await Promise.all([
    countByStatus({ status: "OPEN" }),
    countByStatus({ status: "IN_PROGRESS" }),
    countByStatus({ status: "WAITING_CUSTOMER" }),
    countByStatus({ priority: "URGENT" }),
    countByStatus({ status: "RESOLVED" }),
    countByStatus({ status: "CLOSED" }),
  ]);

  const unreadTotal = serialized.reduce((acc, t) => acc + (t.unreadCount > 0 ? 1 : 0), 0);

  const counts: TicketCounts = {
    open: openCount,
    inProgress: inProgressCount,
    waiting: waitingCount,
    urgent: urgentCount,
    resolved: resolvedCount,
    closed: closedCount,
    unread: unreadTotal,
    trends: {
      open: pctTrend(openCount, openPrev),
      inProgress: pctTrend(inProgressCount, inProgressPrev),
      waiting: pctTrend(waitingCount, waitingPrev),
      urgent: pctTrend(urgentCount, urgentPrev),
      resolved: pctTrend(resolvedCount, resolvedPrev),
      closed: pctTrend(closedCount, closedPrev),
    },
  };

  return {
    tickets: serialized,
    counts,
  };
}
