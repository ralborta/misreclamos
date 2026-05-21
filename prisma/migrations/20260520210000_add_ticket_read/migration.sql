-- CreateTable
CREATE TABLE "TicketRead" (
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketRead_pkey" PRIMARY KEY ("ticketId","userId")
);

-- CreateIndex
CREATE INDEX "TicketRead_userId_idx" ON "TicketRead"("userId");

-- AddForeignKey
ALTER TABLE "TicketRead" ADD CONSTRAINT "TicketRead_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketRead" ADD CONSTRAINT "TicketRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AgentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
