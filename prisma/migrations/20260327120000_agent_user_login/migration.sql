-- AlterTable
ALTER TABLE "AgentUser" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "AgentUser" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "AgentUser_username_key" ON "AgentUser"("username");
