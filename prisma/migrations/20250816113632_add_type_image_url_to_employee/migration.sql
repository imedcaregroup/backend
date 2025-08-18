-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('DOCTOR', 'NURSE');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "type" "EmployeeType" NOT NULL DEFAULT 'NURSE';