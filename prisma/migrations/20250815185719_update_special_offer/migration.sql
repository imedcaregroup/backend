/*
  Warnings:

  - You are about to drop the column `specialOfferId` on the `SubCategory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SubCategory" DROP CONSTRAINT "SubCategory_specialOfferId_fkey";

-- AlterTable
ALTER TABLE "SubCategory" DROP COLUMN "specialOfferId";

-- CreateTable
CREATE TABLE "_SpecialOfferToSubCategory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SpecialOfferToSubCategory_AB_unique" ON "_SpecialOfferToSubCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_SpecialOfferToSubCategory_B_index" ON "_SpecialOfferToSubCategory"("B");

-- AddForeignKey
ALTER TABLE "_SpecialOfferToSubCategory" ADD CONSTRAINT "_SpecialOfferToSubCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "SpecialOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialOfferToSubCategory" ADD CONSTRAINT "_SpecialOfferToSubCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
