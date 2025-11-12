-- AlterTable
ALTER TABLE "SpecialOffer" ADD COLUMN     "benefits_az" TEXT[],
ADD COLUMN     "benefits_en" TEXT[],
ADD COLUMN     "benefits_ru" TEXT[],
ADD COLUMN     "forWhom_az" TEXT[],
ADD COLUMN     "forWhom_en" TEXT[],
ADD COLUMN     "forWhom_ru" TEXT[];
