import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionOptions, type SessionData } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as { password?: string }));
  const password = body.password;

  // Si APP_PASSWORD no está configurado, permitir login sin password (solo para desarrollo)
  if (!process.env.APP_PASSWORD) {
    console.warn("⚠️ APP_PASSWORD no configurada - permitiendo login sin validación");
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.user = {
      id: "admin",
      role: "ADMIN",
      name: "Operador",
    };
    await session.save();
    return NextResponse.json({ ok: true, warning: "APP_PASSWORD no configurada" });
  }

  // Si APP_PASSWORD está configurado, validar password
  if (!password || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.user = {
    id: "admin",
    role: "ADMIN",
    name: "Operador",
  };
  await session.save();

  return NextResponse.json({ ok: true });
}
