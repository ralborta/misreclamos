/**
 * Script para borrar TODOS los datos de la base de datos (dejar en 0).
 * Ejecutar con: BORRAR_DATOS=yes pnpm run db:reset-data
 *
 * Requiere confirmación: variable de entorno BORRAR_DATOS=yes
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.BORRAR_DATOS !== "yes") {
    console.error("⚠️  Para borrar todos los datos, ejecuta:");
    console.error('   BORRAR_DATOS=yes pnpm run db:reset-data');
    process.exit(1);
  }

  console.log("🗑️  Borrando todos los datos (orden: hijos → padres)...\n");

  const ticketMessages = await prisma.ticketMessage.deleteMany({});
  console.log(`   TicketMessage: ${ticketMessages.count} eliminados`);

  const ticketEvents = await prisma.ticketEvent.deleteMany({});
  console.log(`   TicketEvent: ${ticketEvents.count} eliminados`);

  const ticketTags = await prisma.ticketTag.deleteMany({});
  console.log(`   TicketTag: ${ticketTags.count} eliminados`);

  const tickets = await prisma.ticket.deleteMany({});
  console.log(`   Ticket: ${tickets.count} eliminados`);

  const customers = await prisma.customer.deleteMany({});
  console.log(`   Customer: ${customers.count} eliminados`);

  const legados = await prisma.legado.deleteMany({});
  console.log(`   Legado: ${legados.count} eliminados`);

  const tags = await prisma.tag.deleteMany({});
  console.log(`   Tag: ${tags.count} eliminados`);

  const agentUsers = await prisma.agentUser.deleteMany({});
  console.log(`   AgentUser: ${agentUsers.count} eliminados`);

  const caseTypes = await prisma.caseType.deleteMany({});
  console.log(`   CaseType: ${caseTypes.count} eliminados`);

  console.log("\n✅ Base de datos en 0. Todos los datos fueron eliminados.");
  console.log("   (Tipos de caso quedaron en 0; puedes crearlos de nuevo desde la UI en /casos)");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
