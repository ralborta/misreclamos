-- AlterEnum: Cambiar categorías a tipos legales
-- Primero, actualizar los valores existentes a OTRO si los hay
UPDATE "Ticket" SET category = 'OTRO' WHERE category IN ('TECH_SUPPORT', 'BILLING', 'SALES', 'OTHER');

-- Eliminar el enum antiguo y crear el nuevo
ALTER TYPE "TicketCategory" RENAME TO "TicketCategory_old";
CREATE TYPE "TicketCategory" AS ENUM ('LABORAL', 'CIVIL', 'COMERCIAL', 'PENAL', 'FAMILIA', 'ADMINISTRATIVO', 'TRIBUTARIO', 'PREVISIONAL', 'OTRO');
ALTER TABLE "Ticket" ALTER COLUMN "category" TYPE "TicketCategory" USING category::text::"TicketCategory";
DROP TYPE "TicketCategory_old";

-- AlterTable: Agregar campos legales a Customer
ALTER TABLE "Customer" ADD COLUMN "dni" TEXT;
ALTER TABLE "Customer" ADD COLUMN "email" TEXT;
ALTER TABLE "Customer" ADD COLUMN "address" TEXT;
ALTER TABLE "Customer" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "notes" TEXT;
ALTER TABLE "Customer" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Customer_dni_idx" ON "Customer"("dni");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");

-- AlterTable: Agregar campos profesionales a AgentUser
ALTER TABLE "AgentUser" ADD COLUMN "matricula" TEXT;
ALTER TABLE "AgentUser" ADD COLUMN "especializacion" TEXT;
ALTER TABLE "AgentUser" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Agregar campos procesales a Ticket
ALTER TABLE "Ticket" ADD COLUMN "expedienteNumber" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "court" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "legalType" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "amount" DECIMAL(65,30);
ALTER TABLE "Ticket" ADD COLUMN "importantDates" JSONB;
ALTER TABLE "Ticket" ADD COLUMN "caseNotes" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ticket_expedienteNumber_idx" ON "Ticket"("expedienteNumber");
CREATE INDEX IF NOT EXISTS "Ticket_category_idx" ON "Ticket"("category");
