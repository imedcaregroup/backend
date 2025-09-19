/*
  Warnings:

  - You are about to drop the column `experienceYears` on the `Employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "experienceYears",
ADD COLUMN     "experienceYears_az" TEXT,
ADD COLUMN     "experienceYears_en" TEXT,
ADD COLUMN     "experienceYears_ru" TEXT,
ADD COLUMN     "patientsCount" INTEGER NOT NULL DEFAULT 0;
