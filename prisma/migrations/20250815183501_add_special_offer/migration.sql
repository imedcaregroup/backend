-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "specialOfferId" INTEGER;

-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN     "specialOfferId" INTEGER;

-- CreateTable
CREATE TABLE "SpecialOffer" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "title_en" TEXT,
    "title_az" TEXT,
    "title_ru" TEXT,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "serviceId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "medicalId" INTEGER NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION,

    CONSTRAINT "SpecialOffer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_specialOfferId_fkey" FOREIGN KEY ("specialOfferId") REFERENCES "SpecialOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_specialOfferId_fkey" FOREIGN KEY ("specialOfferId") REFERENCES "SpecialOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialOffer" ADD CONSTRAINT "SpecialOffer_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialOffer" ADD CONSTRAINT "SpecialOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialOffer" ADD CONSTRAINT "SpecialOffer_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
