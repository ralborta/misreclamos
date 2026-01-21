import { PrismaClient } from "@prisma/client";

// Prisma singleton para evitar conexiones duplicadas en dev
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Verificar que DATABASE_URL esté configurado
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL no está configurado. Algunas funcionalidades no estarán disponibles.");
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
