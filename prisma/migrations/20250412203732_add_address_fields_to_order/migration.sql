/*
  Warnings:

  - Added the required column `entrance` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floor` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "apartment" TEXT,
ADD COLUMN     "entrance" TEXT,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "intercom" TEXT;
