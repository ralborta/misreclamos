import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin, sessionOptions, type SessionData } from "@/lib/auth";
import { hashPassword, normalizeUsername } from "@/lib/password";

const patchSchema = z.object({
  username: z.string().min(2).max(64).optional(),
  password: z.string().min(8).max(128).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user || !isAdmin(session.user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data: { username?: string; passwordHash?: string } = {};
  if (parsed.data.username !== undefined) {
    const u = normalizeUsername(parsed.data.username);
    const clash = await prisma.agentUser.findFirst({
      where: { username: u, NOT: { id } },
    });
    if (clash) {
      return NextResponse.json({ error: "Ese nombre de usuario ya existe" }, { status: 400 });
    }
    data.username = u;
  }
  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.agentUser.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, username: true, role: true },
  });

  return NextResponse.json({ ok: true, agent: updated });
}
