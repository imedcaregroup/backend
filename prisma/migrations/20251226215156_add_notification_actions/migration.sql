-- CreateEnum
CREATE TYPE "NotificationActionType" AS ENUM ('NONE', 'INTERNAL_URL', 'EXTERNAL_URL', 'ENTITY');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actionType" "NotificationActionType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "data" JSONB,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT;
