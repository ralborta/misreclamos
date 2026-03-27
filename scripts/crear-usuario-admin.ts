/**
 * Crea o actualiza el primer usuario administrador con contraseña (bcrypt).
 * Uso: pnpm exec tsx scripts/crear-usuario-admin.ts
 *
 * Variables opcionales en .env:
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_NAME
 *   BOOTSTRAP_ADMIN_PHONE
 *   BOOTSTRAP_ADMIN_USERNAME
 *   BOOTSTRAP_ADMIN_PASSWORD
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@misreclamos.local";
  const name = process.env.BOOTSTRAP_ADMIN_NAME || "Administrador";
  const phone = process.env.BOOTSTRAP_ADMIN_PHONE || "5490000000000";
  const username = (process.env.BOOTSTRAP_ADMIN_USERNAME || "admin").trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    console.error("Definí BOOTSTRAP_ADMIN_PASSWORD en .env (mínimo 8 caracteres).");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.agentUser.findFirst({ where: { email } });
  if (existing) {
    await prisma.agentUser.update({
      where: { id: existing.id },
      data: { username, passwordHash: hash, role: "ADMIN" },
    });
    console.log(`Usuario actualizado: ${username} (${email})`);
  } else {
    await prisma.agentUser.create({
      data: {
        email,
        name,
        phone,
        role: "ADMIN",
        username,
        passwordHash: hash,
      },
    });
    console.log(`Administrador creado: ${username} (${email})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
