/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,subCategoryId]` on the table `EmployeeCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmployeeCategory_employeeId_subCategoryId_key" ON "EmployeeCategory"("employeeId", "subCategoryId");
