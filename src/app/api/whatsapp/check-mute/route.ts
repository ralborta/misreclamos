import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Limpia el número a solo dígitos para buscar en DB */
function normalizePhone(input: string): string {
  return String(input || "").replace(/\D/g, "");
}

/**
 * GET /api/whatsapp/check-mute?phone=5491112345678
 *
 * Para que BuilderBot consulte si debe responder o no a un número.
 * Si el cliente tiene bot pausado (muted), BuilderBot puede no ejecutar sus flows.
 * Devuelve: { muted: boolean }
 */
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Falta query param: phone" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  if (normalized.length < 9) {
    return NextResponse.json({ error: "Número inválido" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [{ phone: normalized }, { phone: `+${normalized}` }],
    },
    select: { botPausedAt: true },
  });

  const muted = !!customer?.botPausedAt;

  return NextResponse.json({ muted });
}
