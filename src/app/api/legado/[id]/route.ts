import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const legado = await prisma.legado.findUnique({ where: { id } });
  if (!legado) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  return NextResponse.json({ legado });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const legado = await prisma.legado.findUnique({ where: { id } });
  if (!legado) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  await prisma.legado.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
