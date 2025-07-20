-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "forAnotherPerson" BOOLEAN DEFAULT false,
ADD COLUMN     "forAnotherPersonName" TEXT,
ADD COLUMN     "forAnotherPersonPhone" TEXT;
