-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refounded" BOOLEAN DEFAULT false,
ADD COLUMN     "refoundedAmount" DOUBLE PRECISION DEFAULT 0;
