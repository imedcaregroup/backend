-- CreateEnum
CREATE TYPE "SubCategoryType" AS ENUM ('NORMAL', 'SPECIAL_OFFER_ONLY');

-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN     "type" "SubCategoryType" NOT NULL DEFAULT 'NORMAL';
