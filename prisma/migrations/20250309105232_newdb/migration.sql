/*
  Warnings:

  - You are about to alter the column `doctor` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- DropForeignKey
ALTER TABLE "OrderSubCategory" DROP CONSTRAINT "OrderSubCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "OrderSubCategory" DROP CONSTRAINT "OrderSubCategory_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderSubCategory" DROP CONSTRAINT "OrderSubCategory_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "OrderSubCategory" DROP CONSTRAINT "OrderSubCategory_subCategoryId_to_Orders";

-- DropForeignKey
ALTER TABLE "OrderSubCategory" DROP CONSTRAINT "OrderSubCategory_subCategoryId_to_SubCategory";

-- AlterTable
ALTER TABLE "Medical" ALTER COLUMN "services" DROP NOT NULL,
ALTER COLUMN "services" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "serviceId" INTEGER,
ALTER COLUMN "doctor" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "fileUrl" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "address" SET DEFAULT 'None';

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_subCategoryId_to_SubCategory" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
