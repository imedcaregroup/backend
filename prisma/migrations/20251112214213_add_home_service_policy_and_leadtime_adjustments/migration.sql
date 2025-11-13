/*
  Warnings:

  - You are about to drop the column `feeAzn` on the `DistancePricingTier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DistancePricingTier" DROP COLUMN "feeAzn";

-- CreateTable
CREATE TABLE "HomeServicePolicy" (
    "id" SERIAL NOT NULL,
    "medicalId" INTEGER NOT NULL,
    "freeOverAzn" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HomeServicePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadtimeAdjustment" (
    "id" SERIAL NOT NULL,
    "distancePricingTierId" INTEGER NOT NULL,
    "minLeadHours" INTEGER NOT NULL DEFAULT 0,
    "maxLeadHours" INTEGER,
    "feeAzn" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "LeadtimeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeServicePolicy_medicalId_key" ON "HomeServicePolicy"("medicalId");

-- CreateIndex
CREATE INDEX "LeadtimeAdjustment_distancePricingTierId_minLeadHours_maxLe_idx" ON "LeadtimeAdjustment"("distancePricingTierId", "minLeadHours", "maxLeadHours");

-- AddForeignKey
ALTER TABLE "HomeServicePolicy" ADD CONSTRAINT "HomeServicePolicy_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadtimeAdjustment" ADD CONSTRAINT "LeadtimeAdjustment_distancePricingTierId_fkey" FOREIGN KEY ("distancePricingTierId") REFERENCES "DistancePricingTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
