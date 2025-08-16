-- CreateTable
CREATE TABLE "Specialization" (
    "id" SERIAL NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "name_az" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);
