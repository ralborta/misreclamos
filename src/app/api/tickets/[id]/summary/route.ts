import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { summarizeConversation, classifyLegalType, inferPriorityFromConversation } from "@/lib/openai";

/**
 * POST /api/tickets/[id]/summary
 * Genera un resumen actualizado de la conversación con IA
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Obtener el ticket con todos sus mensajes
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Reclamo no encontrado" },
        { status: 404 }
      );
    }

    if (ticket.messages.length === 0) {
      return NextResponse.json({
        ok: true,
        aiSummary: "No hay mensajes aún en esta conversación.",
      });
    }

    console.log(`[Summary] Generando resumen para reclamo ${ticket.code} con ${ticket.messages.length} mensajes`);

    // Formatear mensajes para OpenAI
    const conversationMessages = ticket.messages.map((msg) => ({
      from: msg.from,
      text: msg.text,
      createdAt: msg.createdAt,
    }));

    // Generar resumen con IA
    const aiSummary = await summarizeConversation(conversationMessages);

    let legalType: string | null = ticket.legalType;
    let priority = ticket.priority;

    if (process.env.OPENAI_API_KEY) {
      const [classified, inferredPriority] = await Promise.all([
        classifyLegalType(conversationMessages),
        inferPriorityFromConversation(conversationMessages),
      ]);

      if (classified) {
        legalType = classified;
        console.log(`[Summary] Tipo de caso: ${classified}`);
      }
      if (inferredPriority) {
        priority = inferredPriority;
        console.log(`[Summary] Prioridad: ${inferredPriority}`);
      }
    }

    // Una sola escritura a la DB con todo para que persista bien
    const updateData: {
      aiSummary: string;
      legalType?: string | null;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    } = { aiSummary };
    if (legalType != null) updateData.legalType = legalType;
    if (priority != null) updateData.priority = priority;

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    console.log(`[Summary] ✅ DB actualizada: resumen, legalType=${updated.legalType}, priority=${updated.priority}`);

    return NextResponse.json({
      ok: true,
      aiSummary,
      messagesCount: ticket.messages.length,
      legalType: legalType ?? undefined,
      priority,
    });
  } catch (error: any) {
    console.error("[Summary] Error:", error);
    return NextResponse.json(
      { error: "Error al generar resumen", details: error.message },
      { status: 500 }
    );
  }
}
