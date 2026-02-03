import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";

const createCaseTypeSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  label: z.string().min(1),
  legalType: z.string().min(1),
  color: z.string().min(1).default("slate-500"),
  order: z.number().int().min(0).default(0),
});

// GET /api/casos - Listar todos los tipos de caso
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tipos = await prisma.caseType.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ casos: tipos });
}

// POST /api/casos - Crear tipo de caso
export async function POST(req: Request) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createCaseTypeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Formato inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.caseType.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe un tipo de caso con ese slug" },
      { status: 400 }
    );
  }

  const caso = await prisma.caseType.create({
    data: parsed.data,
  });

  return NextResponse.json({ caso }, { status: 201 });
}
