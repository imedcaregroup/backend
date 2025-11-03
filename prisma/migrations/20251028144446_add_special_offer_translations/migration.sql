/*
  Warnings:

  - You are about to drop the column `description` on the `SpecialOffer` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `SpecialOffer` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `SpecialOffer` table. All the data in the column will be lost.
  - Made the column `title_en` on table `SpecialOffer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title_az` on table `SpecialOffer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title_ru` on table `SpecialOffer` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill existing NULLs
UPDATE "SpecialOffer" SET "title_az" = '' WHERE "title_az" IS NULL;
UPDATE "SpecialOffer" SET "title_en" = '' WHERE "title_en" IS NULL;
UPDATE "SpecialOffer" SET "title_ru" = '' WHERE "title_ru" IS NULL;

-- AlterTable
ALTER TABLE "SpecialOffer" DROP COLUMN "description",
DROP COLUMN "imageUrl",
DROP COLUMN "title",
ADD COLUMN     "description_az" TEXT,
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "description_ru" TEXT,
ADD COLUMN     "imageUrl_az" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageUrl_en" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageUrl_ru" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "title_en" SET NOT NULL,
ALTER COLUMN "title_en" SET DEFAULT '',
ALTER COLUMN "title_az" SET NOT NULL,
ALTER COLUMN "title_az" SET DEFAULT '',
ALTER COLUMN "title_ru" SET NOT NULL,
ALTER COLUMN "title_ru" SET DEFAULT '';
