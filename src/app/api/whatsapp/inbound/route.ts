import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/builderbot";
import { generateTicketCode } from "@/lib/tickets";
// Using string literals instead of Prisma enums for compatibility

// Schema para el formato de BuilderBot.cloud
const builderbotWebhookSchema = z.object({
  eventName: z.string(),
  data: z.object({
    body: z.string().optional(),
    name: z.string().optional(),
    from: z.string(),
    attachment: z.array(z.any()).optional(),
    projectId: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  console.log("📩 Webhook recibido de BuilderBot:", JSON.stringify(payload, null, 2));

  const parsed = builderbotWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("❌ Formato inválido:", parsed.error.flatten());
    return NextResponse.json({ error: "Formato inválido", details: parsed.error.flatten() }, { status: 400 });
  }

  const { eventName, data } = parsed.data;

  // Solo procesar mensajes entrantes
  if (eventName !== "message.incoming") {
    console.log(`ℹ️ Evento ignorado: ${eventName}`);
    return NextResponse.json({ ok: true, message: `Evento ${eventName} recibido pero no procesado` });
  }

  const messageText = data.body || "";
  const customerPhone = data.from;
  const customerName = data.name;

  if (!messageText) {
    console.warn("⚠️ Mensaje sin texto");
    return NextResponse.json({ ok: true, message: "Mensaje sin texto, ignorado" });
  }

  // Generar un messageId único basado en el contenido y timestamp
  const messageId = `${customerPhone}-${Date.now()}`;

  // Idempotencia por external message id
  const existing = await prisma.ticketMessage.findFirst({
    where: { 
      externalMessageId: messageId,
    },
  });
  
  if (existing) {
    console.log("ℹ️ Mensaje duplicado, ignorando");
    return NextResponse.json({
      ok: true,
      ticketId: existing.ticketId,
      idempotent: true,
    });
  }

  const customer = await prisma.customer.upsert({
    where: { phone: customerPhone },
    update: { name: customerName ?? undefined },
    create: { phone: customerPhone, name: customerName },
  });

  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 48);
  let ticket = await prisma.ticket.findFirst({
    where: {
      customerId: customer.id,
      status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
      lastMessageAt: { gte: cutoff },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const isNewTicket = !ticket;

  if (!ticket) {
    ticket = await prisma.ticket.create({
      data: {
        code: generateTicketCode(),
        customerId: customer.id,
        title: messageText.split(" ").slice(0, 8).join(" ") || "Consulta",
        status: "OPEN",
        priority: "NORMAL",
        category: inferCategory(messageText) as "TECH_SUPPORT" | "BILLING" | "SALES" | "OTHER",
        channel: "WHATSAPP",
      },
    });
    console.log(`🎫 Nuevo ticket creado: ${ticket.code}`);
  } else {
    console.log(`🎫 Ticket existente: ${ticket.code}`);
  }

  const heuristics = inferPriorityAndCategory(messageText, undefined, ticket.priority, ticket.category);

  const previousMessagesCount = await prisma.ticketMessage.count({ where: { ticketId: ticket.id } });

  const shouldEscalate = decideShouldEscalate({
    text: messageText,
    priority: heuristics.priority,
    previousMessages: previousMessagesCount,
  });

  const rawPayload = payload as any;

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      direction: "INBOUND",
      from: "CUSTOMER",
      text: messageText,
      rawPayload,
      externalMessageId: messageId,
    },
  });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      priority: heuristics.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
      category: heuristics.category as "TECH_SUPPORT" | "BILLING" | "SALES" | "OTHER",
      status: shouldEscalate ? "IN_PROGRESS" : ticket.status,
      lastMessageAt: new Date(),
    },
  });

  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      type: shouldEscalate ? "ESCALATED" : "AUTO_REPLY",
      payload: {
        message: messageText,
        escalated: shouldEscalate,
      },
    },
  });

  // Decidir si enviar respuesta automática
  let autoReplyMessage: string | null = null;

  if (shouldEscalate) {
    autoReplyMessage = `Hola! Tu consulta ha sido escalada a nuestro equipo. Ticket: *${ticket.code}*. Te responderemos pronto.`;
  } else if (isNewTicket) {
    autoReplyMessage = `Hola! Hemos recibido tu mensaje. Ticket: *${ticket.code}*. Un agente lo revisará pronto.`;
  }

  // Enviar respuesta automática si corresponde
  if (autoReplyMessage) {
    try {
      await sendWhatsAppMessage({
        number: customerPhone,
        message: autoReplyMessage,
      });
      console.log(`✅ Respuesta automática enviada a ${customerPhone}`);

      // Registrar la respuesta automática en el ticket
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          direction: "OUTBOUND",
          from: "BOT",
          text: autoReplyMessage,
          rawPayload: { autoReply: true, timestamp: new Date().toISOString() },
        },
      });
    } catch (error) {
      console.error("❌ Error al enviar respuesta automática:", error);
      // No fallar el webhook si falla el envío
    }
  }

  return NextResponse.json({ 
    ok: true, 
    ticketId: ticket.id, 
    ticketCode: ticket.code,
    escalated: shouldEscalate,
    autoReplySent: !!autoReplyMessage,
  });
}

function inferPriorityAndCategory(
  text: string,
  metadata: Record<string, unknown> | undefined,
  currentPriority: string,
  currentCategory: string,
) {
  const lower = text.toLowerCase();
  let priority: string = currentPriority;
  let category: string = currentCategory;

  if (/(urgente|producci[óo]n|ca[ií]do|no anda|error)/.test(lower)) {
    priority = "HIGH";
  }
  if (/(amenaza|legal|fraude|cliente enojado)/.test(lower)) {
    priority = "URGENT";
  }
  if (/(factura|pago|precio)/.test(lower)) {
    category = "BILLING";
  }
  if (/(walter|emilia|silvia|oscar|max)/.test(lower)) {
    category = "TECH_SUPPORT";
  }
  if (metadata && typeof metadata["priority"] === "string") {
    const metaPriority = metadata["priority"] as string;
    if (metaPriority.toLowerCase() === "urgent") {
      priority = "URGENT";
    }
  }
  return { priority, category };
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/(factura|pago|precio)/.test(lower)) return "BILLING";
  if (/(walter|emilia|silvia|oscar|max)/.test(lower)) return "TECH_SUPPORT";
  return "TECH_SUPPORT";
}

function decideShouldEscalate({
  text,
  priority,
  previousMessages,
}: {
  text: string;
  priority: string;
  previousMessages: number;
}): boolean {
  const lower = text.toLowerCase();

  // Escalate if priority is URGENT
  if (priority === "URGENT") {
    return true;
  }

  // Escalate if contains critical keywords
  if (/(amenaza|legal|fraude|cliente enojado|escala|denuncia)/.test(lower)) {
    return true;
  }

  // Escalate if there are already 3+ messages in the ticket
  if (previousMessages >= 3) {
    return true;
  }

  return false;
}
