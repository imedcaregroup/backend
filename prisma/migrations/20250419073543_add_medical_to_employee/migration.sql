-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "medicalId" INTEGER;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE SET NULL ON UPDATE CASCADE;
