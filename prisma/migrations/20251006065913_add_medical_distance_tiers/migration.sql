/*
  Warnings:

  - You are about to drop the column `serviceFee` on the `Medical` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Medical" DROP COLUMN "serviceFee";

-- CreateTable
CREATE TABLE "DistancePricingTier" (
    "id" SERIAL NOT NULL,
    "medicalId" INTEGER NOT NULL,
    "minKm" DECIMAL(10,2) NOT NULL,
    "maxKm" DECIMAL(10,2),
    "feeAzn" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "DistancePricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DistancePricingTier_medicalId_minKm_maxKm_idx" ON "DistancePricingTier"("medicalId", "minKm", "maxKm");

-- AddForeignKey
ALTER TABLE "DistancePricingTier" ADD CONSTRAINT "DistancePricingTier_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
