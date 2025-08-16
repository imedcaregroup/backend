/*
  Warnings:

  - You are about to drop the `Specialization` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('DOCTOR', 'NURSE');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "type" "EmployeeType" NOT NULL DEFAULT 'NURSE';

-- DropTable
DROP TABLE "Specialization";
