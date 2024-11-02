-- CreateTable
CREATE TABLE "MedicalCategory" (
    "id" SERIAL NOT NULL,
    "medicalId" INTEGER NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "MedicalCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicalCategory" ADD CONSTRAINT "MedicalCategory_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCategory" ADD CONSTRAINT "MedicalCategory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
