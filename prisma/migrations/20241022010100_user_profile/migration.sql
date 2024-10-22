/*
  Warnings:

  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pin` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "city",
DROP COLUMN "district",
DROP COLUMN "pin",
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;
