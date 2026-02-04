import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { z } from "zod";
import { sendWhatsAppMessage } from "@/lib/builderbot";
import { sessionOptions, type SessionData } from "@/lib/auth";

const bodySchema = z.object({
  number: z.string().min(10, "Teléfono inválido"),
  message: z.string().min(1, "El mensaje no puede estar vacío"),
});

/**
 * Envía un mensaje de WhatsApp al número indicado vía BuilderBot.
 * Usado desde el detalle de un registro legado (sin ticket aún).
 */
export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let number = parsed.data.number.replace(/\D/g, "");
  if (number.length < 10) {
    return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
  }
  if (!number.startsWith("54")) number = `54${number}`;

  try {
    await sendWhatsAppMessage({
      number,
      message: parsed.data.message,
    });
    return NextResponse.json({ ok: true, sent: true });
  } catch (error: any) {
    console.error("[Legado send-message]", error?.message);
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje por BuilderBot", details: error?.message },
      { status: 500 }
    );
  }
}
