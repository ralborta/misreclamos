-- CreateTable
CREATE TABLE "Legado" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Legado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Legado_createdAt_idx" ON "Legado"("createdAt");
