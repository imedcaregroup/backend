-- AlterTable
ALTER TABLE "Medical" ADD COLUMN     "address_en" TEXT,
ADD COLUMN     "address_ru" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "services_en" TEXT,
ADD COLUMN     "services_ru" TEXT,
ALTER COLUMN "address" DROP NOT NULL;
