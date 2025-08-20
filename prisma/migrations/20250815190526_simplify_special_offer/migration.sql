/*
  Warnings:

  - You are about to drop the column `categoryId` on the `SpecialOffer` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `SpecialOffer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpecialOffer" DROP CONSTRAINT "SpecialOffer_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "SpecialOffer" DROP CONSTRAINT "SpecialOffer_serviceId_fkey";

-- AlterTable
ALTER TABLE "SpecialOffer" DROP COLUMN "categoryId",
DROP COLUMN "serviceId";
