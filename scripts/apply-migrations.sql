-- Script para aplicar todas las migraciones manualmente en Railway
-- Copia y pega este contenido en Railway → Database → Query

-- ============================================
-- MIGRACIÓN 1: Inicial (20251226145518_init)
-- ============================================

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('ADMIN', 'SUPPORT');

CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "TicketCategory" AS ENUM ('TECH_SUPPORT', 'BILLING', 'SALES', 'OTHER');

CREATE TYPE "TicketChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'WEB');

CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL_NOTE');

CREATE TYPE "MessageFrom" AS ENUM ('CUSTOMER', 'BOT', 'HUMAN');

CREATE TYPE "TicketEventType" AS ENUM ('STATUS_CHANGED', 'ASSIGNED', 'TAGGED', 'PRIORITY_CHANGED', 'AUTO_REPLY', 'ESCALATED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AgentRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "channel" "TicketChannel" NOT NULL,
    "assignedToUserId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "from" "MessageFrom" NOT NULL,
    "text" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "externalMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "type" "TicketEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketTag" (
    "ticketId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "TicketTag_pkey" PRIMARY KEY ("ticketId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
CREATE UNIQUE INDEX "AgentUser_email_key" ON "AgentUser"("email");
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");
CREATE INDEX "Ticket_customerId_idx" ON "Ticket"("customerId");
CREATE INDEX "Ticket_assignedToUserId_idx" ON "Ticket"("assignedToUserId");
CREATE INDEX "Ticket_lastMessageAt_idx" ON "Ticket"("lastMessageAt");
CREATE UNIQUE INDEX "TicketMessage_externalMessageId_key" ON "TicketMessage"("externalMessageId");
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");
CREATE INDEX "TicketEvent_ticketId_createdAt_idx" ON "TicketEvent"("ticketId", "createdAt");
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "AgentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketTag" ADD CONSTRAINT "TicketTag_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketTag" ADD CONSTRAINT "TicketTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- MIGRACIÓN 2: AI Summary Fields
-- ============================================
ALTER TABLE "Ticket" ADD COLUMN "aiSummary" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "resolution" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "resolvedByAI" BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- MIGRACIÓN 3: Phone to AgentUser
-- ============================================
ALTER TABLE "AgentUser" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';

-- ============================================
-- MIGRACIÓN 4: Contact Name to Ticket
-- ============================================
ALTER TABLE "Ticket" ADD COLUMN "contactName" TEXT NOT NULL DEFAULT 'Sin nombre';

-- ============================================
-- MIGRACIÓN 5: Attachments to TicketMessage
-- ============================================
ALTER TABLE "TicketMessage" ADD COLUMN "attachments" JSONB;

-- ============================================
-- MIGRACIÓN 6: Campos Legales (20250130000000_add_legal_fields)
-- ============================================

-- Cambiar categorías a tipos legales
UPDATE "Ticket" SET category = 'OTHER' WHERE category IN ('TECH_SUPPORT', 'BILLING', 'SALES', 'OTHER');

ALTER TYPE "TicketCategory" RENAME TO "TicketCategory_old";
CREATE TYPE "TicketCategory" AS ENUM ('LABORAL', 'CIVIL', 'COMERCIAL', 'PENAL', 'FAMILIA', 'ADMINISTRATIVO', 'TRIBUTARIO', 'PREVISIONAL', 'OTRO');
ALTER TABLE "Ticket" ALTER COLUMN "category" TYPE "TicketCategory" USING category::text::"TicketCategory";
DROP TYPE "TicketCategory_old";

-- Campos legales en Customer
ALTER TABLE "Customer" ADD COLUMN "dni" TEXT;
ALTER TABLE "Customer" ADD COLUMN "email" TEXT;
ALTER TABLE "Customer" ADD COLUMN "address" TEXT;
ALTER TABLE "Customer" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "notes" TEXT;
ALTER TABLE "Customer" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Customer_dni_idx" ON "Customer"("dni");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");

-- Campos profesionales en AgentUser
ALTER TABLE "AgentUser" ADD COLUMN "matricula" TEXT;
ALTER TABLE "AgentUser" ADD COLUMN "especializacion" TEXT;
ALTER TABLE "AgentUser" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Campos procesales en Ticket
ALTER TABLE "Ticket" ADD COLUMN "expedienteNumber" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "court" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "legalType" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "amount" DECIMAL(65,30);
ALTER TABLE "Ticket" ADD COLUMN "importantDates" JSONB;
ALTER TABLE "Ticket" ADD COLUMN "caseNotes" TEXT;

CREATE INDEX IF NOT EXISTS "Ticket_expedienteNumber_idx" ON "Ticket"("expedienteNumber");
CREATE INDEX IF NOT EXISTS "Ticket_category_idx" ON "Ticket"("category");
