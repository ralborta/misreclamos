import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";

const updateCaseTypeSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  label: z.string().min(1).optional(),
  legalType: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
});

// GET /api/casos/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const caso = await prisma.caseType.findUnique({ where: { id } });

  if (!caso) {
    return NextResponse.json({ error: "Tipo de caso no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ caso });
}

// PATCH /api/casos/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = updateCaseTypeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Formato inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.slug) {
    const existing = await prisma.caseType.findFirst({
      where: { slug: parsed.data.slug, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe otro tipo de caso con ese slug" },
        { status: 400 }
      );
    }
  }

  const caso = await prisma.caseType.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ caso });
}

// DELETE /api/casos/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const caso = await prisma.caseType.findUnique({ where: { id } });
  if (!caso) {
    return NextResponse.json({ error: "Tipo de caso no encontrado" }, { status: 404 });
  }

  await prisma.caseType.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
