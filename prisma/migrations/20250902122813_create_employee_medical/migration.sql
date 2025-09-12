-- CreateTable
CREATE TABLE "EmployeeMedical" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER,
    "medicalId" INTEGER,

    CONSTRAINT "EmployeeMedical_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeMedical_employeeId_medicalId_key" ON "EmployeeMedical"("employeeId", "medicalId");

-- AddForeignKey
ALTER TABLE "EmployeeMedical" ADD CONSTRAINT "EmployeeMedical_medicalId_fkey" FOREIGN KEY ("medicalId") REFERENCES "Medical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeMedical" ADD CONSTRAINT "EmployeeMedical_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
