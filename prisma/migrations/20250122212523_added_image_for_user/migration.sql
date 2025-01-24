/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `subCategoryId` on the `Order` table. All the data in the column will be lost.
  - The `fileUrl` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `services` to the `Medical` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_subCategoryId_fkey";

-- AlterTable
ALTER TABLE "Medical" DROP COLUMN "services",
ADD COLUMN     "services" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "categoryId",
DROP COLUMN "serviceId",
DROP COLUMN "subCategoryId",
ADD COLUMN     "doctor" TEXT,
ALTER COLUMN "address" DROP NOT NULL,
DROP COLUMN "fileUrl",
ADD COLUMN     "fileUrl" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "imageUrl" TEXT DEFAULT 'https://thumbs.dreamstime.com/b/profile-anonymous-face-icon-gray-silhouette-person-male-default-avatar-photo-placeholder-white-background-vector-illustration-106473768.jpg',
ALTER COLUMN "address" DROP DEFAULT;

-- CreateTable
CREATE TABLE "OrderSubCategory" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subCategoryId" INTEGER NOT NULL,

    CONSTRAINT "OrderSubCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_subCategoryId_to_SubCategory" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_subCategoryId_to_Orders" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSubCategory" ADD CONSTRAINT "OrderSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
