import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { classifyLegalType } from "@/lib/openai";

/**
 * POST /api/tickets/[id]/classify-type
 * Clasifica el tipo de caso según la conversación (IA) y actualiza el ticket.
 */
export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Reclamo no encontrado" }, { status: 404 });
  }

  if (ticket.messages.length === 0) {
    return NextResponse.json(
      { error: "No hay mensajes para clasificar", legalType: null },
      { status: 400 }
    );
  }

  const conversationMessages = ticket.messages.map((m) => ({
    from: m.from,
    text: m.text,
    createdAt: m.createdAt,
  }));

  const legalType = await classifyLegalType(conversationMessages);

  if (legalType) {
    await prisma.ticket.update({
      where: { id },
      data: { legalType },
    });
  }

  return NextResponse.json({
    ok: true,
    legalType,
    message: legalType
      ? `Clasificado como: ${legalType}`
      : "No se pudo determinar el tipo de caso.",
  });
}
