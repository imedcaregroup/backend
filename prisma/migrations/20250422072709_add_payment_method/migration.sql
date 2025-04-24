-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'Card');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" DEFAULT 'COD';
