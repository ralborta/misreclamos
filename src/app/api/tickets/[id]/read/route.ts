import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { ticketAccessibleByUser } from "@/lib/ticket-scope";
import { markTicketRead } from "@/lib/ticket-read";

/**
 * POST /api/tickets/[id]/read
 * Marca el ticket como leído por el usuario actual (lastReadAt = now()).
 * Idempotente. Útil para que el listado refleje "0 sin leer" al abrir el detalle.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const can = await ticketAccessibleByUser(session.user, id);
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await markTicketRead(session.user, id);
  return NextResponse.json({ ok: true });
}
