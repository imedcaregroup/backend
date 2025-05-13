-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_medicalId_fkey";

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "employeeId" INTEGER,
ALTER COLUMN "medicalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
