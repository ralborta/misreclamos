import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeUsername, verifyPassword } from "@/lib/password";
import { sessionOptions, type SessionData } from "@/lib/auth";

/**
 * Login con usuario + contraseña vinculados a AgentUser.
 * Respaldo opcional: LEGACY_ADMIN_USERNAME + APP_PASSWORD (misma contraseña global) para emergencias.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as { username?: string; password?: string }));
  const usernameRaw = body.username;
  const password = body.password;

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Ingresá usuario y contraseña" }, { status: 400 });
  }
  if (!usernameRaw || typeof usernameRaw !== "string") {
    return NextResponse.json({ error: "Ingresá usuario y contraseña" }, { status: 400 });
  }

  const username = normalizeUsername(usernameRaw);

  const agent = await prisma.agentUser.findFirst({
    where: { username },
  });

  if (agent?.passwordHash) {
    const ok = await verifyPassword(password, agent.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.user = {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      role: agent.role,
    };
    await session.save();
    return NextResponse.json({ ok: true });
  }

  // Respaldo legacy: solo si APP_PASSWORD está definido (migración gradual)
  const legacyPass = process.env.APP_PASSWORD;
  const legacyUser = (process.env.LEGACY_ADMIN_USERNAME || "admin").trim().toLowerCase();
  if (legacyPass && password === legacyPass && username === legacyUser) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.user = {
      id: "legacy-admin",
      name: "Administrador",
      role: "ADMIN",
      legacy: true,
    };
    await session.save();
    return NextResponse.json({ ok: true, warning: "Sesión legacy: creá usuarios en AgentUser y desactivá APP_PASSWORD" });
  }

  if (agent && !agent.passwordHash) {
    return NextResponse.json(
      { error: "Este usuario aún no tiene contraseña. Pedile a un administrador que la configure." },
      { status: 401 }
    );
  }

  return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
}
