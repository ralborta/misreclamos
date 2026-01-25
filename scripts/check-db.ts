#!/usr/bin/env tsx
/**
 * Script para verificar el estado de la base de datos
 * Uso: npx tsx scripts/check-db.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Verificando conexión a la base de datos...\n");

    // Verificar conexión
    await prisma.$connect();
    console.log("✅ Conexión a la base de datos exitosa\n");

    // Verificar tablas
    console.log("📊 Verificando tablas...\n");

    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log(`✅ Tablas encontradas (${tables.length}):`);
    tables.forEach((t) => console.log(`   - ${t.tablename}`));
    console.log();

    // Verificar si las tablas principales existen
    const requiredTables = ["Customer", "AgentUser", "Ticket", "TicketMessage"];
    const existingTables = tables.map((t) => t.tablename);
    const missingTables = requiredTables.filter((t) => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log("❌ Tablas faltantes:");
      missingTables.forEach((t) => console.log(`   - ${t}`));
      console.log("\n⚠️  La base de datos NO está completamente configurada.");
      console.log("   Ejecuta las migraciones: pnpm prisma migrate deploy");
      process.exit(1);
    }

    // Verificar campos nuevos (legales)
    console.log("🔍 Verificando campos legales...\n");

    const customerColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Customer' AND column_name IN ('dni', 'email', 'address', 'dateOfBirth', 'notes', 'updatedAt');
    `;

    const ticketColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Ticket' AND column_name IN ('expedienteNumber', 'court', 'legalType', 'amount', 'importantDates', 'caseNotes');
    `;

    const agentColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'AgentUser' AND column_name IN ('matricula', 'especializacion', 'updatedAt');
    `;

    console.log(`✅ Campos legales en Customer: ${customerColumns.length}/6`);
    console.log(`✅ Campos procesales en Ticket: ${ticketColumns.length}/6`);
    console.log(`✅ Campos profesionales en AgentUser: ${agentColumns.length}/3`);
    console.log();

    if (
      customerColumns.length < 6 ||
      ticketColumns.length < 6 ||
      agentColumns.length < 3
    ) {
      console.log("⚠️  Faltan algunos campos legales.");
      console.log("   Ejecuta la migración: pnpm prisma migrate deploy");
      console.log("   O aplica manualmente: prisma/migrations/20250130000000_add_legal_fields/migration.sql");
    }

    // Verificar enum de categorías
    console.log("🔍 Verificando categorías legales...\n");

    const categoryEnum = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TicketCategory')
      ORDER BY enumsortorder;
    `;

    const legalCategories = [
      "LABORAL",
      "CIVIL",
      "COMERCIAL",
      "PENAL",
      "FAMILIA",
      "ADMINISTRATIVO",
      "TRIBUTARIO",
      "PREVISIONAL",
      "OTRO",
    ];

    const existingCategories = categoryEnum.map((e) => e.enumlabel);
    const hasLegalCategories = legalCategories.every((c) =>
      existingCategories.includes(c)
    );

    if (hasLegalCategories) {
      console.log("✅ Categorías legales configuradas correctamente");
      console.log(`   Categorías: ${existingCategories.join(", ")}`);
    } else {
      console.log("⚠️  Las categorías legales no están configuradas.");
      console.log("   Ejecuta la migración: prisma/migrations/20250130000000_add_legal_fields/migration.sql");
    }

    console.log("\n✅ Base de datos verificada correctamente");
  } catch (error: any) {
    console.error("\n❌ Error al verificar la base de datos:");
    console.error(error.message);

    if (error.message.includes("P1001") || error.message.includes("connect")) {
      console.error("\n⚠️  No se pudo conectar a la base de datos.");
      console.error("   Verifica que DATABASE_URL esté configurado correctamente.");
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
