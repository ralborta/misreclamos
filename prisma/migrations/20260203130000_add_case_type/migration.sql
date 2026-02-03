-- CreateTable
CREATE TABLE "CaseType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "legalType" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'slate-500',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseType_slug_key" ON "CaseType"("slug");
CREATE INDEX "CaseType_order_idx" ON "CaseType"("order");

-- Datos iniciales (tipos de caso)
INSERT INTO "CaseType" ("id", "slug", "label", "legalType", "color", "order", "createdAt", "updatedAt") VALUES
  ('ct-accidente-transito', 'accidente-transito', 'Accidente de tránsito', 'Accidente de tránsito', 'amber-500', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ct-trabajo', 'trabajo', 'Trabajo', 'Trabajo', 'blue-500', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ct-accidente-de-trabajo', 'accidente-de-trabajo', 'Accidente de trabajo', 'Accidente de trabajo', 'orange-500', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ct-sucesiones', 'sucesiones', 'Sucesiones', 'Sucesiones', 'violet-500', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ct-amparo-de-salud', 'amparo-de-salud', 'Amparo de salud', 'Amparo de salud', 'emerald-500', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ct-reclamos-comerciales', 'reclamos-comerciales', 'Reclamos comerciales', 'Reclamos comerciales', 'slate-500', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ct-sin-caso', 'sin-caso', 'Sin caso', 'Sin caso', 'slate-400', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
