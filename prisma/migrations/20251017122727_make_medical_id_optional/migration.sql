-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_medicalId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "medicalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
