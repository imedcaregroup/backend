-- CreateEnum
CREATE TYPE "PhoneOtpIntent" AS ENUM ('SIGNUP', 'PHONE_CHANGE');

-- CreateTable
CREATE TABLE "PhoneOtpCode" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "deviceId" TEXT,
    "intent" "PhoneOtpIntent" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "taskId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneOtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneOtpCode_phone_intent_expiresAt_idx" ON "PhoneOtpCode"("phone", "intent", "expiresAt");

-- CreateIndex
CREATE INDEX "PhoneOtpCode_expiresAt_idx" ON "PhoneOtpCode"("expiresAt");
