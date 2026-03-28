import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, normalizeUsername } from "@/lib/password";

const bodySchema = z.object({
  username: z.string().min(2).max(64),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(32),
});

/** Solo permitido si todavía no existe ningún AgentUser con contraseña (primer arranque). */
export async function POST(req: Request) {
  const withPassword = await prisma.agentUser.count({
    where: { passwordHash: { not: null } },
  });
  if (withPassword > 0) {
    return NextResponse.json(
      { error: "El sistema ya fue configurado. Iniciá sesión con tu usuario." },
      { status: 403 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { password, name, email, phone } = parsed.data;
  const username = normalizeUsername(parsed.data.username);
  const phoneNorm = phone.replace(/\s|-/g, "");
  const passwordHash = await hashPassword(password);

  let existing =
    (await prisma.agentUser.findUnique({ where: { email } })) ??
    (await prisma.agentUser.findFirst({ where: { username } }));

  if (existing?.passwordHash) {
    return NextResponse.json({ error: "Ese email o usuario ya tiene contraseña." }, { status: 400 });
  }

  if (existing) {
    try {
      await prisma.agentUser.update({
        where: { id: existing.id },
        data: {
          name,
          email,
          phone: phoneNorm,
          role: "ADMIN",
          username,
          passwordHash,
        },
      });
    } catch {
      return NextResponse.json(
        { error: "El email o usuario choca con otro registro. Probá otros valores." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.agentUser.create({
      data: {
        name,
        email,
        phone: phoneNorm,
        role: "ADMIN",
        username,
        passwordHash,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear: ¿email o usuario duplicado?" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
