-- DropForeignKey
ALTER TABLE "EmployeeCategory" DROP CONSTRAINT "EmployeeCategory_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeMedical" DROP CONSTRAINT "EmployeeMedical_employeeId_fkey";

-- AddForeignKey
ALTER TABLE "EmployeeCategory" ADD CONSTRAINT "EmployeeCategory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeMedical" ADD CONSTRAINT "EmployeeMedical_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
