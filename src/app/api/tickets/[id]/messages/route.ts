import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { sessionOptions, type SessionData } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/builderbot";
import { summarizeConversation } from "@/lib/openai";
import { uploadFileToBlob } from "@/lib/blob";

const messageSchema = z.object({
  text: z.string().min(1),
  direction: z.enum(["INBOUND", "OUTBOUND", "INTERNAL_NOTE"]).default("OUTBOUND"),
  from: z.enum(["CUSTOMER", "BOT", "HUMAN"]).default("HUMAN"),
  rawPayload: z.record(z.string(), z.any()).optional(),
});

function getMimeTypeLabel(mime: string): string {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

function json500(error: string, details?: string) {
  return NextResponse.json(
    { error, details: details || error },
    { status: 500 }
  );
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    let text: string;
    let direction: "INBOUND" | "OUTBOUND" | "INTERNAL_NOTE" = "OUTBOUND";
    let from: "CUSTOMER" | "BOT" | "HUMAN" = "HUMAN";
    let rawPayload: Record<string, unknown> = {};
    let attachments: { url: string; type: string; name: string }[] = [];

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = (formData.get("text") as string)?.trim() || "";
      direction = (formData.get("direction") as typeof direction) || "OUTBOUND";
      from = (formData.get("from") as typeof from) || "HUMAN";
      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        try {
          const url = await uploadFileToBlob(file);
          attachments.push({
            url,
            type: getMimeTypeLabel(file.type),
            name: file.name || "archivo",
          });
        } catch (uploadErr: unknown) {
          const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          console.error("[Messages] Error subiendo adjunto:", msg);
          return json500("No se pudo subir el archivo", msg);
        }
      }
      if (!text.trim() && attachments.length === 0) {
        return NextResponse.json({ error: "Escribe un mensaje o adjunta un archivo" }, { status: 400 });
      }
    } else {
      const json = await req.json().catch(() => null);
      const parsed = messageSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "Formato inválido", details: parsed.error.flatten() }, { status: 400 });
      }
      text = parsed.data.text;
      direction = parsed.data.direction;
      from = parsed.data.from;
      rawPayload = parsed.data.rawPayload || {};
    }

    const messageText = text.trim() || (attachments.length > 0 ? "[Archivo adjunto]" : "");
    if (!messageText) {
      return NextResponse.json({ error: "Texto o adjunto requerido" }, { status: 400 });
    }

    if (direction === "OUTBOUND") {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { customer: true },
      });

      if (!ticket) {
        return NextResponse.json({ error: "Reclamo no encontrado" }, { status: 404 });
      }

      if (!ticket.customer?.phone) {
        return NextResponse.json({ error: "Cliente sin teléfono registrado" }, { status: 400 });
      }

      try {
        const mediaUrl = attachments.length > 0 ? attachments[0].url : undefined;
        await sendWhatsAppMessage({
          number: ticket.customer.phone,
          message: text.trim() || " ",
          mediaUrl,
        });
        console.log(`[Messages] ✅ Mensaje enviado a ${ticket.customer.phone}${mediaUrl ? " (con adjunto)" : ""}`);
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error(`[Messages] ❌ Error al enviar mensaje:`, error);
        return json500("No se pudo enviar el mensaje al cliente", err?.message);
      }
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        direction,
        from,
        text: messageText,
        attachments: attachments.length > 0 ? (attachments as Prisma.InputJsonValue) : undefined,
        rawPayload: rawPayload as Prisma.InputJsonValue,
      },
    });

    // Si el agente envió desde el backoffice, puede que el webhook ya haya guardado el mismo mensaje como BOT; borrar ese duplicado
    if (direction === "OUTBOUND" && from === "HUMAN") {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      const normalized = (messageText || "").trim().replace(/\s+/g, " ");
      const botDuplicates = await prisma.ticketMessage.findMany({
        where: {
          ticketId: id,
          from: "BOT",
          direction: "OUTBOUND",
          createdAt: { gte: twoMinAgo },
          id: { not: message.id },
        },
      });
      for (const botMsg of botDuplicates) {
        const botText = (botMsg.text || "").trim().replace(/\s+/g, " ");
        if (botText === normalized || botText.includes(normalized) || normalized.includes(botText)) {
          await prisma.ticketMessage.delete({ where: { id: botMsg.id } });
          console.log(`[Messages] Eliminado duplicado Bot (mismo texto que Agente) id=${botMsg.id}`);
          break;
        }
      }
    }

    await prisma.ticket.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        status: direction === "OUTBOUND" ? "WAITING_CUSTOMER" : undefined,
      },
    });

    try {
      const allMessages = await prisma.ticketMessage.findMany({
        where: { ticketId: id },
        orderBy: { createdAt: "asc" },
      });
      const conversationMessages = allMessages.map((msg) => ({
        from: msg.from,
        text: msg.text,
        createdAt: msg.createdAt,
      }));
      const aiSummary = await summarizeConversation(conversationMessages);
      await prisma.ticket.update({
        where: { id },
        data: { aiSummary },
      });
      console.log(`[Messages] ✅ Resumen actualizado para reclamo ${id}`);
    } catch (error: unknown) {
      console.error(`[Messages] ⚠️ Error al actualizar resumen:`, error instanceof Error ? error.message : error);
    }

    return NextResponse.json({ message, sent: direction === "OUTBOUND" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Messages] Error inesperado:", err);
    return json500("Error al procesar el mensaje", msg);
  }
}
